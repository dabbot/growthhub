import { createServerFn } from "@tanstack/react-start";

export type ActualsInput = {
  source: string;
  funnel: { installed: number; gate: number; active: number };
  brandMau?: { month: string; mau_m: number } | null;
  penetration: { issuer_slug: string; pct: number }[];
  personas: { slug: string; pct: number }[];
};

export const saveActuals = createServerFn({ method: "POST" })
  .inputValidator((data: ActualsInput) => {
    if (!data || typeof data !== "object") throw new Error("Nothing to save.");
    const num = (n: unknown, label: string) => {
      const v = Number(n);
      if (!Number.isFinite(v) || v < 0) throw new Error(`${label} must be a positive number.`);
      return v;
    };
    const funnel = {
      installed: num(data.funnel?.installed, "Installs"),
      gate: num(data.funnel?.gate, "Passed the score gate"),
      active: num(data.funnel?.active, "Monthly actives"),
    };
    if (funnel.gate > funnel.installed || funnel.active > funnel.gate) {
      throw new Error("Each step of the funnel must be smaller than the one above it.");
    }
    const pct = (n: unknown, label: string) => {
      const v = Number(n);
      if (!Number.isFinite(v) || v < 0 || v > 100) throw new Error(`${label} must be 0–100.`);
      return v;
    };
    return {
      source: String(data.source ?? "").slice(0, 300),
      funnel,
      brandMau:
        data.brandMau && data.brandMau.month
          ? { month: data.brandMau.month, mau_m: num(data.brandMau.mau_m, "Monthly actives") }
          : null,
      penetration: (data.penetration ?? []).map((p) => ({
        issuer_slug: String(p.issuer_slug),
        pct: pct(p.pct, "Penetration"),
      })),
      personas: (data.personas ?? []).map((p) => ({
        slug: String(p.slug),
        pct: pct(p.pct, "Penetration"),
      })),
    } satisfies ActualsInput;
  })
  .handler(async ({ data }) => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const { admin } = await import("./campaigns.server");
    const db = admin();
    const note = data.source || "Uploaded by the Acme team";

    const steps: [string, number][] = [
      ["installed", data.funnel.installed],
      ["gate", data.funnel.gate],
      ["active", data.funnel.active],
    ];
    for (const [key, value_m] of steps) {
      const { error } = await db
        .from("funnel_steps")
        .update({ value_m, badge: "reported", sublabel: note })
        .eq("key", key);
      if (error) throw new Error(error.message);
    }

    if (data.brandMau) {
      const { error } = await db
        .from("brand_monthly")
        .upsert(
          { month: data.brandMau.month, mau_m: data.brandMau.mau_m, badge: "reported" },
          { onConflict: "month" },
        );
      if (error) throw new Error(error.message);
    }

    for (const p of data.penetration) {
      const { error } = await db
        .from("issuer_penetration")
        .update({
          brand_penetration_pct: p.pct,
          badge: "reported",
          confidence: "high",
          method_note: note,
        })
        .eq("issuer_slug", p.issuer_slug);
      if (error) throw new Error(error.message);
    }

    for (const p of data.personas) {
      const { error } = await db
        .from("personas")
        .update({ penetration_pct: p.pct })
        .eq("slug", p.slug);
      if (error) throw new Error(error.message);
    }

    return { ok: true as const, saved_at: new Date().toISOString() };
  });
