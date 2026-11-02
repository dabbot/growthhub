import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import { useAssumptions } from "@/lib/assumptions";
import { headroom, issuerTable, rankedPlays } from "@/lib/model";
import { fmtM, fmtPct, fmtSigned } from "@/lib/format";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataBadge } from "@/components/dashboard/DataBadge";
import {
  StoryCut,
  StoryBars,
  FullDataDivider,
  type StoryStep,
} from "@/components/story/StoryCut";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Growth Dashboard" },
      {
        name: "description",
        content:
          "Size the market, find the winnable audience, and turn it into campaigns you can run.",
      },
      { property: "og:title", content: "Growth Dashboard" },
      {
        property: "og:description",
        content:
          "Size the market, find the winnable audience, and turn it into campaigns you can run.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Growth Dashboard" },
      {
        name: "twitter:description",
        content:
          "Size the market, find the winnable audience, and turn it into campaigns you can run.",
      },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

function BoardPage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const { get } = useAssumptions();
  const h = headroom(data, get);
  const top = rankedPlays(data, get).slice(0, 3);
  const issuers = issuerTable(data);
  const brandFunnel = data.funnel.filter((f) => f.tone === "brand");
  const maxFunnel = Math.max(...brandFunnel.map((f) => Number(f.value_m)), 1);

  const tiles = [
    {
      label: "Cards in force",
      value: fmtM(h.cards, 1),
      badge: "reported",
      source: "RBI bank-wise card statistics, Jun 2026",
      keys: [] as string[],
      sub: "Cards, not people",
    },
    {
      label: "Monthly card spend",
      value: "₹2.08 trn",
      badge: "reported",
      source: "RBI, Jul 2026",
      keys: [],
      sub: "All issuers, July 2026",
    },
    {
      label: "Acme share of the base we can win",
      value: fmtPct(h.brandShareOfAddressable, 1),
      badge: "derived",
      source: "Active members ÷ active cardholders scoring 750+",
      keys: ["cards_per_holder", "active_card_rate", "prime_share"],
      sub: `${fmtM(h.active, 0)} active of ${fmtM(h.addressable, 1)} addressable`,
    },
    {
      label: "Real headroom",
      value: fmtM(h.headroom, 1),
      badge: "modeled",
      source: "Addressable base minus active members",
      keys: ["cards_per_holder", "active_card_rate", "prime_share"],
      sub: "Active, 750+ cardholders not yet on Acme",
    },
  ];

  const chain = [
    { label: "Cards in force", value: h.cards, badge: "reported", note: "RBI counts cards, not people" },
    {
      label: "Unique cardholders",
      value: h.cardholders,
      badge: "derived",
      note: `÷ ${get("cards_per_holder")} cards per holder`,
    },
    {
      label: "Actually use the card",
      value: h.activeCardholders,
      badge: "modeled",
      note: `× ${get("active_card_rate")}% active in the last 90 days`,
    },
    {
      label: "Addressable: active and 750+",
      value: h.addressable,
      badge: "modeled",
      note: `× ${get("prime_share")}% scoring 750 or above`,
    },
    {
      label: "Already active on Acme",
      value: h.active,
      badge: "modeled",
      note: "Acme's own monthly active base",
    },
  ];

  const storySteps: StoryStep[] = [
    {
      eyebrow: "Start here",
      headline: `${fmtM(h.cards, 1)} credit cards are in force in India`,
      body: "That is the number every deck opens with. It counts pieces of plastic, not people, and it is the last honest figure before the cuts begin.",
      metric: fmtM(h.cards, 1),
      note: "cards, not people",
    },
    {
      eyebrow: "First cut",
      headline: `They belong to ${fmtM(h.cardholders, 1)} people`,
      body: `The average holder carries about ${get("cards_per_holder")} cards, so the market is a third smaller than the card count suggests before anything else is even considered.`,
      metric: fmtM(h.cardholders, 1),
      note: `÷ ${get("cards_per_holder")} cards each`,
    },
    {
      eyebrow: "Second cut",
      headline: `Only ${fmtM(h.activeCardholders, 1)} of them actually use the card`,
      body: `${get("active_card_rate")}% have swiped in the last 90 days. The rest hold plastic they never touch — no campaign moves them.`,
      metric: fmtM(h.activeCardholders, 1),
      note: "awake, not asleep",
    },
    {
      eyebrow: "Third cut",
      headline: `${fmtM(h.addressable, 1)} are both awake and 750+`,
      body: `Acme only admits scores of 750 and above. That gate takes the base down to the only pool worth costing a campaign against.`,
      metric: fmtM(h.addressable, 1),
      note: "the gate does the rest",
    },
    {
      eyebrow: "Where we stand",
      headline: `Acme already holds ${fmtM(h.active, 0)} of them`,
      body: `${fmtPct(h.brandShareOfAddressable, 0)} of the addressable base is already inside the app — a far higher share than the market-wide figure flatters us with.`,
      metric: fmtM(h.active, 0),
      note: `${fmtPct(h.brandShareOfAddressable, 0)} of the base we can win`,
    },
    {
      eyebrow: "The prize",
      headline: `${fmtM(h.headroom, 1)} people, not ${fmtM(h.naiveHeadroom, 0)}`,
      body: "Active, 750+ and not on Acme. Smaller than the headline, and every one of them is a member you could realistically win. The full working, every tile and the month's movements are below.",
      metric: fmtM(h.headroom, 1),
      note: "the honest ceiling",
    },
  ];

  const storyBars = (step: number) =>
    chain.map((c, i) => ({
      key: c.label,
      label: c.label,
      value: c.value,
      display: fmtM(c.value, 1),
      caption: c.note,
      tone: i === 4 ? "bg-primary" : i === 3 ? "bg-modeled" : "bg-primary",
      lit: i <= step,
      dim: i > step,
    }));

  return (
    <div>
      <PageHeader
        step="1 · The Addressable Market"
        title="How big is the market, and where does Acme stand?"
        question="The headroom maths, from the whole card base down to the members Acme can actually win."
        right={
          <Link
            to="/upload"
            className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20"
          >
            Upload actual data →
          </Link>
        }
      />

      <p className="mb-6 rounded-md border border-modeled/30 bg-modeled/10 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="font-medium text-modeled">Acme&rsquo;s own figures are estimates. </span>
        Installs, the score gate, monthly actives and penetration by bank are modelled until Acme
        reporting is loaded in.{" "}
        <Link to="/upload" className="text-primary hover:underline">
          Upload actual data
        </Link>{" "}
        and every number on this screen recalculates.
      </p>


      <StoryCut
        steps={storySteps}
        visual={(step) => <StoryBars bars={storyBars(step)} max={h.cards} />}
        legend={(step) => [
          { c: "bg-primary", l: "Still in play" },
          ...(step >= 3 ? [{ c: "bg-modeled", l: "The addressable base" }] : []),
          { c: "bg-surface-2", l: "Cut from the base" },
        ]}
      />

      <div className="my-10 h-px bg-border" />

      <div className="grid gap-4 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          eyebrow="Acme's own funnel"
          title="Of the people who did come to Acme, where do they drop?"
          soWhat="The story above sizes the market; this one shows Acme's own leak — from everyone who installed to the members still active."
        >
          <div className="space-y-3">
            {brandFunnel.map((f) => {
              const pct = (Number(f.value_m) / maxFunnel) * 100;
              return (
                <div key={f.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      {f.label}
                      <DataBadge
                        kind={f.badge}
                        source={f.sublabel ?? undefined}
                        assumptionKeys={f.tone === "brand" ? ["prime_share"] : []}
                      />
                    </span>
                    <span className="tabular font-semibold">{fmtM(Number(f.value_m), 1)}</span>
                  </div>
                  <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={
                        f.tone === "brand"
                          ? "h-full rounded-full bg-primary/40"
                          : "h-full rounded-full bg-primary"
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{f.sublabel}</p>
                </div>
              );
            })}
            {(() => {
              const v = (k: string) => Number(brandFunnel.find((f) => f.key === k)?.value_m ?? 0);
              const lapsedQualified = v("gate") - v("active");
              const rejected = v("installed") - v("gate");
              const rejectedNowQualify = rejected * 0.2;
              return (
                <div className="rounded-lg border border-modeled/30 bg-modeled/10 px-4 py-3 text-sm">
                  <span className="font-semibold text-modeled">Win-back first. </span>
                  <span className="tabular">{fmtM(lapsedQualified, 0)}</span> people cleared the 750
                  gate and are no longer active — they can come back today.
                  <p className="mt-2 text-xs text-muted-foreground">
                    The other {fmtM(rejected, 0)} never cleared the gate, so most of them still
                    cannot. Assuming one in five has since improved their score, that adds about{" "}
                    <span className="tabular text-modeled">{fmtM(rejectedNowQualify, 1)}</span> —
                    roughly <span className="tabular">{fmtM(lapsedQualified + rejectedNowQualify, 0)}</span>{" "}
                    winnable, not {fmtM(v("installed") - v("active"), 0)}.
                  </p>
                </div>
              );
            })()}
          </div>
        </Panel>

        <Panel
          className="xl:col-span-2"
          eyebrow="From the playbook"
          title="Top 3 opportunities right now"
          soWhat="Where the next million actives realistically come from: lapsed members who already cleared the 750 gate, SBI Card's fast-growing base where Acme reaches only 8%, and Tier 2 spenders. These re-rank as you move the dials."
        >
          <ol className="space-y-3">
            {top.map(({ play, actives, conversion }, i) => (
              <li key={play.slug} className="rounded-lg border border-border bg-surface-2/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-primary">
                      #{i + 1} · {play.segment}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{play.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular font-display text-lg font-semibold text-primary">
                      {fmtM(actives, 2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">expected actives</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{play.lever}</p>
                <p className="tabular mt-2 text-[11px] text-muted-foreground">
                  {fmtM(Number(play.reach_m), 1)} reach × {fmtPct(conversion, 1)} conversion ·{" "}
                  {play.owner}
                </p>
              </li>
            ))}
          </ol>
          <Link
            to="/playbook"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Open the full playbook <ArrowUpRight className="size-3" />
          </Link>
        </Panel>
      </div>

      <Panel
        className="mt-4"
        eyebrow="What changed this month"
        title="July 2026 refresh"
        soWhat="The market moved, Acme's funnel did not. SBI Card spend is up 21.6% year on year while ICICI is down 5.9% — the growth is shifting to an issuer where Acme sits at 8% penetration against 22% at HDFC."
        bodyClassName="grid gap-4 sm:grid-cols-3"
      >
        {issuers.slice(0, 3).map((i) => (
          <div key={i.slug} className="rounded-lg border border-border bg-surface-2/50 p-4">
            <p className="text-sm font-semibold">{i.name}</p>
            <p className="tabular mt-2 text-2xl font-semibold">
              +{i.net_adds_12m_m.toFixed(2)}M
              <span className="ml-2 text-xs font-normal text-muted-foreground">cards, 12 mo</span>
            </p>
            <p
              className={
                i.yoy_spend_pct >= 0
                  ? "tabular mt-1 text-xs text-positive"
                  : "tabular mt-1 text-xs text-negative"
              }
            >
              {fmtSigned(i.yoy_spend_pct)} spend YoY · Acme penetration{" "}
              {fmtPct(i.penetration_pct, 0)}
            </p>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function CompanyView() {
  return <BoardPage />;
}
