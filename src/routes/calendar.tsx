import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { pageHead } from "@/components/dashboard/Meta";
import { useCompany, type CompanyKey } from "@/lib/company";
import { useLocal } from "@/lib/use-local";
import { CHANNELS, CROSS_SELL, EXP_STORAGE, SEED_EXPERIMENTS, recommendMix, rice, type Experiment } from "@/lib/growth-os";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => pageHead("Growth Calendar", "The next 30 days of growth activity — experiments, campaigns, cross-sell pushes and reviews — laid out as a calendar."),
  component: CalendarPage,
});

type Kind = "experiment" | "campaign" | "cross-sell" | "review";
type Activity = { id: string; day: number; kind: Kind; title: string; owner: string; detail: string; steps: string[]; metric: string };

const KIND: Record<Kind, { label: string; cls: string }> = {
  experiment: { label: "Experiment", cls: "border-primary/50 bg-primary/15 text-foreground" },
  campaign: { label: "Campaign", cls: "border-derived/50 bg-derived/15 text-foreground" },
  "cross-sell": { label: "Cross-sell", cls: "border-positive/50 bg-positive/15 text-foreground" },
  review: { label: "Review", cls: "border-border bg-surface-2 text-foreground" },
};

function buildPlan(company: CompanyKey, exps: Experiment[]): Activity[] {
  const out: Activity[] = [];
  const chs = CHANNELS[company];
  const budget = 25;
  const mix = recommendMix(chs, budget);
  const monthly = (k: string) => ((mix[k] ?? 0) / 3).toFixed(2);

  // Weekly reviews
  [0, 7, 14, 21, 28].forEach((d, i) =>
    out.push({ id: `rev${d}`, day: d, kind: "review", title: i === 0 ? "Month kick-off" : `Week ${i + 1} growth review`, owner: "Head of Growth",
      detail: "Check experiments, channel spend and model-vs-actual gaps; decide what to scale or stop.",
      steps: ["Review running experiments and call winners/losers", "Compare spend and cost per win to plan", "Update the assumption dials if actuals drifted >10%"],
      metric: "Decisions logged, owners assigned" }),
  );

  // Experiments: running ones get a readout, top backlog ones get a launch
  const running = exps.filter((e) => e.status === "in_flight");
  running.forEach((e, i) =>
    out.push({ id: `read-${e.id}`, day: 10 + i * 3, kind: "experiment", title: `Readout: ${e.title}`, owner: `${e.channel} lead`,
      detail: `Currently running for ${e.segment}. Decide won / killed and record the result on the Experiments board.`,
      steps: ["Pull results against the control", "Check the effect held for at least 2 weeks", "Mark won or killed with the result"], metric: `Score ${Math.round(rice(e))}` }),
  );
  const next = exps.filter((e) => e.status === "prioritised" || e.status === "backlog").sort((a, b) => rice(b) - rice(a)).slice(0, 4);
  next.forEach((e, i) =>
    out.push({ id: `launch-${e.id}`, day: 2 + i * 6, kind: "experiment", title: `Launch: ${e.title}`, owner: `${e.channel} lead`,
      detail: `Top-ranked idea for ${e.segment}: reach ${e.reach}k a quarter, ${e.effort} person-weeks of effort.`,
      steps: ["Write the hypothesis and success metric", "Set up control and test groups", "Go live and move the card to Running"], metric: `Score ${Math.round(rice(e))}` }),
  );

  // Campaigns: one per channel with budget
  chs.filter((c) => (mix[c.key] ?? 0) > 0).forEach((c, i) =>
    out.push({ id: `camp-${c.key}`, day: 1 + i * 4, kind: "campaign", title: `${c.label}: monthly flight`, owner: "Performance marketing",
      detail: `${c.note} Recommended spend this month: ₹${monthly(c.key)} Cr.`,
      steps: ["Brief creative from the Run Campaigns screen", "Launch paused, check targeting, then switch on", "Mid-month: cut the worst 2 ads, shift budget to the best"],
      metric: `Cost per win under ₹${c.baseCac.toLocaleString("en-IN")}` }),
  );

  // Cross-sell pushes
  CROSS_SELL[company].forEach((p, i) =>
    out.push({ id: `cs-${i}`, day: 5 + i * 5, kind: "cross-sell", title: `${p.product} push`, owner: "Product & CRM",
      detail: `${p.what}. ${p.adoptionPct}% use it today; target ${p.targetPct}%.`, steps: [p.move, "Send to a 10% holdout first", "Roll out if uptake beats holdout by 2 pts+"],
      metric: `Adoption ${p.adoptionPct}% → ${p.targetPct}%` }),
  );
  return out.filter((a) => a.day < 30);
}

function CalendarPage() {
  const { company } = useCompany();
  const [exps] = useLocal<Experiment[]>(EXP_STORAGE(company), SEED_EXPERIMENTS[company]);
  const [open, setOpen] = useState<Activity | null>(null);
  const [filter, setFilter] = useState<Kind | "all">("all");
  const [start] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });

  const plan = useMemo(() => buildPlan(company, exps), [company, exps]);
  const shown = plan.filter((a) => filter === "all" || a.kind === filter);
  const lead = start.getDay(); // blank cells before day 1
  const cells = Array.from({ length: lead + 30 }, (_, i) => i - lead);
  const dateOf = (n: number) => { const d = new Date(start); d.setDate(d.getDate() + n); return d; };

  return (
    <div className="space-y-6">
      <PageHeader
        step="17 · Growth Calendar"
        title="The next 30 days"
        question="Every experiment, campaign flight, cross-sell push and review, built from the other screens. Click any item for the detail."
      />
      <Panel
        title={`${dateOf(0).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${dateOf(29).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
        right={<DataBadge kind="derived" source="Scheduled from the Budget Allocator, Experiments board and Cross-Sell screens; dates are a suggested plan." />}
        soWhat="One shared view of who is doing what this month, so launches don't collide and every test gets a readout date."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "experiment", "campaign", "cross-sell", "review"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)}
              className={cn("rounded-full border px-3 py-1 text-xs", filter === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
              {k === "all" ? `All · ${plan.length}` : `${KIND[k].label} · ${plan.filter((a) => a.kind === k).length}`}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-surface-2 px-2 py-1.5 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{d}</div>
          ))}
          {cells.map((n) => {
            if (n < 0) return <div key={`b${n}`} className="min-h-24 bg-card/40" />;
            const d = dateOf(n);
            const items = shown.filter((a) => a.day === n);
            return (
              <div key={n} className={cn("min-h-24 bg-card p-1.5 sm:min-h-28", n === 0 && "ring-1 ring-inset ring-primary")}>
                <p className={cn("tabular mb-1 text-[11px]", n === 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
                  {d.getDate() === 1 || n === 0 ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : d.getDate()}
                </p>
                <div className="space-y-1">
                  {items.map((a) => (
                    <button key={a.id} onClick={() => setOpen(a)}
                      className={cn("block w-full truncate rounded border px-1.5 py-0.5 text-left text-[10px] leading-tight hover:brightness-125 sm:text-[11px]", KIND[a.kind].cls)}
                      title={a.title}>
                      {a.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg">
          {open ? (
            <>
              <DialogHeader>
                <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
                  {KIND[open.kind].label} · {dateOf(open.day).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <DialogTitle>{open.title}</DialogTitle>
                <DialogDescription>{open.detail}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p><span className="text-muted-foreground">Owner: </span>{open.owner}</p>
                <div>
                  <p className="text-muted-foreground">Steps</p>
                  <ol className="mt-1 list-decimal space-y-1 pl-5">{open.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                </div>
                <p><span className="text-muted-foreground">Success measure: </span>{open.metric}</p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
