import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import { useAssumptions } from "@/lib/assumptions";
import { issuerTable, overlapView } from "@/lib/model";
import { useSelection } from "@/lib/selection";
import { fmtM, fmtPct } from "@/lib/format";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/overlap")({
  head: () => ({
    meta: [
      { title: "Acme Overlap — Growth Dashboard" },
      {
        name: "description",
        content:
          "Where Acme is strong and whose app the cardholder is living in instead: bank app, UPI super-app or Acme.",
      },
      { property: "og:title", content: "Acme Overlap — Growth Dashboard" },
      {
        property: "og:description",
        content: "Bank app, UPI super-app or Acme — where card bills actually get paid.",
      },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

function OverlapPage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const { get } = useAssumptions();
  const { issuer, setIssuer } = useSelection();
  const o = overlapView(data, get);
  const rows = issuerTable(data);

  return (
    <div>
      <PageHeader
        step="5 · Acme Overlap"
        title="Where is Acme strong, and whose app is the customer living in instead?"
        question="The weakest numbers on the dashboard. Directional until your own cohort totals replace the example figures."
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          eyebrow="Venn"
          title="Bank app · UPI super-app · Acme"
          soWhat="The biggest pool is not loyal to a rival — it is paying inside the bank's own app out of habit."
          right={
            <DataBadge
              kind="modeled"
              source="Example bill-pay channel split"
              assumptionKeys={["bank_app_overlap", "upi_overlap", "cards_per_holder"]}
            />
          }
        >
          <div className="flex flex-col items-center gap-4">
            <svg viewBox="0 0 420 300" className="h-64 w-full max-w-lg">
              <circle cx="160" cy="120" r="95" fill="var(--color-chart-4)" fillOpacity="0.28" />
              <circle cx="260" cy="120" r="95" fill="var(--color-chart-2)" fillOpacity="0.28" />
              <circle cx="210" cy="200" r="95" fill="var(--color-primary)" fillOpacity="0.28" />
              <text x="95" y="70" fill="var(--color-foreground)" fontSize="12">
                Bank app
              </text>
              <text x="290" y="70" fill="var(--color-foreground)" fontSize="12">
                PhonePe / GPay
              </text>
              <text x="185" y="285" fill="var(--color-foreground)" fontSize="12">
                Acme
              </text>
              <text x="108" y="120" fill="var(--color-foreground)" fontSize="13" fontWeight="600">
                {fmtM(o.bankOnly, 1)}
              </text>
              <text x="288" y="120" fill="var(--color-foreground)" fontSize="13" fontWeight="600">
                {fmtM(o.upiOnly, 1)}
              </text>
              <text x="188" y="235" fill="var(--color-foreground)" fontSize="13" fontWeight="600">
                {fmtM(o.brandOnly, 1)}
              </text>
              <text x="196" y="112" fill="var(--color-foreground)" fontSize="11">
                {fmtM(o.bankUpi, 1)}
              </text>
              <text x="146" y="180" fill="var(--color-foreground)" fontSize="11">
                {fmtM(o.bankBrand, 1)}
              </text>
              <text x="252" y="180" fill="var(--color-foreground)" fontSize="11">
                {fmtM(o.upiBrand, 1)}
              </text>
              <text x="198" y="152" fill="var(--color-foreground)" fontSize="11">
                {fmtM(o.all, 2)}
              </text>
            </svg>
            <div className="grid w-full gap-2 sm:grid-cols-3">
              {[
                ["Bank app reach", o.bankTotal],
                ["UPI app reach", o.upiTotal],
                ["Acme reach", o.brandTotal],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="rounded-lg border border-border bg-surface-2/50 px-3 py-2"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {label as string}
                  </p>
                  <p className="tabular mt-1 font-display text-lg font-semibold">
                    {fmtM(value as number, 1)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-2"
          eyebrow="NPCI, May 2026"
          title="UPI app share — the attention competitors"
          soWhat="Two apps carry most UPI volume: attention, not capability, is the constraint."
          right={<DataBadge kind="reported" source="NPCI UPI ecosystem statistics, May 2026" />}
        >
          <div className="space-y-3">
            {data.upiShare.map((row) => {
              const share = Number(row.share_pct);
              const isBrand = row.app === "Acme";
              return (
                <div key={row.app}>
                  <div className="flex justify-between text-xs">
                    <span className={isBrand ? "font-semibold text-primary" : undefined}>
                      {row.app}
                    </span>
                    <span className="tabular text-muted-foreground">{fmtPct(share, 1)}</span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-surface-2">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        isBrand ? "bg-primary" : "bg-chart-4/80",
                      )}
                      style={{ width: `${Math.max(share, 0.6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-4"
        eyebrow="Heatmap"
        title="Issuer × Acme penetration"
        soWhat="SBI, Bank of Baroda and RBL hold huge bases with the thinnest Acme presence — that is the gap."
        right={<DataBadge kind="modeled" source="Example Acme bank mix" />}
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((r) => (
            <button
              key={r.slug}
              onClick={() => setIssuer(r.slug)}
              style={{
                backgroundColor: `color-mix(in oklab, var(--color-primary) ${Math.min(Number(r.penetration_pct),55)}%, var(--color-surface-2))`,
              }}
              className={cn(
                "rounded-lg border px-3 py-3 text-left transition-colors",
                issuer === r.slug ? "border-primary" : "border-border hover:border-primary/50",
              )}
            >
              <p className="text-xs font-semibold">{r.name}</p>
              <p className="tabular mt-1 text-[11px] text-foreground/85">
                {r.cards_m.toFixed(1)}M cards · {fmtPct(r.penetration_pct, 0)} on Acme
              </p>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function CompanyView() {
  return <OverlapPage />;
}
