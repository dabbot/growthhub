import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";
import { Panel } from "./Panel";
import { DataBadge } from "./DataBadge";
import { lookupApp, type AppProfile } from "@/lib/app-lookup.functions";
import { useCompany } from "@/lib/company";
import { cn } from "@/lib/utils";

const KEY = "growth-dashboard-added-apps";

export function AddedApps() {
  const { company } = useCompany();
  const [name, setName] = useState("");
  const [apps, setApps] = useState<AppProfile[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setApps(JSON.parse(raw) as AppProfile[]);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (next: AppProfile[]) => {
    setApps(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const add = useMutation({
    mutationFn: (appName: string) => lookupApp({ data: { name: appName, company } }),
    onSuccess: (profile) => {
      persist([profile, ...apps.filter((a) => a.name !== profile.name)]);
      setName("");
      toast.success(`${profile.name} added to the scorecard.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Panel
      title="Add any app and see how it compares"
      eyebrow="Your own comparison set"
      soWhat="Anyone competing for the same user is worth a look. Type an app name and you get its rating, install band, what reviewers complain about and what would make them switch."
      right={
        <DataBadge
          kind="modeled"
          source="Assembled from publicly known listing and review information. Figures are approximate and move over time."
        />
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) add.mutate(name.trim());
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. a competitor's app name"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
          aria-label="App name"
        />
        <button
          type="submit"
          disabled={add.isPending || name.trim().length < 2}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {add.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {add.isPending ? "Looking it up…" : "Add app"}
        </button>
      </form>

      {apps.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing added yet. Whatever you add stays on this screen for you.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map((a) => (
            <div key={a.name} className="rounded-xl border border-border bg-surface-2/50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base font-semibold">{a.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.owner} · {a.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "font-display text-2xl font-semibold tabular-nums",
                      Number(a.rating) >= 4.5
                        ? "text-positive"
                        : Number(a.rating) >= 4
                          ? "text-primary"
                          : "text-modeled",
                    )}
                  >
                    {a.rating}
                  </p>
                  <button
                    type="button"
                    aria-label={`Remove ${a.name}`}
                    onClick={() => persist(apps.filter((x) => x.name !== a.name))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <dl className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Reviews</dt>
                  <dd className="tabular-nums">{a.reviews}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Downloads</dt>
                  <dd className="tabular-nums">{a.downloads}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Entry</dt>
                  <dd className="text-right">{a.gate}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">How sure</dt>
                  <dd className="text-right capitalize">{a.confidence}</dd>
                </div>
              </dl>

              <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                {a.verdict}
              </p>

              <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                What reviewers complain about
              </p>
              <ul className="mt-1 space-y-1.5">
                {a.complaints.map((c) => (
                  <li key={c.theme} className="text-sm">
                    <span className="font-medium">{c.theme}</span>{" "}
                    <span className="text-muted-foreground">{c.detail}</span>
                  </li>
                ))}
              </ul>

              {a.praise.length > 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="text-positive">Liked:</span> {a.praise.join(" · ")}
                </p>
              ) : null}

              <p className="mt-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
                {a.opportunity}
              </p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
