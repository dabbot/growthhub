import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import { useAssumptions } from "@/lib/assumptions";
import {
  SEGMENT_DIMENSIONS,
  opportunitySegments,
  segmentBreakdown,
  type DimensionKey,
  type SegmentKey,
} from "@/lib/model";
import { fmtM, fmtPct } from "@/lib/format";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/opportunity")({
  head: () => ({
    meta: [
      { title: "The 10M Opportunity — Growth Dashboard" },
      {
        name: "description",
        content:
          "Compare Acme's active, lapsed and not-yet-qualified members by card ownership, credit score and engagement to see where the next 10M members come from.",
      },
      { property: "og:title", content: "The 10M Opportunity — Growth Dashboard" },
      {
        property: "og:description",
        content: "Three member groups, three lenses, one question: who is actually winnable?",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

const TONE: Record<SegmentKey, { bar: string; text: string; border: string; dot: string }> = {
  active: {
    bar: "bg-reported",
    text: "text-reported",
    border: "border-reported/50",
    dot: "bg-reported",
  },
  lapsed: {
    bar: "bg-primary",
    text: "text-primary",
    border: "border-primary/50",
    dot: "bg-primary",
  },
  not_qualified: {
    bar: "bg-modeled",
    text: "text-modeled",
    border: "border-modeled/50",
    dot: "bg-modeled",
  },
};

function OpportunityPage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const { get } = useAssumptions();

  const segments = opportunitySegments(data, get);
  const [on, setOn] = useState<SegmentKey[]>(["active", "lapsed", "not_qualified"]);
  const [dimension, setDimension] = useState<DimensionKey>("credit_score");
  const [bucket, setBucket] = useState<string | null>(null);

  const shown = segments.filter((s) => on.includes(s.key));
  const rows = useMemo(
    () => segmentBreakdown(data, get, dimension, shown.map((s) => s.key)),
    [data, get, dimension, shown],
  );
  const dim = SEGMENT_DIMENSIONS.find((d) => d.key === dimension)!;
  const maxCell = Math.max(...rows.flatMap((r) => r.cells.map((c) => c.size_m)), 0.1);
  const openRow = rows.find((r) => r.bucket === bucket) ?? null;

  const winnable = segments
    .filter((s) => s.key !== "active")
    .reduce((sum, s) => sum + s.qualifiedNow_m, 0);
  const total = segments.reduce((s, x) => s + x.size_m, 0);

  function toggle(key: SegmentKey) {
    setOn((prev) =>
      prev.includes(key)
        ? prev.length === 1
          ? prev
          : prev.filter((k) => k !== key)
        : [...prev, key],
    );
  }

  const act = segments.find((s) => s.key === "active")!;
  const lap = segments.find((s) => s.key === "lapsed")!;
  const nq = segments.find((s) => s.key === "not_qualified")!;
  const pushable = segments
    .filter((s) => s.key !== "active")
    .reduce((sum, s) => sum + Math.min(s.qualifiedNow_m, s.inAppReach_m), 0);

  const storyBars = (step: number) => {
    const rowsOut = [
      { key: "active", label: act.label, value: act.size_m, tone: "bg-reported", lit: step === 1 },
      { key: "lapsed", label: lap.label, value: lap.size_m, tone: "bg-primary", lit: step === 2 },
      {
        key: "nq",
        label: nq.label,
        value: nq.size_m,
        tone: "bg-modeled",
        lit: step === 3,
      },
    ].map((r) => ({
      ...r,
      display: fmtM(r.value, 1),
      dim: step > 0 && !r.lit && step < 4,
    }));
    if (step >= 4) {
      rowsOut.push({
        key: "winnable",
        label: "Winnable today (750+, outside the active base)",
        value: winnable,
        tone: "bg-positive",
        lit: true,
        display: fmtM(winnable, 1),
        dim: false,
      });
      rowsOut.push({
        key: "push",
        label: "…of which reachable free, in the app",
        value: pushable,
        tone: "bg-positive",
        lit: true,
        display: fmtM(pushable, 1),
        dim: false,
      });
    }
    return rowsOut;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        step="2 · The 10M Opportunity"
        title={`Of the ${fmtM(total, 0)} people who have already installed Acme, who can we actually win?`}
        question="Active, lapsed and not-yet-qualified members, compared by card ownership, credit score and engagement."
      />

      <Panel
        eyebrow="Pick your groups"
        title="Three groups, sized off the Acme funnel"
        soWhat={`${fmtM(winnable, 1)} people outside the active base clear the 750 gate today. That is the honest 10M-plus opportunity, not the full ${fmtM(total - segments[0]!.size_m, 0)} who lapsed or never qualified.`}
        right={
          <DataBadge
            kind="modeled"
            source="Example funnel figures for the fictional Acme"
            assumptionKeys={["prime_share"]}
          />
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          {segments.map((s) => {
            const active = on.includes(s.key);
            const tone = TONE[s.key];
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggle(s.key)}
                aria-pressed={active}
                className={cn(
                  "rounded-lg border p-4 text-left transition-all",
                  active
                    ? `${tone.border} bg-surface-2`
                    : "border-border bg-surface-2/30 opacity-50 hover:opacity-80",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", tone.dot)} />
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {s.label}
                  </p>
                </div>
                <p className={cn("mt-2 font-display text-3xl font-semibold", tone.text)}>
                  {fmtM(s.size_m, 0)}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.blurb}</p>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Clears 750 today</dt>
                    <dd className="font-medium">{fmtM(s.qualifiedNow_m, 1)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Still has the app</dt>
                    <dd className="font-medium">{fmtM(s.inAppReach_m, 1)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[11px] text-muted-foreground">{s.reachNote}</p>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel
        eyebrow="Drilldown"
        title={dim.question}
        soWhat={dim.soWhat}
        right={
          <div className="flex flex-wrap gap-1">
            {SEGMENT_DIMENSIONS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  setDimension(d.key);
                  setBucket(null);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  d.key === dimension
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {shown.map((s) => (
            <span key={s.key} className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", TONE[s.key].dot)} />
              {s.short}
            </span>
          ))}
          <span>Bar length is people, in millions. Percentage is the share of that group.</span>
        </div>

        <div className="space-y-3">
          {rows.map((row) => {
            const open = row.bucket === bucket;
            return (
              <div
                key={row.bucket}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  open ? "border-primary/40 bg-surface-2" : "border-border bg-surface-2/30",
                )}
              >
                <button
                  type="button"
                  onClick={() => setBucket(open ? null : row.bucket)}
                  aria-expanded={open}
                  className="w-full text-left"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium">{row.bucket}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtM(row.total_m, 1)} across the groups shown
                    </p>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {row.cells.map((cell) => (
                      <div key={cell.segment} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-[11px] text-muted-foreground">
                          {segments.find((s) => s.key === cell.segment)!.short}
                        </span>
                        <span className="h-3 flex-1 overflow-hidden rounded-sm bg-surface-3/60">
                          <span
                            className={cn("block h-full rounded-sm", TONE[cell.segment].bar)}
                            style={{ width: `${(cell.size_m / maxCell) * 100}%` }}
                          />
                        </span>
                        <span className="w-32 shrink-0 text-right text-[11px]">
                          <span className="font-medium">{fmtM(cell.size_m, 1)}</span>
                          <span className="text-muted-foreground"> · {fmtPct(cell.share_pct, 0)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {openRow ? (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
              {openRow.bucket}
            </p>
            <p className="mt-2 leading-relaxed">
              {openRow.note ?? "No extra note recorded for this bucket."}
            </p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {openRow.cells.map((c) => (
                <li key={c.segment}>
                  {segments.find((s) => s.key === c.segment)!.label}:{" "}
                  <span className="text-foreground">{fmtM(c.size_m, 1)}</span> people,{" "}
                  {fmtPct(c.share_pct, 0)} of that group.
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            Click a bar group for the working behind it.
          </p>
        )}
      </Panel>

      <Panel
        eyebrow="The takeaway"
        title="Where the next members actually come from"
        soWhat="Sorted by how little it costs to reach them, not by how big the group looks."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[...segments]
            .filter((s) => s.key !== "active")
            .sort((a, b) => b.qualifiedNow_m - a.qualifiedNow_m)
            .concat(segments.filter((s) => s.key === "active"))
            .map((s) => {
              const pushable = Math.min(s.qualifiedNow_m, s.inAppReach_m);
              return (
                <div key={s.key} className="rounded-lg border border-border bg-surface-2/40 p-4">
                  <p className={cn("text-sm font-medium", TONE[s.key].text)}>{s.label}</p>
                  <p className="mt-2 text-sm">
                    {s.key === "active"
                      ? `${fmtM(s.size_m, 1)} to hold on to. ${fmtPct(
                          (data.segmentProfiles.find(
                            (p) =>
                              p.segment === "active" &&
                              p.dimension === "engagement" &&
                              p.bucket === "Quiet 90 days plus",
                          )?.share_pct ?? 0) as number,
                          0,
                        )} of them have gone quiet for 90 days and are the next lapsed cohort.`
                      : `${fmtM(s.qualifiedNow_m, 1)} clear the gate today. About ${fmtM(
                          pushable,
                          1,
                        )} of those still have the app, so a push reaches them for nothing; the rest need paid media.`}
                  </p>
                </div>
              );
            })}
        </div>
      </Panel>
    </div>
  );
}

function CompanyView() {
  return <OpportunityPage />;
}
