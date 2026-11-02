import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminDecide, adminListCompanies } from "@/lib/onboarding.functions";
import { useCompany } from "@/lib/company";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · GrowthHub" },
      { name: "description", content: "Approve companies and track their dashboard builds." },
      { property: "og:title", content: "Admin · GrowthHub" },
      { property: "og:description", content: "Approve companies and track their dashboard builds." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useCompany();
  const list = useServerFn(adminListCompanies);
  const decide = useServerFn(adminDecide);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-companies"], queryFn: () => list(), enabled: isAdmin, refetchInterval: 15000 });

  if (!isAdmin) return <p className="text-sm text-muted-foreground">Admins only.</p>;

  const act = async (id: string, action: "approve" | "reject" | "revoke") => {
    setBusy(id);
    try {
      await decide({ data: { id, action } });
      await qc.invalidateQueries({ queryKey: ["admin-companies"] });
      await qc.invalidateQueries({ queryKey: ["access"] });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-semibold">Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every company added to this dashboard. Approved companies start building straight away. Admins are set with ADMIN_EMAILS.</p>
      {isLoading ? <p className="mt-6 text-sm text-muted-foreground">Loading…</p> : null}
      <div className="mt-6 space-y-3">
        {data.length === 0 && !isLoading ? <p className="text-sm text-muted-foreground">No companies added yet.</p> : null}
        {data.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-sm font-semibold">
                  {c.name} <span className="font-normal text-muted-foreground">· {c.team_domain ?? "personal"}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.status}{c.status === "approved" ? ` · build: ${c.build_status}` : ""}
                  {c.build_step && c.build_status !== "ready" ? ` · ${c.build_step}` : ""}
                  {c.build_error ? ` · ${c.build_error}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[c.website_url, c.play_url, c.appstore_url].filter(Boolean).join(" · ") || "No links"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Added by {c.created_email ?? "—"} · {c.members.length} member{c.members.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex gap-2">
                {c.status === "pending" || c.status === "rejected" || c.status === "revoked" ? (
                  <button disabled={busy === c.id} onClick={() => act(c.id, "approve")} className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">Approve</button>
                ) : null}
                {c.status === "pending" ? (
                  <button disabled={busy === c.id} onClick={() => act(c.id, "reject")} className="rounded-full border border-border px-3 py-1 text-xs">Reject</button>
                ) : null}
                {c.status === "approved" ? (
                  <button disabled={busy === c.id} onClick={() => act(c.id, "revoke")} className="rounded-full border border-destructive/50 px-3 py-1 text-xs text-destructive">Revoke</button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
