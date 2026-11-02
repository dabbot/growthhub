import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { pageHead } from "@/components/dashboard/Meta";
import { useCompany } from "@/lib/company";
import { CROSS_SELL } from "@/lib/growth-os";

export const Route = createFileRoute("/cross-sell")({
  head: () =>
    pageHead("Cross-Sell Headroom", "How much more revenue sits inside the existing customer base across every product."),
  component: CrossSellPage,
});

const cr = (rupees: number) => `₹${(rupees / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;

function CrossSellPage() {
  const { company } = useCompany();
  const [lift, setLift] = useState(0);
  const rows = CROSS_SELL[company].map((p) => {
    const target = p.targetPct + lift;
    const now = p.eligibleM * 1e6 * (p.adoptionPct / 100) * p.revenuePerUserYr;
    const then = p.eligibleM * 1e6 * (target / 100) * p.revenuePerUserYr;
    return { p, target, now, then, gap: then - now };
  });
  const gap = rows.reduce((s, r) => s + r.gap, 0);
  const max = Math.max(...rows.map((r) => r.then));

  return (
    <div className="space-y-6">
      <PageHeader
        step="13 · Cross-Sell Headroom"
        title="How much more can existing customers be worth?"
        question="Bill payments win the trusted member; these products turn them into revenue."
      />
      <Panel
        title="Yearly revenue: today vs target adoption"
        right={<DataBadge kind="modeled" source="Example figures for the fictional Acme. Replace with your own product data." />}
        soWhat={`Hitting the target adoption rates adds about ${cr(gap)} a year without buying a single new customer.`}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          The products below account for {cr(rows.reduce((s, r) => s + r.now, 0))} a year today; the rest
          comes from bill payments, rewards and brand partnerships.
        </p>
        <label className="mb-5 block max-w-sm text-sm">
          Stretch every target by <span className="tabular text-primary">+{lift} pts</span>
          <input type="range" min={0} max={10} value={lift} onChange={(e) => setLift(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-primary)]" />
        </label>
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.p.product}>
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-medium">{r.p.product} <span className="text-xs text-muted-foreground">— {r.p.what}</span></span>
                <span className="tabular">{cr(r.now)} → {cr(r.then)}</span>
              </div>
              <div className="relative mt-1 h-3 rounded bg-surface-2">
                <div className="absolute inset-y-0 left-0 rounded bg-primary/35" style={{ width: `${(r.then / max) * 100}%` }} />
                <div className="absolute inset-y-0 left-0 rounded bg-primary" style={{ width: `${(r.now / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="The move for each product" soWhat="Each move uses a moment customers already reach in the app, so the cost is product time, not ad spend.">
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <div key={r.p.product} className="rounded-lg border border-border p-4">
              <p className="font-medium">{r.p.product}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.p.eligibleM >= 1 ? `${r.p.eligibleM}M` : `${Math.round(r.p.eligibleM * 1000)}k`} eligible · {r.p.adoptionPct}% use it today · target {r.target}%
              </p>
              <p className="mt-2 text-sm">{r.p.move}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
