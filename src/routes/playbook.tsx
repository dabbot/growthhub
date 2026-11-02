import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import { useAssumptions } from "@/lib/assumptions";
import { headroom, rankedPlays } from "@/lib/model";
import { fmtM, fmtPct } from "@/lib/format";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { cn } from "@/lib/utils";
import { InorganicPlaybook } from "@/components/dashboard/InorganicPlaybook";

export const Route = createFileRoute("/playbook")({
  head: () => ({
    meta: [
      { title: "Growth Playbook — GrowthHub" },
      {
        name: "description",
        content:
          "Named plays with reach, conversion and expected actives, plus an effort and impact matrix that ranks them.",
      },
      { property: "og:title", content: "Growth Playbook — GrowthHub" },
      {
        property: "og:description",
        content: "Turns the market map into a plan each team can own.",
      },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

function PlaybookPage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const { get } = useAssumptions();
  const ranked = rankedPlays(data, get);
  const h = headroom(data, get);
  const totalActives = ranked.reduce((s, r) => s + r.actives, 0);

  const first = ranked[0];
  const second = ranked[1];
  const quickWins = ranked.filter(
    (r) => Number(r.play.impact) >= 4 && Number(r.play.effort) <= 3,
  );
  const quickActives = quickWins.reduce((s, r) => s + r.actives, 0);



  return (
    <div>
      <PageHeader
        step="10 · Growth Playbook"
        title="What do we actually do, and what is it worth?"
        question="Expected actives recompute from the conversion assumptions. Move them and the ranking changes."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Plays on the board"
          value={ranked.length.toString()}
          sub="Across product, growth and marketing"
        />
        <Stat
          label="Expected actives if all run"
          value={fmtM(totalActives, 2)}
          sub={`${fmtPct((totalActives / h.headroom) * 100, 1)} of the headroom`}
          badge
        />
        <Stat
          label="Headroom remaining after"
          value={fmtM(Math.max(h.headroom - totalActives, 0), 1)}
          sub="Cardholders still untouched"
          badge
        />
      </div>

      <Panel
        eyebrow="Calculator"
        title="Play table"
        soWhat="Ranking is live, and it keeps favouring the same thing: winning back people Acme already acquired costs a fraction of chasing a bank-app user, because the bank's own app is where habit, not preference, holds them. The top three here are the three on screen 1."
        bodyClassName="p-0"
        right={
          <DataBadge
            kind="modeled"
            source="Reach from persona sizing, conversion from assumptions"
            assumptionKeys={[
              "reinvite_conversion",
              "winback_conversion",
              "acquisition_conversion",
            ]}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Play</th>
                <th className="px-5 py-3">Segment</th>
                <th className="px-5 py-3">Lever</th>
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3 text-right">Reach</th>
                <th className="px-5 py-3 text-right">Conversion</th>
                <th className="px-5 py-3 text-right">Expected actives</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ play, actives, conversion }, i) => (
                <tr key={play.slug} className="border-b border-border/60 hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <span className="tabular mr-2 text-[10px] text-primary">#{i + 1}</span>
                    <span className="font-medium">{play.name}</span>
                    <p className="mt-1 max-w-xs text-[11px] text-muted-foreground">
                      {play.rationale}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-xs">{play.segment}</td>
                  <td className="max-w-[220px] px-5 py-3 text-xs text-muted-foreground">
                    {play.lever}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{play.channel}</td>
                  <td className="px-5 py-3 text-xs">{play.owner}</td>
                  <td className="tabular px-5 py-3 text-right">{fmtM(Number(play.reach_m), 1)}</td>
                  <td className="tabular px-5 py-3 text-right">{fmtPct(conversion, 1)}</td>
                  <td className="tabular px-5 py-3 text-right font-semibold text-primary">
                    {fmtM(actives, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        className="mt-4"
        eyebrow="Sequencing"
        title="What to do first"
        soWhat="Sorted by expected actives per unit of effort. Do the top box this quarter and leave the bank-app switcher to product."
        bodyClassName="grid gap-4 lg:grid-cols-2"
      >
        {[
          {
            key: "now",
            title: "Do this quarter",
            note: "High impact, low effort — campaigns you can ship with what already exists.",
            tone: "border-primary/50 bg-primary/10",
            test: (p: (typeof ranked)[number]) =>
              Number(p.play.impact) >= 4 && Number(p.play.effort) <= 3,
          },
          {
            key: "next",
            title: "Line up for next quarter",
            note: "High impact but real build effort — start scoping now.",
            tone: "border-derived/40 bg-derived/5",
            test: (p: (typeof ranked)[number]) =>
              Number(p.play.impact) >= 4 && Number(p.play.effort) > 3,
          },
          {
            key: "fill",
            title: "Easy filler",
            note: "Cheap to run, modest return. Useful between bigger pushes.",
            tone: "border-border bg-surface-2/50",
            test: (p: (typeof ranked)[number]) =>
              Number(p.play.impact) < 4 && Number(p.play.effort) <= 3,
          },
          {
            key: "later",
            title: "Park it",
            note: "Expensive and unproven. Revisit once the survey lands.",
            tone: "border-border bg-surface-2/30",
            test: (p: (typeof ranked)[number]) =>
              Number(p.play.impact) < 4 && Number(p.play.effort) > 3,
          },
        ].map((box) => {
          const items = ranked.filter(box.test);
          return (
            <div key={box.key} className={cn("rounded-lg border p-4", box.tone)}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold">{box.title}</h3>
                <span className="tabular text-xs text-primary">
                  {fmtM(
                    items.reduce((s, r) => s + r.actives, 0),
                    2,
                  )}{" "}
                  actives
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{box.note}</p>
              <ol className="mt-3 space-y-2">
                {items.length === 0 ? (
                  <li className="text-xs text-muted-foreground">Nothing here right now.</li>
                ) : (
                  items.map(({ play, actives }) => (
                    <li
                      key={play.slug}
                      className="rounded-md border border-border/60 bg-background/40 px-3 py-2"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-xs font-medium">{play.name}</span>
                        <span className="tabular text-[11px] text-primary">
                          {fmtM(actives, 2)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {play.owner} · effort {play.effort}/5 · impact {play.impact}/5
                      </p>
                    </li>
                  ))
                )}
              </ol>
            </div>
          );
        })}
      </Panel>

      <InorganicPlaybook />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  badge,
}: {
  label: string;
  value: string;
  sub: string;
  badge?: boolean;
}) {
  return (
    <div className="panel px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {badge ? (
          <DataBadge
            kind="modeled"
            assumptionKeys={["reinvite_conversion", "winback_conversion", "acquisition_conversion"]}
          />
        ) : null}
      </div>
      <p className="tabular mt-3 font-display text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function CompanyView() {
  return <PlaybookPage />;
}
