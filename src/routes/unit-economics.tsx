import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { pageHead } from "@/components/dashboard/Meta";
import { useCompany } from "@/lib/company";
import { COHORTS, ltv, paybackMonth } from "@/lib/growth-os";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/unit-economics")({
  head: () =>
    pageHead(
      "Unit Economics",
      "Cost to acquire, revenue per user, lifetime value and payback month for each customer group.",
    ),
  component: UnitPage,
});

const rs = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function UnitPage() {
  const { company } = useCompany();
  const cohorts = COHORTS[company];
  const [cacAdj, setCacAdj] = useState(0);
  const [churnAdj, setChurnAdj] = useState(0);
  const [arpuAdj, setArpuAdj] = useState(0);

  const rows = cohorts.map((c) => {
    const cac = c.cac * (1 + cacAdj / 100);
    const arpu = c.arpuMonth * (1 + arpuAdj / 100);
    const churn = Math.max(0.2, c.churnMonth + churnAdj);
    const l12 = ltv(arpu, churn, 12);
    const l36 = ltv(arpu, churn, 36);
    return { c, cac, arpu, churn, l12, l36, ratio: l36 / cac, payback: paybackMonth(cac, arpu, churn) };
  });
  const maxPay = 24;

  return (
    <div className="space-y-6">
      <PageHeader
        step="12 · Unit Economics"
        title="Which customers pay back, and how fast?"
        question="Cost to win each group against what they earn us over time. Move the dials to stress-test."
      />
      <Panel
        title="Stress-test the numbers"
        right={<DataBadge kind="modeled" source="Group-level CAC, revenue and churn are estimates; upload actual MIS to replace." />}
        soWhat="A 20% rise in acquisition cost barely hurts high earners but can push newcomers past a year to pay back — that's where budgets go wrong."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Dial label="Acquisition cost" value={cacAdj} set={setCacAdj} min={-40} max={60} suffix="%" />
          <Dial label="Revenue per user" value={arpuAdj} set={setArpuAdj} min={-40} max={60} suffix="%" />
          <Dial label="Monthly churn" value={churnAdj} set={setChurnAdj} min={-2} max={4} step={0.25} suffix=" pts" />
        </div>
      </Panel>

      <Panel title="Group by group" soWhat="Put paid money behind groups with lifetime value over 3x cost; win the rest through referrals and product, not ads.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="py-2">Group</th>
                <th>Cost to win</th>
                <th>Revenue / month</th>
                <th>Churn / month</th>
                <th>12-mo value</th>
                <th>36-mo value</th>
                <th>Value ÷ cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.c.key} className="border-t border-border">
                  <td className="py-2 font-medium">{r.c.label}</td>
                  <td className="tabular">{rs(r.cac)}</td>
                  <td className="tabular">{rs(r.arpu)}</td>
                  <td className="tabular">{r.churn.toFixed(1)}%</td>
                  <td className="tabular">{rs(r.l12)}</td>
                  <td className="tabular">{rs(r.l36)}</td>
                  <td className={cn("tabular font-semibold", r.ratio >= 3 ? "text-positive" : r.ratio >= 1.5 ? "text-primary" : "text-modeled")}>
                    {r.ratio.toFixed(1)}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Payback month" soWhat="Anything beyond 12 months ties up cash for a year before it earns — fine for loyal groups, risky for high-churn ones.">
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.c.key}>
                <div className="flex justify-between text-xs">
                  <span>{r.c.label}</span>
                  <span className="tabular">{r.payback ? `${r.payback} months` : "Never (60m+)"}</span>
                </div>
                <div className="mt-1 h-2 rounded bg-surface-2">
                  <div
                    className={cn("h-2 rounded", (r.payback ?? 99) <= 12 ? "bg-positive" : "bg-modeled")}
                    style={{ width: `${Math.min(100, ((r.payback ?? maxPay) / maxPay) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Where the revenue comes from" soWhat="Groups that lean on one revenue line are exposed if that product's rules change.">
          <div className="space-y-3">
            {cohorts.map((c) => (
              <div key={c.key}>
                <p className="text-xs">{c.label}</p>
                <div className="mt-1 flex h-3 overflow-hidden rounded">
                  {c.revenueMix.map((m, i) => (
                    <div
                      key={m.label}
                      title={`${m.label} ${m.share}%`}
                      style={{ width: `${m.share}%`, background: `color-mix(in oklab, var(--color-primary) ${90 - i * 30}%, transparent)` }}
                    />
                  ))}
                </div>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">
              {cohorts[0]!.revenueMix.map((m, i) => `${["Dark", "Mid", "Light"][i]}: ${m.label}`).join(" · ")}
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Dial({ label, value, set, min, max, step = 5, suffix }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number; suffix: string }) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between">
        {label}
        <span className="tabular text-primary">
          {value > 0 ? "+" : ""}
          {value}
          {suffix}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-primary)]" />
    </label>
  );
}
