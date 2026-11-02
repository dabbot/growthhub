import type { CompanyKey } from "@/lib/company";

export type Badge = "reported" | "derived" | "modeled";

/* ---------------- Budget allocator ---------------- */
export type Channel = {
  key: string;
  label: string;
  baseCac: number; // ₹ per new active at low spend
  saturationCr: number; // ₹ Cr per quarter where CAC has doubled
  poolM: number; // reachable pool, millions
  note: string;
};

export const CHANNELS: Record<CompanyKey, Channel[]> = {
  // Example channel economics for the fictional Acme.
  acme: [
    { key: "meta", label: "Meta performance", baseCac: 1500, saturationCr: 10, poolM: 6, note: "Broad lookalikes of 750+ cardholders; CAC climbs fast past ₹10 Cr/qtr." },
    { key: "search", label: "Google search intent", baseCac: 1000, saturationCr: 4, poolM: 2, note: "'Credit card bill pay', 'credit score check' — cheap but capped by query volume." },
    { key: "bank", label: "Bank co-marketing", baseCac: 700, saturationCr: 7, poolM: 7, note: "Issuer statement inserts and in-app placements; slow to set up." },
    { key: "affiliate", label: "Fintech affiliates", baseCac: 1200, saturationCr: 5, poolM: 3, note: "Card-comparison sites and cashback apps; quality varies." },
    { key: "referral", label: "Referral rewards", baseCac: 800, saturationCr: 6, poolM: 4, note: "Existing actives inviting peers; strongest trust signal." },
  ],
};

/** CAC rises as spend approaches saturation: cac = base * (1 + spend/sat) */
export function channelOutcome(ch: Channel, spendCr: number) {
  const avgCac = ch.baseCac * (1 + spendCr / ch.saturationCr / 2);
  const raw = spendCr > 0 ? (spendCr * 1e7) / avgCac / 1e6 : 0; // millions
  const actives = Math.min(raw, ch.poolM * 0.35);
  const effectiveCac = actives > 0 ? (spendCr * 1e7) / (actives * 1e6) : ch.baseCac;
  return { actives, cac: effectiveCac, marginalCac: ch.baseCac * (1 + spendCr / ch.saturationCr) };
}

/** Greedy allocation in ₹0.25 Cr slices to the channel with the lowest marginal CAC */
export function recommendMix(chs: Channel[], budgetCr: number) {
  const alloc: Record<string, number> = Object.fromEntries(chs.map((c) => [c.key, 0]));
  const step = 0.25;
  for (let spent = 0; spent + step <= budgetCr + 1e-9; spent += step) {
    let best = chs[0]!;
    let bestCost = Infinity;
    for (const c of chs) {
      const m = channelOutcome(c, alloc[c.key]! + step);
      if (m.actives >= c.poolM * 0.35) continue;
      if (m.marginalCac < bestCost) {
        bestCost = m.marginalCac;
        best = c;
      }
    }
    alloc[best.key] = alloc[best.key]! + step;
  }
  return alloc;
}

/* ---------------- Unit economics ---------------- */
export type Cohort = {
  key: string;
  label: string;
  cac: number;
  arpuMonth: number; // ₹ net revenue per active per month
  churnMonth: number; // % monthly churn
  revenueMix: { label: string; share: number }[];
  badge: Badge;
};

export const COHORTS: Record<CompanyKey, Cohort[]> = {
  // Example cohorts for the fictional Acme. Every figure is made up.
  acme: [
    { key: "premium", label: "Premium card spenders", cac: 1700, arpuMonth: 320, churnMonth: 2, revenueMix: [{ label: "Lending (Acme Credit Line)", share: 40 }, { label: "Store & travel", share: 25 }, { label: "Bill-pay & rewards", share: 35 }], badge: "modeled" },
    { key: "salaried", label: "Metro salaried, 2–3 cards", cac: 1300, arpuMonth: 180, churnMonth: 2.8, revenueMix: [{ label: "Lending (Acme Credit Line)", share: 50 }, { label: "Store & travel", share: 15 }, { label: "Bill-pay & rewards", share: 35 }], badge: "modeled" },
    { key: "tier2", label: "Tier-2 newcomers", cac: 1500, arpuMonth: 100, churnMonth: 4, revenueMix: [{ label: "Lending (Acme Credit Line)", share: 35 }, { label: "Store & travel", share: 10 }, { label: "Bill-pay & rewards", share: 55 }], badge: "modeled" },
    { key: "young", label: "First-card young professionals", cac: 1000, arpuMonth: 75, churnMonth: 4.5, revenueMix: [{ label: "Lending (Acme Credit Line)", share: 30 }, { label: "Store & travel", share: 20 }, { label: "Bill-pay & rewards", share: 50 }], badge: "modeled" },
  ],
};

export function ltv(arpu: number, churnPct: number, months: number) {
  const r = 1 - churnPct / 100;
  let total = 0;
  let alive = 1;
  for (let m = 0; m < months; m++) {
    total += arpu * alive;
    alive *= r;
  }
  return total;
}

export function paybackMonth(cac: number, arpu: number, churnPct: number) {
  const r = 1 - churnPct / 100;
  let cum = 0;
  let alive = 1;
  for (let m = 1; m <= 60; m++) {
    cum += arpu * alive;
    alive *= r;
    if (cum >= cac) return m;
  }
  return null;
}

/* ---------------- Cross-sell ---------------- */
export type CrossSell = {
  product: string;
  what: string;
  eligibleM: number;
  adoptionPct: number;
  targetPct: number;
  revenuePerUserYr: number;
  badge: Badge;
  move: string;
};

export const CROSS_SELL: Record<CompanyKey, CrossSell[]> = {
  // Example products for the fictional Acme. Every figure is made up.
  acme: [
    { product: "Acme Credit Line", what: "Pre-approved personal credit line for 750+ members", eligibleM: 6, adoptionPct: 8, targetPct: 14, revenuePerUserYr: 12000, badge: "modeled", move: "Surface the pre-approved limit on bill-pay success screens." },
    { product: "Acme Insurance", what: "Motor and health insurance renewals", eligibleM: 4, adoptionPct: 10, targetPct: 18, revenuePerUserYr: 1800, badge: "modeled", move: "Renewal reminders 30 days out, one-tap quote." },
    { product: "Acme UPI", what: "UPI and merchant checkout", eligibleM: 10, adoptionPct: 18, targetPct: 26, revenuePerUserYr: 500, badge: "modeled", move: "Reward UPI spends with points at partner merchants." },
    { product: "Acme Travel", what: "Premium stays and flights", eligibleM: 3, adoptionPct: 5, targetPct: 9, revenuePerUserYr: 4500, badge: "modeled", move: "Target premium spenders ahead of long weekends." },
    { product: "Acme Rewards Store", what: "Curated D2C brands", eligibleM: 10, adoptionPct: 9, targetPct: 13, revenuePerUserYr: 1400, badge: "modeled", move: "Bundle store drops with statement-day reminders." },
  ],
};

/* ---------------- Experiments ---------------- */
export type ExpStatus = "backlog" | "prioritised" | "in_flight" | "won" | "killed";
export type Experiment = {
  id: string;
  title: string;
  segment: string;
  channel: string;
  reach: number; // thousands per quarter
  impact: number; // 0.25 - 3
  confidence: number; // %
  effort: number; // person-weeks
  status: ExpStatus;
  result?: string;
};

export const SEED_EXPERIMENTS: Record<CompanyKey, Experiment[]> = {
  // Example backlog for the fictional Acme.
  acme: [
    { id: "a1", title: "Lower the 750 gate to 720 for cardholders with 12 months of clean repayment", segment: "Tier-2 newcomers", channel: "Product", reach: 800, impact: 2, confidence: 60, effort: 6, status: "prioritised" },
    { id: "a2", title: "Bill-due push 3 days early vs. 1 day early", segment: "Lapsed members", channel: "CRM", reach: 2500, impact: 1, confidence: 80, effort: 1, status: "in_flight" },
    { id: "a3", title: "Referral: ₹250 for both sides vs. points", segment: "Metro salaried", channel: "Referral", reach: 1000, impact: 1, confidence: 70, effort: 2, status: "won", result: "Example result: +15% invites sent" },
    { id: "a4", title: "'Check your credit score free' landing page for search", segment: "Not yet qualified", channel: "Search", reach: 600, impact: 1, confidence: 50, effort: 2, status: "backlog" },
    { id: "a5", title: "Show the pre-approved credit line on payment success", segment: "Active 750+", channel: "Product", reach: 4000, impact: 0.5, confidence: 70, effort: 2, status: "backlog" },
    { id: "a6", title: "Regional-language Meta ads in Tier-2", segment: "Tier-2 newcomers", channel: "Meta", reach: 1200, impact: 1, confidence: 40, effort: 3, status: "killed", result: "Example result: CAC 2x metro, no lift in 750+ share" },
  ],
};

export const rice = (e: Pick<Experiment, "reach" | "impact" | "confidence" | "effort">) =>
  (e.reach * e.impact * (e.confidence / 100)) / Math.max(e.effort, 0.5);

/* ---------------- Model vs actual ---------------- */
export type VarianceRow = {
  metric: string;
  model: number;
  unit: string;
  source: string;
  connector: string;
  higherIsBetter: boolean;
};

export const VARIANCE: Record<CompanyKey, VarianceRow[]> = {
  // Example model targets for the fictional Acme.
  acme: [
    { metric: "Blended paid CAC", model: 1500, unit: "₹", source: "Allocator model", connector: "meta_ads", higherIsBetter: false },
    { metric: "Install → score check", model: 60, unit: "%", source: "Funnel model", connector: "amplitude", higherIsBetter: true },
    { metric: "Score check → 750+ pass", model: 55, unit: "%", source: "750+ share dial", connector: "amplitude", higherIsBetter: true },
    { metric: "Monthly actives", model: 8, unit: "M", source: "Upload / model", connector: "google_analytics", higherIsBetter: true },
    { metric: "'credit score check' rank", model: 10, unit: "#", source: "ASO & SEO audit", connector: "semrush", higherIsBetter: false },
    { metric: "Mobile page speed score", model: 50, unit: "/100", source: "ASO & SEO audit", connector: "pagespeed", higherIsBetter: true },
  ],
};

export const EXP_STORAGE = (c: CompanyKey) => `growth-dashboard-experiments-${c}`;
export const ACTUALS_STORAGE = (c: CompanyKey) => `growth-dashboard-variance-${c}`;

export function varianceOf(r: VarianceRow, actual: number | undefined) {
  if (actual === undefined || Number.isNaN(actual)) return null;
  const pct = ((actual - r.model) / r.model) * 100;
  const better = r.higherIsBetter ? pct >= 0 : pct <= 0;
  return { pct, better, flag: Math.abs(pct) < 10 ? "on" : better ? "better" : "worse" };
}
