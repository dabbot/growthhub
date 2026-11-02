CREATE TABLE public.roadmap_status (
  item_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','shipped')),
  owner TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_status TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_status TO authenticated;
GRANT ALL ON public.roadmap_status TO service_role;
ALTER TABLE public.roadmap_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read roadmap status" ON public.roadmap_status FOR SELECT USING (true);
CREATE POLICY "Anyone can add roadmap status" ON public.roadmap_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update roadmap status" ON public.roadmap_status FOR UPDATE USING (true) WITH CHECK (true);