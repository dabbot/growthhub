import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import { useAssumptions } from "@/lib/assumptions";
import { headroom } from "@/lib/model";
import { fmtM } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "The Scrollytelling Cut — GrowthHub" },
      {
        name: "description",
        content:
          "Scroll through India's 58M credit cardholders one dot at a time and watch the real Acme headroom emerge.",
      },
      { property: "og:title", content: "The Scrollytelling Cut — GrowthHub" },
      {
        property: "og:description",
        content: "Every dot is 250,000 people. Watch them sort themselves into the prize.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

const DOT_M = 0.25;

type Band = "brand" | "prize" | "prizeApp" | "subprime" | "dormant";

const BAND_CLASS: Record<Band, string> = {
  brand: "bg-primary",
  prize: "bg-modeled",
  prizeApp: "bg-positive",
  subprime: "bg-derived",
  dormant: "bg-reported",
};

function StoryPage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const { get } = useAssumptions();
  const h = headroom(data, get);

  const gate = Number(data.funnel.find((f) => f.key === "gate")?.value_m ?? 25);
  const lapsedQualified = Math.max(gate - h.active, 0);
  /** Share of the addressable-but-not-on-Acme base that already installed the app once. */
  const appShare = h.addressable > 0 ? Math.min(lapsedQualified / h.addressable, 1) : 0;
  const prizeWithApp = h.headroom * appShare;

  const counts = useMemo(() => {
    const total = Math.round(h.cardholders / DOT_M);
    const brand = Math.round(h.active / DOT_M);
    const prize = Math.round(h.headroom / DOT_M);
    const subprime = Math.max(Math.round((h.activeCardholders - h.addressable) / DOT_M), 0);
    const dormant = Math.max(total - brand - prize - subprime, 0);
    const prizeApp = Math.min(Math.round(prizeWithApp / DOT_M), prize);
    return { total, brand, prize, prizeApp, subprime, dormant };
  }, [h, prizeWithApp]);

  const bands: Band[] = useMemo(() => {
    const out: Band[] = [];
    for (let i = 0; i < counts.brand; i += 1) out.push("brand");
    for (let i = 0; i < counts.prize; i += 1) out.push(i < counts.prizeApp ? "prizeApp" : "prize");
    for (let i = 0; i < counts.subprime; i += 1) out.push("subprime");
    for (let i = 0; i < counts.dormant; i += 1) out.push("dormant");
    return out;
  }, [counts]);

  const steps = useMemo(
    () => [
      {
        eyebrow: "Start here",
        headline: `${fmtM(h.cardholders)} Indians hold a credit card`,
        body: `${fmtM(h.cards)} cards are in force, but people carry about ${get("cards_per_holder")} each. Every dot below is 250,000 real people. Scroll, and watch them sort themselves.`,
        note: "one dot = 250k people",
      },
      {
        eyebrow: "First cut",
        headline: "Most of them are not really cardholders",
        body: `Only ${get("active_card_rate")}% have swiped in the last 90 days. The rest hold plastic they never use — you can spend a fortune shouting at them and nothing moves.`,
        note: "the quiet majority",
      },
      {
        eyebrow: "Second cut",
        headline: "Acme only wants the 750+ crowd",
        body: `${get("prime_share")}% of active cardholders clear the gate. That leaves ${fmtM(h.addressable)} people who are both awake and eligible — the only base worth costing a campaign against.`,
        note: "everyone else is noise",
      },
      {
        eyebrow: "Where we stand",
        headline: `Acme already has ${fmtM(h.active)} of them`,
        body: `That's ${h.brandShareOfAddressable.toFixed(0)}% of the addressable base already inside the app. The flattering version of this slide claims a ${fmtM(h.naiveHeadroom)} opportunity. It isn't one.`,
        note: "the bit we own",
      },
      {
        eyebrow: "The prize",
        headline: `${fmtM(h.headroom)} people, not ${fmtM(h.naiveHeadroom)}`,
        body: "Active, 750+, and not on Acme. This is the honest ceiling — smaller, but every single dot is a member you could actually win.",
        note: "this is the whole game",
      },
      {
        eyebrow: "And it isn't one blob",
        headline: `${fmtM(prizeWithApp)} of them already have the app`,
        body: `Many of the addressable base outside Acme installed it once, cleared the gate, and drifted. A push notification reaches them for free. The rest need paid media — which is exactly why the two shades below should never share a budget line.`,
        note: "free to reach vs paid to reach",
      },
    ],
    [h, get, prizeWithApp],
  );

  const [step, setStep] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset["step"]);
            if (!Number.isNaN(i)) setStep(i);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const el of refs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [steps.length]);

  function styleFor(band: Band) {
    const lit = (b: Band[]) => b.includes(band);
    if (step === 0) return "bg-foreground/70 scale-100";
    if (step === 1)
      return band === "dormant" ? "bg-foreground/10 scale-75" : "bg-foreground/70 scale-100";
    if (step === 2) {
      if (band === "dormant") return "bg-foreground/10 scale-75";
      if (band === "subprime") return "bg-foreground/15 scale-75";
      return "bg-foreground/80 scale-100";
    }
    if (step === 3) {
      if (lit(["brand"])) return `${BAND_CLASS.brand} scale-110`;
      if (lit(["prize", "prizeApp"])) return "bg-foreground/35 scale-100";
      return "bg-foreground/10 scale-75";
    }
    if (step === 4) {
      if (lit(["brand"])) return "bg-primary/35 scale-100";
      if (lit(["prize", "prizeApp"])) return `${BAND_CLASS.prize} scale-110`;
      return "bg-foreground/10 scale-75";
    }
    if (lit(["brand"])) return "bg-primary/25 scale-100";
    if (band === "prizeApp") return `${BAND_CLASS.prizeApp} scale-110`;
    if (band === "prize") return `${BAND_CLASS.prize} scale-110`;
    return "bg-foreground/10 scale-75";
  }

  const legend =
    step >= 5
      ? [
          { c: "bg-positive", l: "Prize — already has the app" },
          { c: "bg-modeled", l: "Prize — needs paid media" },
          { c: "bg-primary/25", l: "Already on Acme" },
        ]
      : step >= 4
        ? [
            { c: "bg-modeled", l: "The real headroom" },
            { c: "bg-primary/35", l: "Already on Acme" },
            { c: "bg-foreground/10", l: "Not targetable" },
          ]
        : step >= 3
          ? [
              { c: "bg-primary", l: "Already on Acme" },
              { c: "bg-foreground/35", l: "Addressable, not ours" },
              { c: "bg-foreground/10", l: "Not targetable" },
            ]
          : [
              { c: "bg-foreground/70", l: "Still in play" },
              { c: "bg-foreground/10", l: "Cut from the base" },
            ];

  return (
    <div>
      <PageHeader
        step="14 · The Scrollytelling Cut"
        title="58 million dots, one honest number"
        question="An experiment: the same headroom maths, told the way a visual essay would tell it. Scroll."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-6rem)]">
          <div className="panel flex h-full flex-col justify-center gap-5 p-6">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="font-display text-3xl font-semibold tabular-nums">
                {step === 0 && `${fmtM(h.cardholders)}`}
                {step === 1 && `${fmtM(h.activeCardholders)}`}
                {step === 2 && `${fmtM(h.addressable)}`}
                {step === 3 && `${fmtM(h.active)}`}
                {step >= 4 && `${fmtM(h.headroom)}`}
              </p>
              <p className="-rotate-1 text-sm italic text-muted-foreground">
                {steps[step]?.note}
              </p>
            </div>

            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(14px, 1fr))" }}
            >
              {bands.map((band, i) => (
                <span
                  key={i}
                  className={cn(
                    "aspect-square rounded-[2px] transition-all duration-500 ease-out",
                    styleFor(band),
                  )}
                  style={{ transitionDelay: `${(i % 40) * 6}ms` }}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {legend.map((l) => (
                <span key={l.l} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("size-2.5 rounded-[2px]", l.c)} />
                  {l.l}
                </span>
              ))}
            </div>

            <div className="flex gap-1.5">
              {steps.map((s, i) => (
                <span
                  key={s.headline}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= step ? "bg-primary" : "bg-border",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          {steps.map((s, i) => (
            <div
              key={s.headline}
              data-step={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="flex min-h-[70vh] flex-col justify-center py-10"
            >
              <div
                className={cn(
                  "panel p-6 transition-all duration-300",
                  i === step ? "opacity-100" : "opacity-45",
                )}
              >
                <p className="text-[10px] uppercase tracking-[0.22em] text-primary">{s.eyebrow}</p>
                <h2 className="mt-2 font-display text-xl font-semibold sm:text-2xl">
                  {s.headline}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}

          <div className="pb-16">
            <div className="panel border-dashed p-6">
              <p className="rotate-[-0.6deg] font-display text-lg font-semibold">
                That's the whole argument, in six scrolls.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing here is new data — it's the same dials, the same maths as The Addressable Market and The
                10M Opportunity. Change a dial in the side panel and every dot re-sorts itself.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyView() {
  return <StoryPage />;
}
