import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { pageHead } from "@/components/dashboard/Meta";
import { useCompany } from "@/lib/company";
import { ACTUALS_STORAGE, VARIANCE, varianceOf } from "@/lib/growth-os";
import { useLocal } from "@/lib/use-local";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/variance")({
  head: () =>
    pageHead("Model vs Actual", "Compare the dashboard's modelled numbers with what ads, analytics and SEO tools actually report."),
  component: VariancePage,
});

function VariancePage() {
  const { company } = useCompany();
  const rows = VARIANCE[company];
  const [actuals, setActuals] = useLocal<Record<string, number>>(ACTUALS_STORAGE(company), {});

  return (
    <div className="space-y-6">
      <PageHeader
        step="16 · Model vs Actual"
        title="Is reality matching the plan?"
        question="Every key modelled number beside this month's actual. Type actuals in, or connect the tool that reports them."
      />
      <Panel
        title="This month"
        right={<DataBadge kind="derived" source="Model values come from this dashboard; actuals are what you enter (saved in this browser)." />}
        soWhat="A gap over 10% means an assumption is wrong — fix the dial before it misleads the budget and the memo."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr><th className="py-2">Metric</th><th>Model</th><th>Actual</th><th>Gap</th><th>Where the actual comes from</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const v = varianceOf(r, actuals[r.metric]);
                return (
                  <tr key={r.metric} className="border-t border-border">
                    <td className="py-2 font-medium">{r.metric}<p className="text-[11px] font-normal text-muted-foreground">{r.source}</p></td>
                    <td className="tabular">{r.unit === "₹" ? "₹" : ""}{r.model.toLocaleString("en-IN")}{r.unit !== "₹" ? r.unit : ""}</td>
                    <td>
                      <input
                        type="number"
                        value={actuals[r.metric] ?? ""}
                        onChange={(e) => {
                          const next = { ...actuals };
                          if (e.target.value === "") delete next[r.metric];
                          else next[r.metric] = Number(e.target.value);
                          setActuals(next);
                        }}
                        placeholder="Enter"
                        className="w-24 rounded-md border border-border bg-card px-2 py-1 text-sm"
                      />
                    </td>
                    <td>
                      {v ? (
                        <span className={cn("rounded-full border px-2 py-0.5 text-xs", v.flag === "on" ? "border-border" : v.better ? "border-positive/40 text-positive" : "border-modeled/40 text-modeled")}>
                          {v.pct > 0 ? "+" : ""}{v.pct.toFixed(0)}% · {v.flag === "on" ? "on plan" : v.better ? "better" : "needs attention"}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="text-xs text-muted-foreground">
                      <Link to="/connectors" className="underline underline-offset-2">Connect {r.connector.replace("_", " ")}</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
