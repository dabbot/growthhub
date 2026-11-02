import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { RoadmapBoard } from "@/components/dashboard/RoadmapBoard";
import { AddedApps } from "@/components/dashboard/AddedApps";
import {
  FEATURE_BETS,
  FIX_LIST,
  REVIEW_THEMES,
  SEO_COMPETITORS,
  SEO_ROWS,
  SEO_SNAPSHOT,
  STORE_APPS,
} from "@/lib/aso-seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aso")({
  head: () => ({
    meta: [
      { title: "ASO & SEO Audit — Growth Dashboard" },
      {
        name: "description",
        content:
          "How Acme's app listing and website search presence stack up, what rival app users complain about, and the features that would win them over.",
      },
      { property: "og:title", content: "ASO & SEO Audit — Growth Dashboard" },
      {
        property: "og:description",
        content: "Store reviews and search data turned into a switcher strategy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

const EFFORT_TONE: Record<string, string> = {
  Low: "text-positive",
  Medium: "text-primary",
  High: "text-modeled",
};

function AsoPage() {
  const [app, setApp] = useState<string>("Acme");
  const [area, setArea] = useState<"all" | "ASO" | "SEO">("all");

  const themes = REVIEW_THEMES.filter((t) => t.app === app);
  const fixes = FIX_LIST.filter((f) => area === "all" || f.area === area);

  const vol = (s: string) => {
    const n = parseFloat(s.replace(/[^0-9.]/g, ""));
    return s.includes("k") ? n : n / 1000;
  };
  const seoBars = [...SEO_ROWS].sort((a, b) => vol(b.volume) - vol(a.volume));
  const careRow = SEO_ROWS.find((r) => r.keyword.includes("customer care"));



  return (
    <div>
      <PageHeader
        step="9 · ASO & SEO Audit"
        title="What the stores and search results already tell us"
        question="Acme's listing and website, judged next to an issuer app and a challenger — and the features their unhappy users are asking for out loud."
      />

      <div className="grid gap-5">
        <Panel
          title="The three listings, side by side"
          eyebrow="App store scorecard"
          soWhat="Payly has a million installs and a 2.6 rating. That is the clearest pool of switchable card-payers in the market — people who already pay bills in an app and already dislike the one they use."
          right={<DataBadge kind="modeled" source="Example store listings for fictional apps" />}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {STORE_APPS.map((a) => (
              <div key={a.key} className="rounded-xl border border-border bg-surface-2/50 p-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-base font-semibold">{a.name}</p>
                  <p
                    className={cn(
                      "font-display text-2xl font-semibold tabular-nums",
                      Number(a.rating) >= 4.5
                        ? "text-positive"
                        : Number(a.rating) >= 4
                          ? "text-primary"
                          : "text-modeled",
                    )}
                  >
                    {a.rating}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.owner}</p>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Reviews</dt>
                    <dd className="tabular-nums">{a.reviews}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Downloads</dt>
                    <dd className="tabular-nums">{a.downloads}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Entry</dt>
                    <dd className="text-right">{a.gate}</dd>
                  </div>
                </dl>
                <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                  {a.verdict}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <AddedApps />

        <Panel
          title="What people actually write in the reviews"
          eyebrow="Review teardown"
          soWhat="Acme's 4.6 hides two apps: paying a bill scores about 4.6, anything touching rewards about 2.5. Every rival's weakness is a promise Acme could make instead."
          right={
            <div className="flex gap-1">
              {["Acme", "Northstar Card", "Payly"].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setApp(a)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    app === a
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          }
        >
          <div className="grid gap-3">
            {themes.map((t) => (
              <div key={t.theme} className="rounded-xl border border-border bg-surface-2/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{t.theme}</p>
                  <p className="text-xs text-primary">{t.weight}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t.quoteGist}</p>
                <div className="mt-3">
                  <DataBadge kind={t.badge} source={t.source} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Acme in search"
          eyebrow="Website SEO"
          soWhat="The site looks healthy because the brand is strong. Strip out the brand and the customer-care queries and there is one real asset — page-one visibility on credit-score intent — and almost nothing else."
          right={<DataBadge kind="modeled" source={SEO_SNAPSHOT.source} />}
        >
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { l: "Keywords ranking", v: SEO_SNAPSHOT.keywords },
              { l: "Organic traffic", v: SEO_SNAPSHOT.traffic },
              { l: "Traffic worth", v: SEO_SNAPSHOT.value },
              { l: "Paid search", v: SEO_SNAPSHOT.paid },
            ].map((k) => (
              <div key={k.l} className="rounded-xl border border-border bg-surface-2/50 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {k.l}
                </p>
                <p className="mt-1 text-sm font-semibold">{k.v}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Search term</th>
                  <th className="pb-2 pr-3 font-medium">Rank</th>
                  <th className="pb-2 pr-3 font-medium">Searches</th>
                  <th className="pb-2 font-medium">Read</th>
                </tr>
              </thead>
              <tbody>
                {SEO_ROWS.map((r) => (
                  <tr key={r.keyword} className="border-b border-border/60 align-top">
                    <td className="py-3 pr-3 font-medium">{r.keyword}</td>
                    <td className="py-3 pr-3 tabular-nums text-primary">{r.position}</td>
                    <td className="py-3 pr-3 tabular-nums">{r.volume}</td>
                    <td className="py-3 text-muted-foreground">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SEO_COMPETITORS.map((c) => (
              <div key={c.name} className="rounded-xl border border-dashed border-border p-3">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-primary">{c.traffic}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Build these and their users have a reason to leave"
          eyebrow="Feature bets, straight from rivals' complaints"
          soWhat="Nothing here is invention. Each bet is the inverse of a complaint rival app users are already publishing."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {FEATURE_BETS.map((b) => (
              <div key={b.title} className="rounded-xl border border-border bg-surface-2/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-primary">{b.target}</p>
                  <p className={cn("text-xs font-semibold", EFFORT_TONE[b.effort])}>
                    {b.effort} effort
                  </p>
                </div>
                <p className="mt-2 font-display text-base font-semibold">{b.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                    Why
                  </span>
                  {b.insight}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                    Build
                  </span>
                  {b.build}
                </p>
                <p className="mt-3 border-t border-border pt-3 text-sm">{b.size}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="The roadmap"
          eyebrow="What to change, in what order, and how far along it is"
          soWhat="Five of these nine are a week's work each. Mark items as you ship them — the tracker at the top is shared, so everyone opening this screen sees the same state."
          right={
            <div className="flex gap-1">
              {(["all", "ASO", "SEO"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(a)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    area === a
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {a === "all" ? "Everything" : a === "ASO" ? "App listing" : "Website"}
                </button>
              ))}
            </div>
          }
        >
          <RoadmapBoard area={area} />
        </Panel>


        <Panel title="Where these numbers come from" eyebrow="Method">
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li>
              Everything on this screen is example data. Acme, Northstar Card and Payly are
              fictional apps, and the ratings, review themes and search figures are made up.
            </li>
            <li>
              To use it for a real product, replace the content in src/lib/aso-seo.ts with figures
              from the public store listings, a review analysis and your search tool of choice.
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function CompanyView() {
  return <AsoPage />;
}
