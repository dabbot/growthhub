import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing Audit — GrowthHub" },
      {
        name: "description",
        content:
          "A craft audit of Acme's live Meta and Google advertising, plus a channel-by-channel plan of what to fix.",
      },
      { property: "og:title", content: "Marketing Audit — GrowthHub" },
      {
        property: "og:description",
        content: "What Acme is running right now, what is wrong with it, and what to change.",
      },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

const SCORES = [
  ["offer_clarity", "Offer clarity"],
  ["persona_fit", "Persona fit"],
  ["proof", "Proof"],
  ["cta", "Call to action"],
  ["landing_match", "Landing match"],
] as const;

const PRIORITY_TONE: Record<string, string> = {
  now: "border-primary/50 bg-primary/10 text-primary",
  next: "border-derived/40 bg-derived/10 text-derived",
  later: "border-border bg-surface-2 text-muted-foreground",
};

function MarketingPage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const [platform, setPlatform] = useState<"All" | "Meta" | "Google">("All");

  const ads = data.ads.filter((a) => platform === "All" || a.platform === platform);
  const avg = (a: (typeof data.ads)[number]) =>
    SCORES.reduce((s, [k]) => s + Number(a[k] ?? 0), 0) / SCORES.length;
  const weakest = [...data.ads].sort((a, b) => avg(a) - avg(b))[0];

  const scored = [...data.ads].sort((a, b) => avg(b) - avg(a));
  const best = scored[0];
  const dims = SCORES.map(([k, label]) => ({
    key: k,
    label,
    value:
      data.ads.reduce((s, a) => s + Number(a[k] ?? 0), 0) / (data.ads.length || 1),
  })).sort((a, b) => b.value - a.value);
  const weakestDim = dims[dims.length - 1];
  const nowItems = data.marketingPlan.filter((m) => m.priority === "now");


  return (
    <div>
      <PageHeader
        step="8 · Marketing Audit"
        title="What is Acme running right now, and is it any good?"
        question="The campaigns below are examples for the fictional Acme. Swap in ads from Meta's and Google's public ad libraries to score your own. We score the craft, not the results."
      />


      <div className="mb-4 rounded-lg border border-modeled/30 bg-modeled/10 px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-modeled">Read this first. </span>
        We do not have Acme&rsquo;s ad accounts, so there is no spend, reach, click or conversion
        data here and none of it can be inferred. What follows is a craft critique of publicly
        visible creative: the offer, who it speaks to, the proof it carries, the ask, and whether
        the landing page keeps the promise. Treat every verdict as an informed opinion, not a
        measurement.
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Campaigns visible" value={data.ads.length.toString()} sub="Across Meta and Google ad libraries" />
        <Stat
          label="Average craft score"
          value={`${(data.ads.reduce((s, a) => s + avg(a), 0) / (data.ads.length || 1)).toFixed(1)}/5`}
          sub="Mean of five craft dimensions"
        />
        <Stat
          label="Weakest campaign"
          value={weakest ? `${avg(weakest).toFixed(1)}/5` : "—"}
          sub={weakest?.campaign_name ?? ""}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["All", "Meta", "Google"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              platform === p
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <Panel
        eyebrow="Live creative"
        title="Campaign-by-campaign audit"
        soWhat="The pattern across the book: strong distinctiveness, weak specificity. Most films earn attention and then ask for nothing in particular."
        right={
          <DataBadge
            kind="modeled"
            source="Creative observed in Meta Ad Library and Google Ads Transparency Center; scoring is editorial judgement"
          />
        }
        bodyClassName="space-y-3"
      >
        {ads.map((a) => (
          <article key={a.id} className="rounded-lg border border-border bg-surface-2/40 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border px-2 py-px text-[10px] uppercase tracking-wider text-muted-foreground">
                    {a.platform}
                  </span>
                  <h3 className="truncate text-sm font-semibold">{a.campaign_name}</h3>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {a.format} · aimed at {a.persona_target} · running since {a.running_since}
                </p>
              </div>
              <span className="tabular shrink-0 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                {avg(a).toFixed(1)}/5
              </span>
            </div>

            <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_260px]">
              <div className="min-w-0 space-y-2 text-xs">
                <p>
                  <span className="text-muted-foreground">Offer: </span>
                  {a.offer}
                </p>
                <p>
                  <span className="text-muted-foreground">Creative: </span>
                  {a.creative_note}
                </p>
                <p>
                  <span className="text-muted-foreground">Lands on: </span>
                  {a.landing_page}
                </p>
                <p className="rounded-md border border-border bg-background/40 px-3 py-2">
                  <span className="font-medium text-foreground">Verdict. </span>
                  {a.verdict}
                </p>
                <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2">
                  <span className="font-medium text-primary">Fix. </span>
                  {a.fix}
                </p>
              </div>

              <div className="space-y-1.5">
                {SCORES.map(([key, label]) => {
                  const v = Number(a[key] ?? 0);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-24 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {label}
                      </span>
                      <span className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span
                            key={n}
                            className={cn(
                              "size-2.5 rounded-sm",
                              n <= v ? "bg-primary" : "bg-surface-2",
                            )}
                          />
                        ))}
                      </span>
                      <span className="tabular text-[10px] text-muted-foreground">{v}/5</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </Panel>

      <Panel
        className="mt-4"
        eyebrow="The plan"
        title="What to change, channel by channel"
        soWhat="Seven actions, each tied to one audience and one measurable outcome. The 'now' items need no new product."
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3">Who it talks to</th>
                <th className="px-5 py-3">What it says</th>
                <th className="px-5 py-3">What to do</th>
                <th className="px-5 py-3">How we know it worked</th>
                <th className="px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {data.marketingPlan.map((m) => (
                <tr key={m.id} className="border-b border-border/60 align-top hover:bg-surface-2">
                  <td className="px-5 py-3 text-xs font-medium">{m.channel}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{m.audience}</td>
                  <td className="max-w-[240px] px-5 py-3 text-xs">{m.message}</td>
                  <td className="max-w-[260px] px-5 py-3 text-xs text-muted-foreground">
                    {m.action}
                  </td>
                  <td className="px-5 py-3 text-xs">{m.success_metric}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-px text-[10px] uppercase tracking-wider",
                        PRIORITY_TONE[m.priority] ?? PRIORITY_TONE["later"],
                      )}
                    >
                      {m.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="panel px-5 py-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="tabular mt-3 font-display text-3xl font-semibold">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function CompanyView() {
  return <MarketingPage />;
}
