CREATE TABLE public.score_bands (
  key text PRIMARY KEY,
  label text NOT NULL,
  band text NOT NULL,
  size_m numeric NOT NULL,
  has_card boolean NOT NULL DEFAULT true,
  on_brand_m numeric NOT NULL DEFAULT 0,
  note text NOT NULL,
  badge text NOT NULL DEFAULT 'modeled',
  sort_order integer NOT NULL DEFAULT 100
);
GRANT SELECT ON public.score_bands TO anon, authenticated;
GRANT ALL ON public.score_bands TO service_role;
ALTER TABLE public.score_bands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "score_bands public read" ON public.score_bands FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.targetability_tiers (
  key text PRIMARY KEY,
  label text NOT NULL,
  verdict text NOT NULL,
  who text NOT NULL,
  why text NOT NULL,
  basis text NOT NULL DEFAULT 'cardholders',
  share_pct numeric NOT NULL,
  cost_to_win text NOT NULL,
  play text NOT NULL,
  badge text NOT NULL DEFAULT 'modeled',
  sort_order integer NOT NULL DEFAULT 100
);
GRANT SELECT ON public.targetability_tiers TO anon, authenticated;
GRANT ALL ON public.targetability_tiers TO service_role;
ALTER TABLE public.targetability_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "targetability_tiers public read" ON public.targetability_tiers FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.brand_monthly (
  month date PRIMARY KEY,
  mau_m numeric NOT NULL,
  badge text NOT NULL DEFAULT 'modeled'
);
GRANT SELECT ON public.brand_monthly TO anon, authenticated;
GRANT ALL ON public.brand_monthly TO service_role;
ALTER TABLE public.brand_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand_monthly public read" ON public.brand_monthly FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  campaign_name text NOT NULL,
  format text NOT NULL,
  offer text NOT NULL,
  creative_note text NOT NULL,
  landing_page text NOT NULL,
  running_since text NOT NULL,
  persona_target text NOT NULL,
  offer_clarity integer NOT NULL,
  persona_fit integer NOT NULL,
  proof integer NOT NULL,
  cta integer NOT NULL,
  landing_match integer NOT NULL,
  verdict text NOT NULL,
  fix text NOT NULL,
  badge text NOT NULL DEFAULT 'modeled',
  sort_order integer NOT NULL DEFAULT 100
);
GRANT SELECT ON public.ad_campaigns TO anon, authenticated;
GRANT ALL ON public.ad_campaigns TO service_role;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad_campaigns public read" ON public.ad_campaigns FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.marketing_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  audience text NOT NULL,
  message text NOT NULL,
  action text NOT NULL,
  success_metric text NOT NULL,
  priority text NOT NULL,
  sort_order integer NOT NULL DEFAULT 100
);
GRANT SELECT ON public.marketing_plan_items TO anon, authenticated;
GRANT ALL ON public.marketing_plan_items TO service_role;
ALTER TABLE public.marketing_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_plan_items public read" ON public.marketing_plan_items FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.assumption_provenance (
  key text PRIMARY KEY,
  label text NOT NULL,
  value_text text NOT NULL,
  source text NOT NULL,
  derivation text NOT NULL,
  confidence text NOT NULL,
  replaces_with text NOT NULL,
  sort_order integer NOT NULL DEFAULT 100
);
GRANT SELECT ON public.assumption_provenance TO anon, authenticated;
GRANT ALL ON public.assumption_provenance TO service_role;
ALTER TABLE public.assumption_provenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assumption_provenance public read" ON public.assumption_provenance FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.issuer_penetration
  ADD COLUMN IF NOT EXISTS active_share_pct numeric NOT NULL DEFAULT 62,
  ADD COLUMN IF NOT EXISTS survey_brand_share_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confidence text NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS method_note text NOT NULL DEFAULT '';