import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import { useAssumptions } from "@/lib/assumptions";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataBadge } from "@/components/dashboard/DataBadge";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Sources & Method — Growth Dashboard" },
      {
        name: "description",
        content:
          "Every source, refresh date, assumption and known weakness behind the Growth Dashboard.",
      },
      { property: "og:title", content: "Sources & Method — Growth Dashboard" },
      {
        property: "og:description",
        content: "Where each number comes from, and how sure we are.",
      },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

function SourcesPage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const { list, get } = useAssumptions();

  return (
    <div>
      <PageHeader
        step="13 · Sources & Method"
        title="Where does each number come from, and how sure are we?"
        question="Public data covers the market side well. The overlap side needs a survey or your own cohort totals."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { kind: "reported", text: "Straight from RBI, NPCI or CIBIL." },
          { kind: "derived", text: "Arithmetic on reported numbers — share, spend per card." },
          { kind: "modeled", text: "Built on assumptions: overlap, personas, affinity." },
        ].map(({ kind, text }) => (
          <div key={kind} className="panel flex items-start gap-3 px-4 py-3">
            <DataBadge kind={kind} />
            <p className="text-xs text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>

      <Panel eyebrow="Data" title="Sources and refresh cadence" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">What it gives</th>
                <th className="px-5 py-3">Cadence</th>
                <th className="px-5 py-3">Feeds</th>
                <th className="px-5 py-3">Refreshed</th>
              </tr>
            </thead>
            <tbody>
              {data.sources.map((s) => (
                <tr key={s.key} className="border-b border-border/60">
                  <td className="px-5 py-3">
                    <span className="font-medium">{s.name}</span>
                    <DataBadge kind={s.badge} className="ml-2" />
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{s.what_it_gives}</td>
                  <td className="px-5 py-3 text-xs">{s.cadence}</td>
                  <td className="px-5 py-3 text-xs">{s.feeds}</td>
                  <td className="tabular px-5 py-3 text-xs text-muted-foreground">
                    {new Date(s.refreshed_on).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        className="mt-4"
        eyebrow="Ledger"
        title="Every assumption, and exactly how we got to it"
        soWhat="If you disagree with a number, this is the row to argue with. Each one names its source, its working and how much we trust it."
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Assumption</th>
                <th className="px-5 py-3">Value</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">How we got there</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Replaced when</th>
              </tr>
            </thead>
            <tbody>
              {data.provenance.map((p) => (
                <tr key={p.key} className="border-b border-border/60 align-top">
                  <td className="px-5 py-3 text-xs font-medium">{p.label}</td>
                  <td className="tabular px-5 py-3 text-xs text-primary">{p.value_text}</td>
                  <td className="max-w-[180px] px-5 py-3 text-xs text-muted-foreground">
                    {p.source}
                  </td>
                  <td className="max-w-[300px] px-5 py-3 text-xs text-muted-foreground">
                    {p.derivation}
                  </td>
                  <td className="px-5 py-3 text-[11px] uppercase tracking-wider">{p.confidence}</td>
                  <td className="max-w-[200px] px-5 py-3 text-xs text-muted-foreground">
                    {p.replaces_with}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        className="mt-4"
        eyebrow="Working"
        title="How Acme penetration was calculated, bank by bank"
        soWhat="It is back-solved, not measured: share of Acme members by issuer, applied to Acme's active base, divided by the bank's active cardholders. The shipped figures are examples."
        right={
          <DataBadge
            kind="modeled"
            source="Example member split applied to RBI card counts and Acme's active base"
          />
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Bank</th>
                <th className="px-5 py-3 text-right">Cards</th>
                <th className="px-5 py-3 text-right">Active cards</th>
                <th className="px-5 py-3 text-right">Share of Acme members</th>
                <th className="px-5 py-3 text-right">Penetration</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Method note</th>
              </tr>
            </thead>
            <tbody>
              {data.penetration.map((p) => {
                const issuerRow = data.issuers.find((i) => i.slug === p.issuer_slug);
                const cards = Number(
                  data.issuerMonthly
                    .filter((m) => m.issuer_slug === p.issuer_slug)
                    .sort((a, b) => (a.month < b.month ? 1 : -1))[0]?.cards_m ?? 0,
                );
                return (
                  <tr key={p.issuer_slug} className="border-b border-border/60 align-top">
                    <td className="px-5 py-3 text-xs font-medium">
                      {issuerRow?.name ?? p.issuer_slug}
                    </td>
                    <td className="tabular px-5 py-3 text-right text-xs">{cards.toFixed(2)}M</td>
                    <td className="tabular px-5 py-3 text-right text-xs">
                      {((cards * Number(p.active_share_pct)) / 100).toFixed(2)}M
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        ({Number(p.active_share_pct).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="tabular px-5 py-3 text-right text-xs">
                      {Number(p.survey_brand_share_pct).toFixed(1)}%
                    </td>
                    <td className="tabular px-5 py-3 text-right text-xs text-modeled">
                      {Number(p.brand_penetration_pct).toFixed(0)}%
                    </td>
                    <td className="px-5 py-3 text-[11px] uppercase tracking-wider">
                      {p.confidence}
                    </td>
                    <td className="max-w-[260px] px-5 py-3 text-xs text-muted-foreground">
                      {p.method_note}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel eyebrow="Dials" title="Assumptions and their current values">
          <ul className="space-y-3">
            {list.map((a) => (
              <li key={a.key} className="rounded-lg border border-border bg-surface-2/50 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{a.label}</span>
                  <span className="tabular text-sm text-primary">
                    {get(a.key)}
                    {a.unit === "%" ? "%" : ` ${a.unit}`}
                    {get(a.key) !== a.default_value ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-modeled">
                        changed from {a.default_value}
                      </span>
                    ) : null}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.note}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel eyebrow="Changelog" title="What changed and when">
            <ul className="space-y-3">
              {data.changelog.map((c) => (
                <li key={c.id} className="border-l-2 border-primary/40 pl-3">
                  <p className="tabular text-[11px] text-muted-foreground">
                    {new Date(c.entry_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.detail}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel eyebrow="Honesty" title="Risks worth saying out loud">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="text-foreground">Cards are not customers. </span>
                RBI counts cards per bank, not people. Unique holders are modeled from the
                cards-per-holder average.
              </li>
              <li>
                <span className="text-foreground">The overlap is the weakest number. </span>
                Until you upload cohort totals by issuer, the Venn and the heatmap are example
                estimates. Treat them as directional.
              </li>
              <li>
                <span className="text-foreground">Survey bias. </span>A small pilot is a signal,
                not a sample. Screens 3 to 5 need a large survey with quotas by city tier and
                issuer.
              </li>
              <li>
                <span className="text-foreground">Acme figures are examples. </span>
                Acme is a fictional company; replace its funnel and cohort figures with your own on
                the Upload screen.
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function CompanyView() {
  return <SourcesPage />;
}
