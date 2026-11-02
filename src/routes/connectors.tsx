import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Plug } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { useCompany } from "@/lib/company";
import { CONNECTORS, CONNECTOR_GROUPS, type Connector } from "@/lib/connectors";
import { listConnections, removeConnection, saveConnection, type ConnectionRow } from "@/lib/connectors.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/connectors")({
  head: () => ({
    meta: [
      { title: "Data Connectors · Growth Dashboard" },
      { name: "description", content: "Connect ad, analytics, SEO and product tools to feed the growth dashboard richer data." },
      { property: "og:title", content: "Data Connectors · Growth Dashboard" },
      { property: "og:description", content: "Connect ad, analytics, SEO and product tools to feed the growth dashboard richer data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConnectorsPage,
});

function Logo({ c }: { c: Connector }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2">
      {broken ? (
        <span className="font-display text-sm font-semibold" style={{ color: c.color }}>
          {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </span>
      ) : (
        <img
          src={`https://cdn.simpleicons.org/${c.logo}/${c.color.slice(1)}`}
          alt={`${c.name} logo`}
          className="size-6"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      )}
    </div>
  );
}

function ConnectorsPage() {
  const { company } = useCompany();
  const qc = useQueryClient();
  const list = useServerFn(listConnections);
  const save = useServerFn(saveConnection);
  const remove = useServerFn(removeConnection);
  const [active, setActive] = useState<Connector | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const key = ["connections", company];
  const { data: rows = [] } = useQuery({ queryKey: key, queryFn: () => list({ data: { company } }) });
  const byId = new Map<string, ConnectionRow>(rows.map((r) => [r.platform, r]));

  const connect = useMutation({
    mutationFn: () => save({ data: { company, platform: active!.id, credentials: form } }),
    onSuccess: (r) => {
      toast.success(`${active!.name} connected — ${r.label}`);
      setActive(null);
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const disconnect = useMutation({
    mutationFn: (platform: string) => remove({ data: { company, platform } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });

  const connectedCount = rows.length;

  return (
    <div>
      <PageHeader
        step="16 · Data Connectors"
        title="Plug in the tools your team already uses"
        question="Connect ad accounts, analytics, SEO and product tools so the dashboard can work from your real numbers, not estimates."
        right={
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary">
            {connectedCount} of {CONNECTORS.length} connected
          </span>
        }
      />

      {CONNECTOR_GROUPS.map((g) => {
        const items = CONNECTORS.filter((c) => c.group === g);
        if (!items.length) return null;
        return (
          <section key={g} className="mb-8">
            <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">{g}</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((c) => {
                const row = byId.get(c.id);
                return (
                  <div key={c.id} className="panel flex flex-col gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <Logo c={c} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.gives}</p>
                      </div>
                    </div>
                    {row ? (
                      <p className="flex items-center gap-1.5 text-xs text-positive">
                        <CheckCircle2 className="size-3.5" />
                        <span className="truncate">{row.status === "saved" ? "Saved" : "Connected"} · {row.account_label}</span>
                      </p>
                    ) : null}
                    <div className="mt-auto flex gap-2">
                      {c.managedAt ? (
                        <Link
                          to="/campaigns"
                          className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20"
                        >
                          <Plug className="size-3.5" /> Connect on Run Campaigns
                        </Link>
                      ) : row ? (
                        <>
                          <button
                            onClick={() => { setActive(c); setForm({}); }}
                            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-2"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => disconnect.mutate(c.id)}
                            className="rounded-md border border-border px-3 py-1.5 text-xs text-negative hover:bg-surface-2"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setActive(c); setForm({}); }}
                          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          <Plug className="size-3.5" /> Connect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <Panel
        eyebrow="How it works"
        title="Your keys stay on the server"
        soWhat="The more of your own tools are plugged in, the fewer numbers on this dashboard need to be modelled — and the more the playbook reflects what is actually happening."
      >
        <p className="text-sm text-muted-foreground">
          Each tool is connected with its own official access method — an API key, a service account or a
          sign-in. We check the details with one read-only request before saving. Keys are stored privately,
          never shown again, and only signed-in team members can connect or disconnect. Connections are kept
          separately for each company.
        </p>
      </Panel>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Logo c={active} /> Connect {active.name}
                </DialogTitle>
                <DialogDescription>{active.how}</DialogDescription>
              </DialogHeader>
              <form
                className="space-y-3"
                onSubmit={(e) => { e.preventDefault(); connect.mutate(); }}
              >
                {active.fields.map((f) => (
                  <label key={f.key} className="block text-xs">
                    <span className="text-muted-foreground">{f.label}</span>
                    {f.multiline ? (
                      <textarea
                        rows={5}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                        placeholder={f.placeholder}
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      />
                    ) : (
                      <input
                        type={f.secret ? "password" : "text"}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder={f.placeholder}
                        autoComplete="off"
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      />
                    )}
                  </label>
                ))}
                <button
                  type="submit"
                  disabled={connect.isPending}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {connect.isPending ? "Checking…" : active.verified ? "Check and connect" : "Save"}
                </button>
              </form>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
