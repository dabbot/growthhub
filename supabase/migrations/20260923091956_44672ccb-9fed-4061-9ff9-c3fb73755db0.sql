CREATE TABLE public.generated_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  persona_key text,
  play_key text,
  name text NOT NULL,
  objective text NOT NULL,
  audience_note text,
  targeting jsonb NOT NULL DEFAULT '{}'::jsonb,
  daily_budget_inr numeric NOT NULL DEFAULT 5000,
  headlines jsonb NOT NULL DEFAULT '[]'::jsonb,
  descriptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  primary_texts jsonb NOT NULL DEFAULT '[]'::jsonb,
  creative_brief text,
  image_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  landing_url text NOT NULL DEFAULT 'https://example.com',
  status text NOT NULL DEFAULT 'draft',
  external_id text,
  external_status text,
  launch_log text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.generated_campaigns TO anon;
GRANT SELECT ON public.generated_campaigns TO authenticated;
GRANT ALL ON public.generated_campaigns TO service_role;

ALTER TABLE public.generated_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns are viewable by anyone with the link"
  ON public.generated_campaigns FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE public.meta_connection (
  key text PRIMARY KEY DEFAULT 'default',
  ad_account_id text NOT NULL,
  access_token text NOT NULL,
  page_id text,
  account_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.meta_connection TO service_role;

ALTER TABLE public.meta_connection ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_generated_campaigns_updated_at
  BEFORE UPDATE ON public.generated_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_meta_connection_updated_at
  BEFORE UPDATE ON public.meta_connection
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();