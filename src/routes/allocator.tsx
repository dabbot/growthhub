import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { pageHead } from "@/components/dashboard/Meta";
import { useCompany } from "@/lib/company";
import { CHANNELS, channelOutcome, recommendMix } from "@/lib/growth-os";

export const Route = createFileRoute("/allocator")({
  head: () =>
    pageHead(
      "Budget Allocator",
      "Split a quarterly growth budget across channels and see projected new actives, blended CAC and where returns flatten.",
    ),
  component: AllocatorPage,
});

function AllocatorPage() {
  const { company } = useCompany();
  const chs = CHANNELS[company];
  const unit = "new 750+ actives";
  const [budget, setBudget] = useState(25);
  const rec = useMemo(() => recommendMix(chs, budget), [chs, budget]);
  const [manual, setManual] = useState<Record<string, number> | null>(null);
  const mix = manual ?? rec;

  const rows = chs.map((c) => ({ c, spend: mix[c.key] ?? 0, ...channelOutcome(c, mix[c.key] ?? 0) }));
  const total = rows.reduce((s, r) => s + r.actives, 0);
  const spent = rows.reduce((s, r) => s + r.spend, 0);
  const blended = total > 0 ? (spent * 1e7) / (total * 1e6) : 0;
  const recTotal = chs.reduce((s, c) => s + channelOutcome(c, rec[c.key] ?? 0).actives, 0);
  const fmtN = (m: number) => (m >= 1 ? `${m.toFixed(2)}M` : `${Math.round(m * 1000).toLocaleString("en-IN")}k`);

  return (
    <div className="space-y-6">
      <PageHeader
        step="11 · Budget Allocator"
        title="Where should the next rupee go?"
        question={`Set a quarterly budget and the planner splits it across channels to buy the most ${unit}, allowing for costs rising as each audience runs dry.`}
      />
      <Panel
        title="Quarterly budget"
        right={<DataBadge kind="modeled" source="CAC curves are modelled from public benchmarks and the ad audit; replace with live spend via Data Connectors." />}
        soWhat={`Past the point where extra spend in a channel costs twice its starting price, the money buys more ${unit} elsewhere — the planner moves it automatically.`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="range"
            min={1}
            max={60}
            step={0.5}
            value={budget}
            onChange={(e) => {
              setBudget(Number(e.target.value));
              setManual(null);
            }}
            className="w-full max-w-md accent-[var(--color-primary)]"
            aria-label="Quarterly budget"
          />
          <p className="tabular text-2xl font-semibold">₹{budget} Cr</p>
          {manual ? (
            <button onClick={() => setManual(null)} className="rounded-md border border-border px-3 py-1 text-xs">
              Reset to recommended
            </button>
          ) : null}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat label={`Projected ${unit}`} value={fmtN(total)} />
          <Stat label="Blended cost per win" value={`₹${Math.round(blended).toLocaleString("en-IN")}`} />
          <Stat
            label="vs recommended mix"
            value={manual ? `${(((total - recTotal) / (recTotal || 1)) * 100).toFixed(0)}%` : "Recommended"}
          />
        </div>
      </Panel>

      <Panel
        title="Channel split"
        eyebrow="Drag any slider to override the recommendation"
        soWhat="The cheapest channel isn't always the biggest: search is cheapest but runs out of people searching; bank partners are slow but cover the widest pool."
      >
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.c.key} className="grid gap-2 sm:grid-cols-[180px_1fr_220px] sm:items-center">
              <div>
                <p className="text-sm font-medium">{r.c.label}</p>
                <p className="text-[11px] text-muted-foreground">{r.c.note}</p>
              </div>
              <input
                type="range"
                min={0}
                max={budget}
                step={0.25}
                value={r.spend}
                onChange={(e) => setManual({ ...mix, [r.c.key]: Number(e.target.value) })}
                className="accent-[var(--color-primary)]"
                aria-label={`${r.c.label} spend`}
              />
              <p className="tabular text-sm">
                ₹{r.spend.toFixed(2)} Cr · {fmtN(r.actives)} · <span className="text-muted-foreground">₹{Math.round(r.cac).toLocaleString("en-IN")}/win</span>
              </p>
            </div>
          ))}
        </div>
        {manual && Math.abs(spent - budget) > 0.01 ? (
          <p className="mt-4 text-xs text-primary">Manual split totals ₹{spent.toFixed(2)} Cr against a ₹{budget} Cr budget.</p>
        ) : null}
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/60 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="tabular mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
