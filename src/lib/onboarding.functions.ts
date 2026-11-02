import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SectionContent } from "./sections";

/** A company as the browser sees it. */
export type AccessCompany = {
  id: string;
  slug: string;
  name: string;
  sector: string | null;
  demo: boolean;
  status: string;
  build_status: string;
  build_step: string | null;
  build_error: string | null;
  section_map: { key: string; label: string; include: boolean; angle: string }[];
  one_liner: string | null;
  website_url: string | null;
  isOwner: boolean;
};

export type Access = {
  email: string;
  isAdmin: boolean;
  requireApproval: boolean;
  companies: AccessCompany[];
};

const COLS =
  "id, slug, name, sector, demo, status, build_status, build_step, build_error, section_map, profile, team_domain, created_by, created_email, website_url, play_url, appstore_url, created_at";

type Row = {
  id: string;
  slug: string;
  name: string;
  sector: string | null;
  demo: boolean;
  status: string;
  build_status: string;
  build_step: string | null;
  build_error: string | null;
  section_map: AccessCompany["section_map"] | null;
  profile: { one_liner?: string } | null;
  team_domain: string | null;
  created_by: string | null;
  created_email: string | null;
  website_url: string | null;
  play_url: string | null;
  appstore_url: string | null;
  created_at: string;
};

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const requireApproval = () => process.env["REQUIRE_APPROVAL"] === "true";
const maxCompanies = () => Number(process.env["MAX_COMPANIES_PER_USER"] || 3);

async function ctx() {
  const { requireTeamUser } = await import("./require-user.server");
  const user = await requireTeamUser();
  const { admin } = await import("./campaigns.server");
  const isAdmin = list(process.env["ADMIN_EMAILS"]).includes(user.email.toLowerCase());
  return { user, sb: admin(), isAdmin };
}

type Ctx = Awaited<ReturnType<typeof ctx>>;

function shape(c: Row, userId: string): AccessCompany {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    sector: c.sector,
    demo: c.demo,
    status: c.status,
    build_status: c.build_status,
    build_step: c.build_step,
    build_error: c.build_error,
    section_map: c.section_map ?? [],
    one_liner: c.profile?.one_liner ?? null,
    website_url: c.website_url,
    isOwner: c.created_by === userId,
  };
}

async function canAccess({ sb, user, isAdmin }: Ctx, companyId: string) {
  if (isAdmin) return true;
  const { data } = await sb.from("company_members").select("id").eq("company_id", companyId).eq("user_id", user.id).maybeSingle();
  return !!data;
}

/** The companies this person can open: the demo, their own, and their team's (same work domain). */
export const getMyAccess = createServerFn({ method: "POST" }).handler(async (): Promise<Access> => {
  const c = await ctx();
  const { sb, user, isAdmin } = c;
  const { emailDomain, isPersonalEmail } = await import("./sections");

  // Join any company a teammate on the same work domain has added.
  if (!isPersonalEmail(user.email)) {
    const { data: team } = await sb.from("companies").select("id").eq("team_domain", emailDomain(user.email));
    if (team?.length) {
      await sb
        .from("company_members")
        .upsert(
          team.map((t: { id: string }) => ({ company_id: t.id, user_id: user.id, email: user.email })),
          { onConflict: "company_id,user_id", ignoreDuplicates: true },
        );
    }
  }

  const { data: memberships } = await sb.from("company_members").select("company_id").eq("user_id", user.id);
  const ids = (memberships ?? []).map((m: { company_id: string }) => m.company_id);
  const { data: demos } = await sb.from("companies").select(COLS).eq("demo", true).order("created_at");
  const { data: mine } = ids.length
    ? await sb.from("companies").select(COLS).in("id", ids).eq("demo", false).neq("status", "revoked").order("created_at")
    : { data: [] };

  return {
    email: user.email,
    isAdmin,
    requireApproval: requireApproval(),
    companies: [...((mine ?? []) as Row[]), ...((demos ?? []) as Row[])].map((r) => shape(r, user.id)),
  };
});

const optionalUrl = z.string().trim().max(500).url().or(z.literal("")).optional();

/** Adds a company from its website (and optional app store links) and queues its build. */
export const addCompany = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        website: z.string().trim().url().max(500),
        play: optionalUrl,
        appstore: optionalUrl,
        country: z.string().trim().max(60).optional(),
        competitors: z.string().trim().max(500).optional(),
        description: z.string().trim().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { user, sb } = await ctx();
    const { assertPublicUrl } = await import("./builder.server");
    for (const u of [data.website, data.play, data.appstore]) if (u) assertPublicUrl(u);

    const { count } = await sb
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("created_by", user.id)
      .neq("status", "revoked");
    if ((count ?? 0) >= maxCompanies()) {
      throw new Error(`You can add up to ${maxCompanies()} companies. Remove one to add another.`);
    }

    const { emailDomain, isPersonalEmail } = await import("./sections");
    const base = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "company";
    const slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
    const pending = requireApproval();
    const { data: row, error } = await sb
      .from("companies")
      .insert({
        slug,
        name: data.name,
        team_domain: isPersonalEmail(user.email) ? null : emailDomain(user.email),
        website_url: data.website,
        play_url: data.play || null,
        appstore_url: data.appstore || null,
        country: data.country || "India",
        competitors_hint: data.competitors || null,
        description_hint: data.description || null,
        status: pending ? "pending" : "approved",
        build_status: "queued",
        build_step: pending ? "Waiting for approval" : "Waiting to start",
        created_by: user.id,
        created_email: user.email,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error("Could not save the company. Try again.");
    await sb.from("company_members").insert({ company_id: row.id, user_id: user.id, email: user.email, role: "owner" });

    if (pending) {
      const admins = list(process.env["ADMIN_EMAILS"]);
      const { sendTemplateEmail } = await import("./email-templates/send-email");
      for (const to of admins) {
        try {
          await sendTemplateEmail("company-request", to, {
            templateData: { company: data.name, email: user.email, website: data.website, play: data.play, appstore: data.appstore },
          });
        } catch (e) {
          console.error("request email failed", e);
        }
      }
    }
    return { id: row.id as string, pending };
  });

/** Owner or admin removes a company and everything generated for it. */
export const removeCompany = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { user, sb, isAdmin } = await ctx();
    const { data: c } = await sb.from("companies").select("created_by, demo").eq("id", data.companyId).single();
    if (!c || c.demo) throw new Error("This company cannot be removed.");
    if (!isAdmin && c.created_by !== user.id) throw new Error("Only the person who added this company can remove it.");
    await sb.from("companies").delete().eq("id", data.companyId);
    return { ok: true };
  });

export const adminListCompanies = createServerFn({ method: "POST" }).handler(async () => {
  const { sb, isAdmin } = await ctx();
  if (!isAdmin) throw new Error("Admins only.");
  const { data } = await sb.from("companies").select(COLS).eq("demo", false).order("created_at", { ascending: false });
  const { data: members } = await sb.from("company_members").select("company_id, email");
  return ((data ?? []) as Row[]).map((c) => ({
    id: c.id,
    name: c.name,
    team_domain: c.team_domain,
    status: c.status,
    build_status: c.build_status,
    build_step: c.build_step,
    build_error: c.build_error,
    created_email: c.created_email,
    website_url: c.website_url,
    play_url: c.play_url,
    appstore_url: c.appstore_url,
    created_at: c.created_at,
    members: (members ?? []).filter((m: { company_id: string }) => m.company_id === c.id).map((m: { email: string }) => m.email),
  }));
});

export const adminDecide = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), action: z.enum(["approve", "reject", "revoke"]) }).parse(d))
  .handler(async ({ data }) => {
    const { sb, isAdmin } = await ctx();
    if (!isAdmin) throw new Error("Admins only.");
    const { data: c } = await sb.from("companies").select("name, created_email").eq("id", data.id).single();
    if (data.action === "approve") {
      await sb
        .from("companies")
        .update({ status: "approved", build_status: "queued", build_error: null, build_step: "Waiting to start" })
        .eq("id", data.id);
      return { ok: true };
    }
    await sb.from("companies").update({ status: data.action === "reject" ? "rejected" : "revoked" }).eq("id", data.id);
    if (data.action === "reject" && c?.created_email) {
      try {
        const { sendTemplateEmail } = await import("./email-templates/send-email");
        await sendTemplateEmail("company-status", c.created_email, { templateData: { company: c.name, status: "rejected" } });
      } catch {
        /* the decision stands even if the email fails */
      }
    }
    return { ok: true };
  });

/** Moves a build forward by one step. The open dashboard calls this every few seconds. */
export const advanceBuild = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const c = await ctx();
    if (!(await canAccess(c, data.companyId))) throw new Error("No access.");
    const { buildStep } = await import("./builder.server");
    await buildStep(data.companyId);
    const { data: row } = await c.sb.from("companies").select("build_status, build_step, build_error").eq("id", data.companyId).single();
    const { data: secs } = await c.sb.from("company_sections").select("status").eq("company_id", data.companyId);
    const total = secs?.length ?? 0;
    const done = (secs ?? []).filter((s: { status: string }) => s.status !== "pending").length;
    return { ...(row as { build_status: string; build_step: string | null; build_error: string | null }), total, done };
  });

/** Rebuilds the whole dashboard, or one section, for a company. */
export const rebuildCompany = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid(), sectionKey: z.string().max(40).optional() }).parse(d))
  .handler(async ({ data }) => {
    const c = await ctx();
    if (!(await canAccess(c, data.companyId))) throw new Error("No access.");
    if (data.sectionKey) {
      await c.sb.from("company_sections").update({ status: "pending" }).eq("company_id", data.companyId).eq("section_key", data.sectionKey);
      await c.sb.from("companies").update({ build_status: "building", build_error: null }).eq("id", data.companyId).eq("demo", false);
    } else {
      await c.sb
        .from("companies")
        .update({ build_status: "queued", build_error: null, build_step: "Waiting to start" })
        .eq("id", data.companyId)
        .eq("demo", false);
    }
    return { ok: true };
  });

export type SectionRow = {
  section_key: string;
  status: string;
  content: SectionContent | null;
  error: string | null;
  generated_at: string | null;
};

export const getCompanySections = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const c = await ctx();
    if (!(await canAccess(c, data.companyId))) throw new Error("No access.");
    const { data: rows } = await c.sb
      .from("company_sections")
      .select("section_key, status, content, error, generated_at")
      .eq("company_id", data.companyId);
    return (rows ?? []) as SectionRow[];
  });

/** Carries on a paused or failed build from where it stopped, retrying only unfinished sections. */
export const resumeBuild = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const c = await ctx();
    if (!(await canAccess(c, data.companyId))) throw new Error("No access.");
    const { data: row } = await c.sb.from("companies").select("section_map, demo, status").eq("id", data.companyId).single();
    if (!row || row.demo || row.status !== "approved") return { ok: false };
    const hasProfile = Array.isArray(row.section_map) && row.section_map.length > 0;
    if (hasProfile) {
      await c.sb.from("company_sections").update({ status: "pending", error: null }).eq("company_id", data.companyId).eq("status", "failed");
    }
    await c.sb
      .from("companies")
      .update({ build_status: hasProfile ? "building" : "queued", build_error: null })
      .eq("id", data.companyId);
    return { ok: true };
  });
