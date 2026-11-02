import type { DashboardData, IssuerMonthly, Play } from "./dashboard.functions";

export const LATEST_MONTH = "2026-07-01";

export function latestIssuerRows(data: DashboardData): IssuerMonthly[] {
  return data.issuerMonthly.filter((r) => r.month === LATEST_MONTH);
}

export type IssuerRow = {
  slug: string;
  name: string;
  category: string;
  cards_m: number;
  spend_cr: number;
  net_adds_12m_m: number;
  yoy_spend_pct: number;
  share_pct: number;
  spend_per_card: number;
  penetration_pct: number;
  prime_share_pct: number;
};

export function issuerTable(data: DashboardData): IssuerRow[] {
  const rows = latestIssuerRows(data);
  const totalCards = rows.reduce((s, r) => s + Number(r.cards_m), 0);
  return rows
    .map((r) => {
      const issuer = data.issuers.find((i) => i.slug === r.issuer_slug);
      const pen = data.penetration.find((p) => p.issuer_slug === r.issuer_slug);
      const cards = Number(r.cards_m);
      const spend = Number(r.spend_cr);
      return {
        slug: r.issuer_slug,
        name: issuer?.name ?? r.issuer_slug,
        category: issuer?.category ?? "Private",
        cards_m: cards,
        spend_cr: spend,
        net_adds_12m_m: Number(r.net_adds_12m_m ?? 0),
        yoy_spend_pct: Number(r.yoy_spend_pct ?? 0),
        share_pct: totalCards ? (cards / totalCards) * 100 : 0,
        // spend_cr is a monthly figure in crore; cards are in millions
        spend_per_card: cards ? (spend * 1e7) / (cards * 1e6) : 0,
        penetration_pct: Number(pen?.brand_penetration_pct ?? 0),
        prime_share_pct: Number(pen?.prime_share_pct ?? 0),
      };
    })
    .sort((a, b) => b.cards_m - a.cards_m);
}

export type Headroom = {
  cards: number;
  cardholders: number;
  /** Cardholders with at least one transaction in the last 90 days. */
  activeCardholders: number;
  /** Active cardholders scoring 750+ — the base we can realistically target. */
  addressable: number;
  prime: number;
  active: number;
  /** Addressable base minus Acme's own actives. */
  headroom: number;
  /** The old, flattering number: every cardholder minus Acme actives. */
  naiveHeadroom: number;
  brandShare: number;
  /** Acme actives as a share of the addressable base. */
  brandShareOfAddressable: number;
};

export function headroom(data: DashboardData, get: (k: string) => number): Headroom {
  const cards = Number(data.metrics.find((m) => m.key === "cards_in_force")?.value ?? 121.6);
  const active = Number(data.funnel.find((f) => f.key === "active")?.value_m ?? 11);
  const cardholders = cards / get("cards_per_holder");
  const activeCardholders = cardholders * (get("active_card_rate") / 100);
  const prime = cardholders * (get("prime_share") / 100);
  const addressable = activeCardholders * (get("prime_share") / 100);
  return {
    cards,
    cardholders,
    activeCardholders,
    addressable,
    prime,
    active,
    headroom: Math.max(addressable - active, 0),
    naiveHeadroom: Math.max(cardholders - active, 0),
    brandShare: cardholders ? (active / cardholders) * 100 : 0,
    brandShareOfAddressable: addressable ? (active / addressable) * 100 : 0,
  };
}

export type TierRow = {
  key: string;
  label: string;
  verdict: string;
  who: string;
  why: string;
  cost_to_win: string;
  play: string;
  size_m: number;
  basis_label: string;
  share_pct: number;
};

/** Sizes the four targetability tiers off whichever base each tier is measured against. */
export function targetability(data: DashboardData, get: (k: string) => number): TierRow[] {
  const h = headroom(data, get);
  const bases: Record<string, { value: number; label: string }> = {
    addressable: { value: h.addressable, label: "of the addressable base" },
    active: { value: h.activeCardholders, label: "of active cardholders" },
    cardholders: { value: h.cardholders, label: "of all cardholders" },
    cards: { value: h.cards, label: "of all cards in force" },
  };
  return data.tiers.map((t) => {
    const base = bases[t.basis] ?? bases["cardholders"]!;
    return {
      key: t.key,
      label: t.label,
      verdict: t.verdict,
      who: t.who,
      why: t.why,
      cost_to_win: t.cost_to_win,
      play: t.play,
      share_pct: Number(t.share_pct),
      size_m: (base.value * Number(t.share_pct)) / 100,
      basis_label: base.label,
    };
  });
}

export type OverlapView = {
  bankOnly: number;
  upiOnly: number;
  brandOnly: number;
  bankUpi: number;
  bankBrand: number;
  upiBrand: number;
  all: number;
  bankTotal: number;
  upiTotal: number;
  brandTotal: number;
};

export function overlapView(data: DashboardData, get: (k: string) => number): OverlapView {
  const h = headroom(data, get);
  const base = data.overlap.reduce((s, o) => s + Number(o.value_m), 0) || 1;
  const scale = h.cardholders / base;
  const v = (key: string) =>
    Number(data.overlap.find((o) => o.key === key)?.value_m ?? 0) * scale;

  const bankWeight = get("bank_app_overlap") / 58;
  const upiWeight = get("upi_overlap") / 34;

  const bankOnly = v("bank_only") * bankWeight;
  const upiOnly = v("upi_only") * upiWeight;
  const bankUpi = v("bank_upi") * ((bankWeight + upiWeight) / 2);
  const bankBrand = v("bank_brand") * bankWeight;
  const upiBrand = v("upi_brand") * upiWeight;
  const all = v("all_three");
  const brandOnly = Math.max(h.active - (bankBrand + upiBrand + all), 0.4);

  return {
    bankOnly,
    upiOnly,
    brandOnly,
    bankUpi,
    bankBrand,
    upiBrand,
    all,
    bankTotal: bankOnly + bankUpi + bankBrand + all,
    upiTotal: upiOnly + bankUpi + upiBrand + all,
    brandTotal: brandOnly + bankBrand + upiBrand + all,
  };
}

export function playConversion(play: Play, get: (k: string) => number): number {
  if (play.slug === "credit-graduated-reinvite") return get("reinvite_conversion");
  if (play.slug === "lapsed-winback") return get("winback_conversion");
  return Number(play.conversion_pct) * (get("acquisition_conversion") / 4);
}

export function expectedActives(play: Play, get: (k: string) => number): number {
  return Number(play.reach_m) * (playConversion(play, get) / 100);
}

export function rankedPlays(data: DashboardData, get: (k: string) => number) {
  return [...data.plays]
    .map((p) => ({ play: p, actives: expectedActives(p, get), conversion: playConversion(p, get) }))
    .sort((a, b) => b.actives - a.actives);
}

/* ---------- The 10M opportunity: three member groups, three lenses ---------- */

export type SegmentKey = "active" | "lapsed" | "not_qualified";

export type SegmentSummary = {
  key: SegmentKey;
  label: string;
  short: string;
  size_m: number;
  /** The slice of this group that clears the 750 gate today. */
  qualifiedNow_m: number;
  /** The slice still reachable inside the app, i.e. not uninstalled. */
  inAppReach_m: number;
  blurb: string;
  reachNote: string;
};

const SEGMENT_META: Record<SegmentKey, { label: string; short: string; blurb: string; reachNote: string }> = {
  active: {
    label: "Active members",
    short: "Active",
    blurb: "On Acme and opening the app. The base we are growing from, and the base we can lose.",
    reachNote: "Reachable free, in the app itself.",
  },
  lapsed: {
    label: "Lapsed members",
    short: "Lapsed",
    blurb: "Cleared the 750 gate at some point, then stopped opening the app. The cheapest group to win back.",
    reachNote: "Push for the ones who still have it installed, paid media for the rest.",
  },
  not_qualified: {
    label: "Not yet qualified",
    short: "Not yet qualified",
    blurb: "Installed Acme and did not clear the gate. A fifth of them would clear it today.",
    reachNote: "Mostly paid media; a re-invite only works for the ones who now clear the gate.",
  },
};

function funnelValue(data: DashboardData, key: string, fallback: number) {
  return Number(data.funnel.find((f) => f.key === key)?.value_m ?? fallback);
}

export function segmentShare(
  data: DashboardData,
  segment: SegmentKey,
  dimension: string,
  buckets: string[],
): number {
  return data.segmentProfiles
    .filter((p) => p.segment === segment && p.dimension === dimension && buckets.includes(p.bucket))
    .reduce((s, p) => s + Number(p.share_pct), 0);
}

export function opportunitySegments(data: DashboardData, get: (k: string) => number): SegmentSummary[] {
  const installed = funnelValue(data, "installed", 35);
  const gate = funnelValue(data, "gate", 25);
  const active = funnelValue(data, "active", 11);
  const sizes: Record<SegmentKey, number> = {
    active,
    lapsed: Math.max(gate - active, 0),
    not_qualified: Math.max(installed - gate, 0),
  };
  const primeBuckets = ["750 to 799", "800 plus"];
  const gateDial = get("prime_share") / 52; // moves with the 750+ share dial

  return (Object.keys(SEGMENT_META) as SegmentKey[]).map((key) => {
    const size = sizes[key];
    const qualifiedShare = segmentShare(data, key, "credit_score", primeBuckets);
    const installedShare = 100 - segmentShare(data, key, "engagement", ["Uninstalled"]);
    return {
      key,
      ...SEGMENT_META[key],
      size_m: size,
      qualifiedNow_m: Math.min(size, (size * qualifiedShare * gateDial) / 100),
      inAppReach_m: (size * installedShare) / 100,
    };
  });
}

export const SEGMENT_DIMENSIONS = [
  {
    key: "card_ownership",
    label: "Card ownership",
    question: "How many credit cards does this group hold?",
    soWhat: "More cards means more to manage, and more reason to use Acme at all.",
  },
  {
    key: "credit_score",
    label: "Credit score",
    question: "Where does this group sit against the 750 gate?",
    soWhat: "Anyone at 750 or above can be invited in today, whatever happened before.",
  },
  {
    key: "engagement",
    label: "Engagement",
    question: "Can we still reach this group inside the app?",
    soWhat: "Still installed means a free push. Uninstalled means paying for media.",
  },
] as const;

export type DimensionKey = (typeof SEGMENT_DIMENSIONS)[number]["key"];

export type BreakdownRow = {
  bucket: string;
  note: string | null;
  cells: { segment: SegmentKey; share_pct: number; size_m: number }[];
  total_m: number;
};

export function segmentBreakdown(
  data: DashboardData,
  get: (k: string) => number,
  dimension: DimensionKey,
  segments: SegmentKey[],
): BreakdownRow[] {
  const summaries = opportunitySegments(data, get);
  const rows = data.segmentProfiles.filter((p) => p.dimension === dimension);
  const buckets: string[] = [];
  for (const r of [...rows].sort((a, b) => a.sort_order - b.sort_order)) {
    if (!buckets.includes(r.bucket)) buckets.push(r.bucket);
  }

  return buckets.map((bucket) => {
    const cells = segments.map((segment) => {
      const row = rows.find((r) => r.segment === segment && r.bucket === bucket);
      const share = Number(row?.share_pct ?? 0);
      const size = summaries.find((s) => s.key === segment)!.size_m;
      return { segment, share_pct: share, size_m: (size * share) / 100 };
    });
    const note =
      rows.find((r) => r.bucket === bucket && r.note && segments.includes(r.segment as SegmentKey))
        ?.note ??
      rows.find((r) => r.bucket === bucket && r.note)?.note ??
      null;
    return { bucket, note, cells, total_m: cells.reduce((s, c) => s + c.size_m, 0) };
  });
}
