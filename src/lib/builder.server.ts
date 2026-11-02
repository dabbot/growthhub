/**
 * Builds a company's dashboard from its website and app store listings.
 *
 * Step 1 reads the public pages and asks the AI for a business profile plus a
 * section map (every section renamed to fit the business, or dropped if it does
 * not apply). Step 2 generates the sections in small batches. Each call to
 * buildStep does one bounded piece of work, so the browser can drive the build.
 */
import { aiBaseUrl, aiHeaders, aiKey, aiModel } from "./ai.server";
import { admin } from "./campaigns.server";
import { SECTIONS, type SectionMapEntry } from "./sections";

/** AI is rate limited or out of credit: stop for now, resume later. */
export class PauseError extends Error {}

const BATCH_SIZE = 4;
const FETCH_TIMEOUT_MS = 15_000;

/* ----------------------------------------------------------------- reading */

/**
 * Only fetch public http(s) pages. Blocks localhost, private and link-local
 * ranges and internal hostnames so the reader cannot be pointed at the
 * server's own network.
 */
export function assertPublicUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That is not a valid web address.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only http and https links are supported.");
  if (url.username || url.password) throw new Error("Links with a username or password are not supported.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const blockedName =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    !host.includes(".");
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  const privateV4 =
    ipv4 &&
    (() => {
      const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
      return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
    })();
  const privateV6 = host.includes(":") && (host === "::1" || host === "::" || /^(fc|fd|fe80)/.test(host) || host.startsWith("::ffff:"));
  if (blockedName || privateV4 || privateV6) throw new Error("That link points to a private address.");
  return url;
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function meta(html: string, name: string) {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)`, "i");
  return html.match(re)?.[1] ?? "";
}

async function fetchText(raw: string) {
  // Follow redirects by hand so every hop is checked against the private-address rules.
  let url = assertPublicUrl(raw);
  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GrowthDashboardBot/1.0)", "Accept-Language": "en" },
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const next = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && next) {
      url = assertPublicUrl(new URL(next, url).toString());
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.text()).slice(0, 600_000);
  }
  throw new Error("Too many redirects.");
}

type CompanyRow = {
  id: string;
  name: string;
  country: string;
  website_url: string | null;
  play_url: string | null;
  appstore_url: string | null;
  competitors_hint: string | null;
  description_hint: string | null;
  build_status: string;
  section_map: SectionMapEntry[];
  profile: Profile & { _source?: string };
  created_email: string | null;
};

export async function readPublicPages(c: Pick<CompanyRow, "website_url" | "play_url" | "appstore_url" | "description_hint" | "country">) {
  const parts: string[] = [];
  if (c.website_url) {
    try {
      const html = await fetchText(c.website_url);
      const title = html.match(/<title[^>]*>([^<]*)/i)?.[1] ?? "";
      parts.push(
        `## Website ${c.website_url}\nTitle: ${title}\nDescription: ${meta(html, "description") || meta(html, "og:description")}\nText: ${stripHtml(html).slice(0, 6000)}`,
      );
    } catch (e) {
      parts.push(`## Website ${c.website_url}\n(Could not read: ${(e as Error).message})`);
    }
  }
  if (c.appstore_url) {
    const id = c.appstore_url.match(/id(\d+)/)?.[1];
    if (id) {
      try {
        const res = await fetch(`https://itunes.apple.com/lookup?id=${id}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        const j = (await res.json()) as { results?: Record<string, unknown>[] };
        const r = j.results?.[0];
        if (r) {
          parts.push(
            `## App Store\nName: ${r["trackName"]}\nSeller: ${r["sellerName"]}\nGenre: ${r["primaryGenreName"]}\nRating: ${r["averageUserRating"]} from ${r["userRatingCount"]} ratings\nPrice: ${r["formattedPrice"]}\nDescription: ${String(r["description"] ?? "").slice(0, 3000)}`,
          );
        }
      } catch {
        /* the rest of the read still goes ahead */
      }
    }
  }
  if (c.play_url) {
    try {
      const html = await fetchText(c.play_url);
      const rating = html.match(/"starRating"[^0-9]*([0-9.]+)/)?.[1] ?? html.match(/([0-9]\.[0-9])\s*star/i)?.[1] ?? "";
      const installs = html.match(/([0-9.,]+[KMB]?\+)\s*<\/div><div[^>]*>Downloads/i)?.[1] ?? "";
      parts.push(
        `## Google Play\nTitle: ${meta(html, "og:title")}\nDescription: ${meta(html, "description")}\nRating: ${rating}\nDownloads: ${installs}\nText: ${stripHtml(html).slice(0, 3000)}`,
      );
    } catch (e) {
      parts.push(`## Google Play\n(Could not read: ${(e as Error).message})`);
    }
  }
  if (c.description_hint) parts.push(`## Description from the team\n${c.description_hint}`);
  return parts.join("\n\n").slice(0, 16000);
}

/* ---------------------------------------------------------------------- AI */

async function aiJson<T>(instructions: string, input: string, name: string, schema: object): Promise<T> {
  if (!aiKey()) throw new PauseError("AI is not configured. Set AI_API_KEY and resume the build.");
  const res = await fetch(`${aiBaseUrl()}/responses`, {
    method: "POST",
    headers: aiHeaders(),
    body: JSON.stringify({
      model: aiModel(),
      instructions,
      input,
      reasoning: { effort: "low" },
      store: false,
      text: { format: { type: "json_schema", name, schema, strict: true } },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`builder AI [${res.status}]: ${body.slice(0, 500)}`);
    if (res.status === 401 || res.status === 403) throw new PauseError("The AI key was rejected. Check AI_API_KEY.");
    if (res.status === 402) throw new PauseError("The AI account is out of credit.");
    if (res.status === 429) throw new PauseError("The AI is rate limited. Resume in a minute.");
    throw new Error(`AI request failed [${res.status}]`);
  }
  const json = (await res.json()) as {
    output_text?: string;
    output?: { type?: string; content?: { type?: string; text?: string }[] }[];
  };
  const text =
    json.output_text ??
    (json.output ?? [])
      .flatMap((o) => o.content ?? [])
      .filter((p) => p.type === "output_text")
      .map((p) => p.text ?? "")
      .join("");
  if (!text) throw new Error("The AI returned an empty answer.");
  return JSON.parse(text) as T;
}

const str = { type: "string" };

const PROFILE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "sector", "one_liner", "business_model", "customer", "geography", "revenue_model", "north_star_metric", "competitors", "incumbent", "sections"],
  properties: {
    name: str,
    sector: str,
    one_liner: str,
    business_model: str,
    customer: str,
    geography: str,
    revenue_model: str,
    north_star_metric: str,
    competitors: { type: "array", items: str },
    incumbent: str,
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label", "include", "angle"],
        properties: {
          key: { type: "string", enum: SECTIONS.map((s) => s.key) },
          label: str,
          include: { type: "boolean" },
          angle: str,
        },
      },
    },
  },
};

const SECTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "headline", "summary", "metrics", "table", "bullets", "why_it_matters"],
  properties: {
    title: str,
    headline: str,
    summary: str,
    metrics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value", "badge", "note"],
        properties: { label: str, value: str, badge: { type: "string", enum: ["reported", "derived", "modelled"] }, note: str },
      },
    },
    table: {
      type: "object",
      additionalProperties: false,
      required: ["title", "columns", "rows"],
      properties: { title: str, columns: { type: "array", items: str }, rows: { type: "array", items: { type: "array", items: str } } },
    },
    bullets: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["title", "detail"], properties: { title: str, detail: str } },
    },
    why_it_matters: str,
  },
};

export type Profile = {
  name: string;
  sector: string;
  one_liner: string;
  business_model: string;
  customer: string;
  geography: string;
  revenue_model: string;
  north_star_metric: string;
  competitors: string[];
  incumbent: string;
  sections: SectionMapEntry[];
};

async function buildProfile(c: CompanyRow) {
  const source = await readPublicPages(c);
  const list = SECTIONS.map((s) => `- ${s.key}: "${s.label}" — ${s.intent}`).join("\n");
  const profile = await aiJson<Profile>(
    `You are a senior growth strategist. From the website and app store data, work out exactly what this business is. Then map a ${SECTIONS.length}-section growth dashboard onto it: for every section key give a label renamed to fit this business's domain (for example "Customer Universe" becomes "Borrower Universe" for a lending app), whether to include it (exclude only if it truly makes no sense), and a one-sentence angle describing what that section should show for THIS business. Include every key exactly once. Write in plain English for the company's home market.`,
    `Company name given: ${c.name}\nMain country: ${c.country}\nCompetitors the team named: ${c.competitors_hint || "none"}\n\nSections:\n${list}\n\nWhat we read:\n${source}`,
    "business_profile",
    PROFILE_SCHEMA,
  );
  return { profile, source };
}

async function buildSection(c: CompanyRow, key: string) {
  const def = SECTIONS.find((s) => s.key === key)!;
  const map = c.section_map.find((s) => s.key === key);
  const { sections: _sections, _source, ...profile } = c.profile;
  return aiJson(
    `You build one section of a growth dashboard for a specific company. Be concrete and quantitative. Rules:
- 3-6 metrics. Badge each: "reported" only if the number appears in the source data or is a well-known public fact; "derived" if calculated from reported numbers; otherwise "modelled". Put the source or assumption in note.
- A table with 4-10 rows that makes the section actionable (use empty columns and rows only if a table truly adds nothing).
- 3-6 bullets: concrete, named actions or insights.
- why_it_matters: one plain-language sentence for a busy executive.
- Use the currency and units of the company's home market. No preamble.`,
    `Company profile: ${JSON.stringify(profile)}\n\nSection: ${map?.label ?? def.label}\nWhat it must show: ${def.intent}\nAngle for this company: ${map?.angle ?? ""}\n\nWhat we read:\n${(_source ?? "").slice(0, 8000)}`,
    "dashboard_section",
    SECTION_SCHEMA,
  );
}

/* ------------------------------------------------------------------- build */

/** Runs one bounded build step for a company. Safe to call repeatedly; a lease prevents parallel runs. */
export async function buildStep(companyId: string) {
  const sb = admin();
  const now = new Date();
  const { data: locked } = await sb
    .from("companies")
    .update({ build_lock_until: new Date(now.getTime() + 5 * 60_000).toISOString() })
    .eq("id", companyId)
    .eq("status", "approved")
    .eq("demo", false)
    .in("build_status", ["queued", "building"])
    .or(`build_lock_until.is.null,build_lock_until.lt.${now.toISOString()}`)
    .select("*")
    .maybeSingle();
  if (!locked) return;
  const c = locked as CompanyRow;
  try {
    if (c.build_status === "queued") {
      await sb.from("companies").update({ build_step: "Reading your website and app store listings" }).eq("id", companyId);
      const { profile, source } = await buildProfile(c);
      const byKey = new Map(profile.sections.map((s) => [s.key, s]));
      const map: SectionMapEntry[] = SECTIONS.map((s) => byKey.get(s.key) ?? { key: s.key, label: s.label, include: true, angle: "" });
      await sb.from("company_sections").delete().eq("company_id", companyId);
      await sb
        .from("company_sections")
        .insert(map.filter((m) => m.include).map((m) => ({ company_id: companyId, section_key: m.key, status: "pending" })));
      await sb
        .from("companies")
        .update({
          profile: { ...profile, _source: source },
          section_map: map,
          sector: profile.sector,
          name: c.name || profile.name,
          build_status: "building",
          build_step: "Business understood, building sections",
          build_error: null,
        })
        .eq("id", companyId);
      return;
    }

    const { data: batch } = await sb
      .from("company_sections")
      .select("section_key")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .limit(BATCH_SIZE);
    if (!batch?.length) {
      await sb.from("companies").update({ build_status: "ready", build_step: "Done" }).eq("id", companyId);
      await notifyReady(c);
      return;
    }
    const labels = batch.map((n) => c.section_map.find((s) => s.key === n.section_key)?.label ?? n.section_key);
    await sb.from("companies").update({ build_step: `Building ${labels.join(", ")}` }).eq("id", companyId);
    let pause: PauseError | null = null;
    await Promise.all(
      batch.map(async (n) => {
        try {
          const content = await buildSection(c, n.section_key);
          await sb
            .from("company_sections")
            .update({ status: "ready", content, error: null, generated_at: new Date().toISOString() })
            .eq("company_id", companyId)
            .eq("section_key", n.section_key);
        } catch (e) {
          if (e instanceof PauseError) {
            pause = e;
            return;
          }
          await sb
            .from("company_sections")
            .update({ status: "failed", error: (e as Error).message })
            .eq("company_id", companyId)
            .eq("section_key", n.section_key);
        }
      }),
    );
    if (pause) throw pause;
  } catch (e) {
    await sb
      .from("companies")
      .update({ build_status: e instanceof PauseError ? "paused" : "failed", build_error: (e as Error).message })
      .eq("id", companyId);
  } finally {
    await sb.from("companies").update({ build_lock_until: null }).eq("id", companyId);
  }
}

async function notifyReady(c: CompanyRow) {
  if (!c.created_email) return;
  try {
    const { sendTemplateEmail } = await import("./email-templates/send-email");
    await sendTemplateEmail("company-status", c.created_email, { templateData: { company: c.name, status: "ready" } });
  } catch (e) {
    console.error("ready email failed", e);
  }
}
