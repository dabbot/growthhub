CREATE TABLE public.google_connection (
  key text PRIMARY KEY DEFAULT 'default',
  client_id text,
  client_secret text,
  developer_token text,
  refresh_token text,
  access_token text,
  token_expires_at timestamptz,
  google_email text,
  customer_id text,
  login_customer_id text,
  account_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.google_oauth_state (
  state text PRIMARY KEY,
  redirect_uri text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.google_connection TO service_role;
GRANT ALL ON public.google_oauth_state TO service_role;

ALTER TABLE public.google_connection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_oauth_state ENABLE ROW LEVEL SECURITY;