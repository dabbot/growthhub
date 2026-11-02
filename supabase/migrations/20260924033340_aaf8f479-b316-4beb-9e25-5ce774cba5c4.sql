CREATE TABLE public.agent_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  assignment_key text NOT NULL,
  agent_key text NOT NULL,
  title text NOT NULL,
  brief text NOT NULL,
  context text NOT NULL DEFAULT '',
  removed boolean NOT NULL DEFAULT false,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company, assignment_key)
);
GRANT ALL ON public.agent_assignments TO service_role;
ALTER TABLE public.agent_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agent_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  assignment_key text NOT NULL,
  agent_key text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX agent_outputs_lookup ON public.agent_outputs (company, agent_key, created_at DESC);
GRANT ALL ON public.agent_outputs TO service_role;
ALTER TABLE public.agent_outputs ENABLE ROW LEVEL SECURITY;