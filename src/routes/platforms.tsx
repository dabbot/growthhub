import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import { useSelection } from "@/lib/selection";
import { fmtM, fmtPct } from "@/lib/format";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { issuerTable } from "@/lib/model";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/platforms")({
  head: () => ({
    meta: [
      { title: "Where They Live — Growth Dashboard" },
      {
        name: "description",
        content:
          "Persona by platform affinity, audience sizes and co-brand partner routes for reaching India's cardholders.",
      },
      { property: "og:title", content: "Where They Live — Growth Dashboard" },
      {
        property: "og:description",
        content: "Which apps and places these cardholders use, so we can reach them there.",
      },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

const PARTNERS = [
  { card: "Amazon Pay ICICI", app: "Amazon", route: "Co-brand statement placements" },
  { card: "Flipkart Axis", app: "Flipkart", route: "Checkout and Big Billion Days" },
  { card: "Swiggy HDFC", app: "Swiggy", route: "Order-confirmation surface" },
  { card: "Myntra Kotak", app: "Myntra", route: "Loyalty tier messaging" },
  { card: "Tata Neu HDFC", app: "Tata Neu", route: "NeuCoins reward stacking" },
  { card: "IndiGo HDFC / Air India SBI", app: "Airline apps", route: "Travel spend triggers" },
];

const CITY_TIERS = [
  { tier: "Tier 1", spend_share: 62, penetration: 20 },
  { tier: "Tier 2", spend_share: 24, penetration: 8 },
  { tier: "Tier 3+", spend_share: 14, penetration: 3 },
];

function PlatformsPage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const { persona, setPersona, issuer } = useSelection();

  const platforms = Array.from(new Set(data.personaPlatforms.map((p) => p.platform)));
  const personas = persona ? data.personas.filter((p) => p.slug === persona) : data.personas;
  const issuerName = issuer ? data.issuers.find((i) => i.slug === issuer)?.name : null;
  const issuerRow = issuer ? issuerTable(data).find((r) => r.slug === issuer) : null;

  const cell = (personaSlug: string, platform: string) =>
    data.personaPlatforms.find((r) => r.persona_slug === personaSlug && r.platform === platform);


  return (
    <div>
      <PageHeader
        step="7 · Where They Live"
        title="Which apps and places do these cardholders use?"
        question="Each number is a multiple of the average Indian smartphone user. Click a persona row to hold it across the other screens."
      />

      {issuerName && issuerRow ? (
        <p className="mb-4 inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
          {issuerName} selected · {issuerRow.cards_m.toFixed(1)}M cards ·{" "}
          {fmtPct(issuerRow.penetration_pct, 0)} on Acme
        </p>
      ) : null}

      <Panel
        eyebrow="How much more likely"
        title="How likely each group is to use each app"
        soWhat="Reach is not one media plan: the PSU carder lives on YouTube and Flipkart, the multi-carder on LinkedIn and travel apps."
        right={
          <DataBadge
            kind="modeled"
            source="Example audience indices"
          />
        }
        bodyClassName="p-0"
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border px-5 py-3 text-[11px] text-muted-foreground">
          <span>
            <span className="text-foreground">Read each cell as a multiple. </span>
            &ldquo;2.1x&rdquo; means this group is 2.1 times as likely to use that app as the average
            Indian smartphone user. 1.0x is average.
          </span>
          <span className="flex items-center gap-2">
            {[
              ["Below average", "< 1.0x"],
              ["Average", "1.0x"],
              ["Strong", "1.5x+"],
              ["Where they live", "2.0x+"],
            ].map(([label, range], i) => (
              <span key={label} className="flex items-center gap-1.5">
                <span
                  className="size-3 rounded"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(--color-primary) ${i * 18}%, var(--color-surface-2))`,
                  }}
                />
                {label} <span className="tabular opacity-70">{range}</span>
              </span>
            ))}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Persona</th>
                {platforms.map((p) => (
                  <th key={p} className="px-2 py-3 text-center font-normal">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {personas.map((p) => (
                <tr
                  key={p.slug}
                  onClick={() => setPersona(p.slug)}
                  className={cn(
                    "cursor-pointer border-b border-border/60 hover:bg-surface-2",
                    persona === p.slug && "bg-primary/5",
                  )}
                >
                  <td className="px-5 py-2 text-xs font-medium">{p.name}</td>
                  {platforms.map((pl) => {
                    const c = cell(p.slug, pl);
                    const score = Number(c?.index_score ?? 0);
                    const multiple = score / 100;
                    const intensity = Math.min(Math.max((score - 60) / 1.7, 0), 100) * 0.55;
                    return (
                      <td key={pl} className="px-1 py-1.5 text-center">
                        <span
                          title={`${p.name} is ${multiple.toFixed(1)} times as likely as the average smartphone user to be on ${pl}${
                            c?.audience_size_m
                              ? ` · ${fmtM(Number(c.audience_size_m), 1)} reachable there`
                              : ""
                          }`}
                          style={{
                            backgroundColor: `color-mix(in oklab, var(--color-primary) ${intensity}%, var(--color-surface-2))`,
                          }}
                          className="tabular block rounded-md px-2 py-2 text-[11px]"
                        >
                          {multiple.toFixed(1)}x
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          eyebrow="Audience sizing"
          title={persona ? "Reachable audience for this persona" : "Reachable audience, all personas"}
          soWhat="These are ad-planner audience sizes, not the persona's full size — they cap what media alone can deliver."
          right={<DataBadge kind="modeled" source="Meta and Google ad planners, Jul 2026" />}
        >
          <div className="space-y-2">
            {platforms
              .map((pl) => ({
                platform: pl,
                size: personas.reduce(
                  (s, p) => s + Number(cell(p.slug, pl)?.audience_size_m ?? 0),
                  0,
                ),
              }))
              .sort((a, b) => b.size - a.size)
              .map((row, _i, arr) => (
                <div key={row.platform}>
                  <div className="flex justify-between text-xs">
                    <span>{row.platform}</span>
                    <span className="tabular text-muted-foreground">{fmtM(row.size, 1)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${(row.size / (arr[0]?.size || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel
            eyebrow="Partner map"
            title="Co-brand card ↔ partner app"
            soWhat="Every co-brand card is a warm distribution route into a persona that already opts into rewards."
          >
            <ul className="space-y-2 text-sm">
              {PARTNERS.map((p) => (
                <li
                  key={p.card}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/50 px-3 py-2"
                >
                  <span className="text-xs font-medium">{p.card}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {p.app} · {p.route}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            eyebrow="City tier"
            title="Spend concentration vs Acme penetration"
            soWhat="Tier 2 carries a quarter of card spend and a tenth of Acme's presence, and it is where SBI Card and Bank of Baroda are adding cards fastest. Metro acquisition is a bidding war against every fintech; Tier 2 is not yet."
            right={<DataBadge kind="modeled" source="RBI spend split; Acme penetration is an example" />}
          >
            <div className="space-y-3">
              {CITY_TIERS.map((t) => (
                <div key={t.tier}>
                  <div className="flex justify-between text-xs">
                    <span>{t.tier}</span>
                    <span className="tabular text-muted-foreground">
                      {t.spend_share}% of spend · {t.penetration}% on Acme
                    </span>
                  </div>
                  <div className="mt-1 flex gap-1">
                    <div className="h-2 flex-1 rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-chart-4"
                        style={{ width: `${t.spend_share}%` }}
                      />
                    </div>
                    <div className="h-2 flex-1 rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${t.penetration}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function CompanyView() {
  return <PlatformsPage />;
}
