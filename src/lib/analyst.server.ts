import { createClient } from "@supabase/supabase-js";
import { BRAND } from "./brand";

export const ANALYST_MODEL = () => process.env["AI_MODEL"] || "gpt-5";

function db() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Backend is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const n = (v: unknown) => Number(v ?? 0);
const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * A compact, plain-text snapshot of everything in the dashboard, so the model
 * answers from this project's own numbers rather than general knowledge.
 */
export async function buildEvidencePack(
  overrides: Record<string, number> = {},
): Promise<{ text: string; assumptionNote: string }> {
  const supabase = db();
  const [
    metrics,
    issuers,
    issuerMonthly,
    penetration,
    personas,
    personaPlatforms,
    tiers,
    scoreBands,
    overlap,
    funnel,
    brandMonthly,
    plays,
    ads,
    marketingPlan,
    assumptions,
    provenance,
  ] = await Promise.all([
    supabase.from("market_metrics").select("*").order("sort_order"),
    supabase.from("issuers").select("*").order("sort_order"),
    supabase.from("issuer_monthly").select("*").eq("month", "2026-07-01"),
    supabase.from("issuer_penetration").select("*"),
    supabase.from("personas").select("*").order("sort_order"),
    supabase.from("persona_platforms").select("*"),
    supabase.from("targetability_tiers").select("*").order("sort_order"),
    supabase.from("score_bands").select("*").order("sort_order"),
    supabase.from("overlap_segments").select("*").order("sort_order"),
    supabase.from("funnel_steps").select("*").order("sort_order"),
    supabase.from("brand_monthly").select("*").order("month"),
    supabase.from("plays").select("*").order("sort_order"),
    supabase.from("ad_campaigns").select("*").order("sort_order"),
    supabase.from("marketing_plan_items").select("*").order("sort_order"),
    supabase.from("assumptions").select("*").order("sort_order"),
    supabase.from("assumption_provenance").select("*").order("sort_order"),
  ]);

  const dial = (key: string, fallback: number) =>
    overrides[key] !== undefined ? Number(overrides[key]) : fallback;

  const a = Object.fromEntries(
    (assumptions.data ?? []).map((row) => [row.key, n(row.value)]),
  ) as Record<string, number>;

  const cards = dial("cards_in_force", a["cards_in_force"] ?? 0);
  const perHolder = dial("cards_per_holder", a["cards_per_holder"] ?? 2.1);
  const activeRate = dial("active_card_rate", a["active_card_rate"] ?? 62);
  const primeShare = dial("prime_share", a["prime_share"] ?? 52);
  const brandActive = dial("brand_mau", a["brand_mau"] ?? 11);

  const cardholders = perHolder ? cards / perHolder : 0;
  const activeCardholders = (cardholders * activeRate) / 100;
  const addressable = (activeCardholders * primeShare) / 100;
  const headroom = Math.max(addressable - brandActive, 0);

  const changed = Object.keys(overrides).filter((k) => overrides[k] !== a[k]);
  const assumptionNote = changed.length
    ? `The strategist has moved these dials away from default: ${changed.join(", ")}.`
    : "The strategist is looking at the default assumptions.";

  const lines: string[] = [];
  const push = (title: string, body: string) => lines.push(`## ${title}\n${body}`);

  push(
    "Headroom maths as the strategist currently has it set",
    [
      `Cards in force: ${cards}M`,
      `Cards per holder: ${perHolder}`,
      `Unique cardholders: ${r1(cardholders)}M`,
      `Share of cards actually used in the last 90 days: ${activeRate}%`,
      `Cardholders who actually use a card: ${r1(activeCardholders)}M`,
      `Share scoring 750+: ${primeShare}%`,
      `Addressable base (active AND 750+): ${r1(addressable)}M`,
      `Acme monthly actives: ${brandActive}M`,
      `Real headroom: ${r1(headroom)}M`,
    ].join("\n"),
  );

  push(
    "Market metrics",
    (metrics.data ?? [])
      .map((m) => `${m.label}: ${m.value} ${m.unit} [${m.badge}] source: ${m.source}`)
      .join("\n"),
  );

  const issuerName = new Map((issuers.data ?? []).map((i) => [i.slug, i.name]));
  push(
    "Issuers, July 2026",
    (issuerMonthly.data ?? [])
      .sort((x, y) => n(y.cards_m) - n(x.cards_m))
      .map((row) => {
        const pen = (penetration.data ?? []).find((p) => p.issuer_slug === row.issuer_slug);
        const spendPerCard = n(row.cards_m)
          ? Math.round((n(row.spend_cr) * 1e7) / (n(row.cards_m) * 1e6))
          : 0;
        return `${issuerName.get(row.issuer_slug) ?? row.issuer_slug}: ${row.cards_m}M cards, monthly spend Rs ${row.spend_cr} cr, Rs ${spendPerCard} per card per month, net adds 12m ${row.net_adds_12m_m ?? "n/a"}M, spend YoY ${row.yoy_spend_pct ?? "n/a"}%, Acme penetration ${pen?.brand_penetration_pct ?? "n/a"}% (confidence ${pen?.confidence ?? "n/a"}), prime share ${pen?.prime_share_pct ?? "n/a"}%, active cards ${pen?.active_share_pct ?? "n/a"}%`;
      })
      .join("\n"),
  );

  const affinity = new Map<string, string[]>();
  for (const row of personaPlatforms.data ?? []) {
    const list = affinity.get(row.persona_slug) ?? [];
    list.push(`${row.platform} ${r1(n(row.index_score) / 100)}x`);
    affinity.set(row.persona_slug, list);
  }
  push(
    "Personas",
    (personas.data ?? [])
      .map(
        (p) =>
          `${p.slug} — ${p.name}: ${p.who}. Size ${p.size_m}M, ${p.cards_held} cards, ${p.city_tier}, spends ${p.typical_spend}, on Acme ${p.penetration_pct}% (${p.brand_status}). Wants: ${p.wants}. Message that works: ${p.message}. Hooks: ${p.hooks}. Platform affinity: ${(affinity.get(p.slug) ?? []).join(", ")}`,
      )
      .join("\n"),
  );

  push(
    "Targetability tiers",
    (tiers.data ?? [])
      .map(
        (t) =>
          `${t.label} (${t.verdict}): ${t.share_pct}% of ${t.basis}. Who: ${t.who}. Why: ${t.why}. Cost to win: ${t.cost_to_win}. Play: ${t.play}`,
      )
      .join("\n"),
  );

  push(
    "750+ universe",
    (scoreBands.data ?? [])
      .map(
        (b) =>
          `${b.label}: ${b.size_m}M, ${b.has_card ? "holds a card" : "holds no card"}, on Acme ${b.on_brand_m}M. ${b.note}`,
      )
      .join("\n"),
  );

  push(
    "Overlap segments",
    (overlap.data ?? []).map((o) => `${o.label}: ${o.value_m}M. ${o.description}`).join("\n"),
  );

  push(
    "Funnel",
    (funnel.data ?? [])
      .map((f) => `${f.tone === "brand" ? "Acme" : "Market"} — ${f.label}: ${f.value_m}M`)
      .join("\n"),
  );

  push(
    "Acme monthly actives history",
    (brandMonthly.data ?? []).map((c) => `${String(c.month).slice(0, 7)}: ${c.mau_m}M`).join(", "),
  );

  push(
    "Plays already on the board",
    (plays.data ?? [])
      .map(
        (p) =>
          `${p.slug} — ${p.name}: segment ${p.segment}, lever ${p.lever}, channel ${p.channel}, owner ${p.owner}, reach ${p.reach_m}M, expected conversion ${p.conversion_pct}%, effort ${p.effort}/5, impact ${p.impact}/5. ${p.rationale}`,
      )
      .join("\n"),
  );

  push(
    "Live ad audit (public ad libraries, craft critique only — no spend or performance data)",
    (ads.data ?? [])
      .map(
        (ad) =>
          `${ad.platform} — ${ad.campaign_name} (${ad.format}): offer "${ad.offer}", target ${ad.persona_target}. Verdict: ${ad.verdict}. Fix: ${ad.fix}`,
      )
      .join("\n"),
  );

  push(
    "Marketing plan already agreed",
    (marketingPlan.data ?? [])
      .map((m) => `${m.channel} → ${m.audience}: ${m.action} (${m.priority}); success = ${m.success_metric}`)
      .join("\n"),
  );

  push(
    "Assumption ledger",
    (provenance.data ?? [])
      .map(
        (p) =>
          `${p.label} = ${p.value_text}. Source: ${p.source}. Working: ${p.derivation}. Confidence: ${p.confidence}. Replaced by: ${p.replaces_with}`,
      )
      .join("\n"),
  );

  return { text: lines.join("\n\n"), assumptionNote };
}

export const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["read", "opportunities", "assumptions_to_test", "what_would_change_this"],
  properties: {
    read: {
      type: "string",
      description: "Three to five sentences answering the question directly, using the numbers.",
    },
    opportunities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "rank",
          "title",
          "segment",
          "size_m",
          "why_now",
          "move",
          "channel",
          "effort",
          "confidence",
          "evidence",
          "risk",
          "success_metric",
        ],
        properties: {
          rank: { type: "integer" },
          title: { type: "string" },
          segment: { type: "string" },
          size_m: { type: "number", description: "People reachable, in millions." },
          why_now: { type: "string" },
          move: { type: "string", description: "The concrete action to take." },
          channel: { type: "string" },
          effort: { type: "string", enum: ["low", "medium", "high"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          evidence: {
            type: "string",
            description: "The exact figures from the evidence pack this rests on.",
          },
          risk: { type: "string" },
          success_metric: { type: "string" },
        },
      },
    },
    assumptions_to_test: { type: "array", items: { type: "string" } },
    what_would_change_this: { type: "string" },
  },
} as const;

export function analystRequestBody(question: string, pack: string, note: string) {
  return {
    model: ANALYST_MODEL(),
    stream: true,
    reasoning: { effort: "medium", summary: "auto" },
    include: ["reasoning.encrypted_content"],
    store: false,
    text: {
      format: {
        type: "json_schema",
        name: "opportunity_analysis",
        strict: true,
        schema: ANALYSIS_SCHEMA,
      },
    },
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `You are a growth strategist at ${BRAND.description}. ` +
              "You answer with a prioritised opportunity analysis built strictly from the evidence pack below, " +
              "which is this team's own dashboard. Rules: every number you cite must appear in the pack or be " +
              "arithmetic on pack numbers, and you must say which figure you used. Never invent market data, " +
              "performance data or competitor figures. Say plainly when the pack cannot answer part of the " +
              "question. Rank opportunities by winnable people per unit of effort, not by raw segment size. " +
              "Prefer segments the pack calls low hanging or difficult over impossible or useless. " +
              "Write in plain Indian business English, no jargon, no em dashes.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `EVIDENCE PACK\n\n${pack}\n\nCONTEXT\n${note}\n\nTHE QUESTION\n${question}\n\nReturn json matching the schema. Give between three and six opportunities.`,
          },
        ],
      },
    ],
  };
}
