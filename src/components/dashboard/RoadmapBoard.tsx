import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRoadmapStatuses, setRoadmapStatus } from "@/lib/roadmap.functions";
import { FIX_LIST, type FixItem } from "@/lib/aso-seo";
import { cn } from "@/lib/utils";

type Status = "not_started" | "in_progress" | "shipped";

const STATUSES: { key: Status; label: string; tone: string }[] = [
  { key: "not_started", label: "Not started", tone: "text-muted-foreground" },
  { key: "in_progress", label: "In progress", tone: "text-primary" },
  { key: "shipped", label: "Shipped", tone: "text-positive" },
];

const HORIZONS: { key: FixItem["horizon"]; blurb: string }[] = [
  { key: "Now", blurb: "This sprint — a week each, no dependencies" },
  { key: "Next", blurb: "Next quarter — needs content or design time" },
  { key: "Later", blurb: "Once the quick wins have landed" },
];

const EFFORT_TONE: Record<string, string> = {
  Low: "text-positive",
  Medium: "text-primary",
  High: "text-modeled",
};

function useStatuses() {
  return useQuery({
    queryKey: ["roadmap-status"],
    queryFn: async () => {
      const data = await getRoadmapStatuses();
      const map: Record<string, { status: Status; updated_at: string }> = {};
      for (const r of data ?? []) {
        map[r.item_id] = { status: r.status as Status, updated_at: r.updated_at };
      }
      return map;
    },
  });
}

export function RoadmapBoard({ area }: { area: "all" | "ASO" | "SEO" }) {
  const qc = useQueryClient();
  const { data: statuses = {} } = useStatuses();

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      await setRoadmapStatus({ data: { itemId: id, status } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roadmap-status"] }),
  });

  const items = FIX_LIST.filter((f) => area === "all" || f.area === area);

  const tally = useMemo(() => {
    const total = items.reduce((s, f) => s + f.weeks, 0);
    const shipped = items.filter((f) => statuses[f.id]?.status === "shipped");
    const running = items.filter((f) => statuses[f.id]?.status === "in_progress");
    return {
      total,
      shippedWeeks: shipped.reduce((s, f) => s + f.weeks, 0),
      shippedCount: shipped.length,
      runningCount: running.length,
      count: items.length,
    };
  }, [items, statuses]);

  const pct = tally.total === 0 ? 0 : Math.round((tally.shippedWeeks / tally.total) * 100);

  return (
    <div className="grid gap-5">
      <div className="rounded-xl border border-border bg-surface-2/50 p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Live tracker
            </p>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {tally.shippedCount} of {tally.count} shipped
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {tally.runningCount} in progress · {tally.shippedWeeks} of {tally.total} person-weeks
              of work done
            </p>
          </div>
          <p className="font-display text-3xl font-semibold tabular-nums text-positive">{pct}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-positive transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {HORIZONS.map((h) => {
        const rows = items.filter((f) => f.horizon === h.key);
        if (rows.length === 0) return null;
        const weeks = rows.reduce((s, f) => s + f.weeks, 0);
        return (
          <div key={h.key}>
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-display text-base font-semibold">{h.key}</h3>
              <span className="text-xs text-muted-foreground">{h.blurb}</span>
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {weeks} person-weeks
              </span>
            </div>
            <ol className="grid gap-3">
              {rows.map((f) => {
                const st = statuses[f.id]?.status ?? "not_started";
                return (
                  <li
                    key={f.id}
                    className={cn(
                      "rounded-xl border p-4 transition-colors",
                      st === "shipped"
                        ? "border-positive/40 bg-positive/5"
                        : st === "in_progress"
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-surface-2/40",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          "font-semibold",
                          st === "shipped" && "text-muted-foreground line-through",
                        )}
                      >
                        {f.fix}
                      </p>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {f.area === "ASO" ? "App listing" : "Website"}
                      </span>
                      <span className={cn("text-xs font-semibold", EFFORT_TONE[f.effort])}>
                        {f.effort} effort · {f.weeks} {f.weeks === 1 ? "week" : "weeks"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{f.why}</p>
                    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Who does it</dt>
                        <dd>{f.squad}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">How we know it worked</dt>
                        <dd>{f.measure}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                      {STATUSES.map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => setStatus.mutate({ id: f.id, status: s.key })}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs transition-colors",
                            st === s.key
                              ? "border-current bg-foreground/5 " + s.tone
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                      {statuses[f.id] ? (
                        <span className="ml-auto text-[11px] text-muted-foreground">
                          updated{" "}
                          {new Date(statuses[f.id]!.updated_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
