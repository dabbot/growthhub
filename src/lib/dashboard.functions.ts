import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type Badge = "reported" | "derived" | "modeled";

export type Issuer = {
  slug: string;
  name: string;
  category: string;
  sort_order: number;
};

export type IssuerMonthly = {
  issuer_slug: string;
  month: string;
  cards_m: number;
  spend_cr: number;
  net_adds_12m_m: number | null;
  yoy_spend_pct: number | null;
  badge: string;
};

export type MarketMetric = {
  key: string;
  label: string;
  value: number;
  unit: string;
  badge: string;
  source: string;
  note: string | null;
  sort_order: number;
};

export type FunnelStep = {
  key: string;
  label: string;
  sublabel: string | null;
  value_m: number;
  badge: string;
  tone: string;
  sort_order: number;
};

export type Persona = {
  slug: string;
  name: string;
  who: string;
  size_m: number;
  primary_issuers: string;
  city_tier: string;
  cards_held: number;
  typical_spend: string;
  brand_status: string;
  penetration_pct: number;
  wants: string;
  channels: string;
  message: string;
  hooks: string;
  sort_order: number;
};

export type PersonaPlatform = {
  persona_slug: string;
  platform: string;
  index_score: number;
  audience_size_m: number | null;
};

export type OverlapSegment = {
  key: string;
  label: string;
  description: string;
  value_m: number;
  badge: string;
  sort_order: number;
};

export type IssuerPenetration = {
  issuer_slug: string;
  brand_penetration_pct: number;
  prime_share_pct: number;
  badge: string;
  active_share_pct: number;
  survey_brand_share_pct: number;
  confidence: string;
  method_note: string;
};

export type UpiShare = { app: string; share_pct: number; month: string; sort_order: number };

export type ScoreBand = {
  key: string;
  label: string;
  band: string;
  size_m: number;
  has_card: boolean;
  on_brand_m: number;
  note: string;
  badge: string;
  sort_order: number;
};

export type TargetabilityTier = {
  key: string;
  label: string;
  verdict: string;
  who: string;
  why: string;
  basis: string;
  share_pct: number;
  cost_to_win: string;
  play: string;
  badge: string;
  sort_order: number;
};

export type BrandMonthly = { month: string; mau_m: number; badge: string };

export type AdCampaign = {
  id: string;
  platform: string;
  campaign_name: string;
  format: string;
  offer: string;
  creative_note: string;
  landing_page: string;
  running_since: string;
  persona_target: string;
  offer_clarity: number;
  persona_fit: number;
  proof: number;
  cta: number;
  landing_match: number;
  verdict: string;
  fix: string;
  badge: string;
  sort_order: number;
};

export type MarketingPlanItem = {
  id: string;
  channel: string;
  audience: string;
  message: string;
  action: string;
  success_metric: string;
  priority: string;
  sort_order: number;
};

export type AssumptionProvenance = {
  key: string;
  label: string;
  value_text: string;
  source: string;
  derivation: string;
  confidence: string;
  replaces_with: string;
  sort_order: number;
};

export type SegmentProfile = {
  segment: string;
  dimension: string;
  bucket: string;
  share_pct: number;
  badge: string;
  note: string | null;
  sort_order: number;
};

export type Play = {
  slug: string;
  name: string;
  segment: string;
  lever: string;
  channel: string;
  owner: string;
  reach_m: number;
  conversion_pct: number;
  effort: number;
  impact: number;
  rationale: string;
  sort_order: number;
};

export type Assumption = {
  key: string;
  label: string;
  value: number;
  default_value: number;
  min_value: number;
  max_value: number;
  step: number;
  unit: string;
  note: string;
  sort_order: number;
};

export type SourceRow = {
  key: string;
  name: string;
  what_it_gives: string;
  cadence: string;
  feeds: string;
  refreshed_on: string;
  badge: string;
  sort_order: number;
};

export type ChangelogRow = { id: string; entry_date: string; title: string; detail: string };

export type DashboardData = {
  issuers: Issuer[];
  issuerMonthly: IssuerMonthly[];
  metrics: MarketMetric[];
  funnel: FunnelStep[];
  personas: Persona[];
  personaPlatforms: PersonaPlatform[];
  overlap: OverlapSegment[];
  penetration: IssuerPenetration[];
  upiShare: UpiShare[];
  plays: Play[];
  assumptions: Assumption[];
  sources: SourceRow[];
  changelog: ChangelogRow[];
  scoreBands: ScoreBand[];
  tiers: TargetabilityTier[];
  brandMonthly: BrandMonthly[];
  ads: AdCampaign[];
  marketingPlan: MarketingPlanItem[];
  provenance: AssumptionProvenance[];
  segmentProfiles: SegmentProfile[];
};

export const getDashboardData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardData> => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();

    // Reads run server-side with the service role, so the dashboard tables need
    // no public (anonymous) read access.
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
    const url = process.env["SUPABASE_URL"]!;
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const [
      issuers,
      issuerMonthly,
      metrics,
      funnel,
      personas,
      personaPlatforms,
      overlap,
      penetration,
      upiShare,
      plays,
      assumptions,
      sources,
      changelog,
      scoreBands,
      tiers,
      brandMonthly,
      ads,
      marketingPlan,
      provenance,
      segmentProfiles,
    ] = await Promise.all([
      supabase.from("issuers").select("*").order("sort_order"),
      supabase.from("issuer_monthly").select("*").order("month"),
      supabase.from("market_metrics").select("*").order("sort_order"),
      supabase.from("funnel_steps").select("*").order("sort_order"),
      supabase.from("personas").select("*").order("sort_order"),
      supabase.from("persona_platforms").select("*"),
      supabase.from("overlap_segments").select("*").order("sort_order"),
      supabase.from("issuer_penetration").select("*"),
      supabase.from("upi_share").select("*").order("sort_order"),
      supabase.from("plays").select("*").order("sort_order"),
      supabase.from("assumptions").select("*").order("sort_order"),
      supabase.from("sources").select("*").order("sort_order"),
      supabase.from("changelog").select("*").order("entry_date", { ascending: false }),
      supabase.from("score_bands").select("*").order("sort_order"),
      supabase.from("targetability_tiers").select("*").order("sort_order"),
      supabase.from("brand_monthly").select("*").order("month"),
      supabase.from("ad_campaigns").select("*").order("sort_order"),
      supabase.from("marketing_plan_items").select("*").order("sort_order"),
      supabase.from("assumption_provenance").select("*").order("sort_order"),
      supabase.from("segment_profiles").select("*").order("sort_order"),
    ]);


    return {
      issuers: (issuers.data ?? []) as Issuer[],
      issuerMonthly: (issuerMonthly.data ?? []) as IssuerMonthly[],
      metrics: (metrics.data ?? []) as MarketMetric[],
      funnel: (funnel.data ?? []) as FunnelStep[],
      personas: (personas.data ?? []) as Persona[],
      personaPlatforms: (personaPlatforms.data ?? []) as PersonaPlatform[],
      overlap: (overlap.data ?? []) as OverlapSegment[],
      penetration: (penetration.data ?? []) as IssuerPenetration[],
      upiShare: (upiShare.data ?? []) as UpiShare[],
      plays: (plays.data ?? []) as Play[],
      assumptions: (assumptions.data ?? []) as Assumption[],
      sources: (sources.data ?? []) as SourceRow[],
      changelog: (changelog.data ?? []) as ChangelogRow[],
      scoreBands: (scoreBands.data ?? []) as ScoreBand[],
      tiers: (tiers.data ?? []) as TargetabilityTier[],
      brandMonthly: (brandMonthly.data ?? []) as BrandMonthly[],
      ads: (ads.data ?? []) as AdCampaign[],
      marketingPlan: (marketingPlan.data ?? []) as MarketingPlanItem[],
      provenance: (provenance.data ?? []) as AssumptionProvenance[],
      segmentProfiles: (segmentProfiles.data ?? []) as SegmentProfile[],
    };
  },
);
