CREATE TABLE public.data_connections (
  company TEXT NOT NULL,
  platform TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  account_label TEXT,
  status TEXT NOT NULL DEFAULT 'connected',
  last_error TEXT,
  connected_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company, platform)
);
GRANT ALL ON public.data_connections TO service_role;
ALTER TABLE public.data_connections ENABLE ROW LEVEL SECURITY;