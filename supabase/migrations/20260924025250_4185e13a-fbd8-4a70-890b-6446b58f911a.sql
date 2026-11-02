CREATE TABLE public.page_views (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, email text NOT NULL, path text NOT NULL, company text, viewed_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE INDEX page_views_viewed_at_idx ON public.page_views (viewed_at DESC);