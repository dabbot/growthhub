import { BRAND } from "@/lib/brand";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { COMPETITORS, TAKEAWAYS, type Competitor } from "@/lib/competitors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/competitors")({
  head: () => ({
    meta: [
      { title: "Competitors — GrowthHub" },
      {
        name: "description",
        content:
          "Acme against bank apps, payment super-apps and a challenger on installs, monthly actives, entry gate and share of card bill payments.",
      },
      { property: "og:title", content: "Competitors — GrowthHub" },
      {
        property: "og:description",
        content: "Who else is competing for the cardholder, and where the switchable users sit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

const METRICS = [
  { key: "installs_m", label: "Installs", unit: "M" },
  { key: "mau_m", label: "Monthly actives", unit: "M" },
  { key: "share_pct", label: "Share of card bill payments", unit: "%" },
] as const;

const GATE_TONE: Record<Competitor["gateTone"], string> = {
  closed: "text-modeled",
  soft: "text-primary",
  open: "text-positive",
};

const THREAT_TONE: Record<Competitor["threat"], string> = {
  high: "border-modeled/40 bg-modeled/10 text-modeled",
  medium: "border-primary/40 bg-primary/10 text-primary",
  low: "border-positive/40 bg-positive/10 text-positive",
};

function CompetitorsPage() {
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>("mau_m");
  const active = METRICS.find((m) => m.key === metric)!;
  const rows = [...COMPETITORS].sort((a, b) => b[metric] - a[metric]);
  const max = Math.max(...rows.map((r) => r[metric]));

  return (
    <div>
      <PageHeader
        step="6 · Competitors"
        title="Who else is competing for the same cardholder?"
        question="Acme against the bank apps, the payment giants and the challengers — on how many people they reach, how many come back, who they let in, and how much of the card bill they already handle."
      />

      <div className="grid gap-5">
        <Panel
          eyebrow="Head to head"
          title={`Ranked by ${active.label.toLowerCase()}`}
          soWhat="Reach is not the contest. Acme is last-but-one on installs and still handles almost a fifth of all card bills paid in an app, because its members come back every month. The apps above it on reach are not trying to own the bill."
          right={
            <div className="flex flex-wrap gap-1">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMetric(m.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    metric === m.key
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="space-y-3">
            {rows.map((c) => (
              <div key={c.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className={cn("text-sm", c.key === BRAND.key && "font-semibold text-primary")}>
                    {c.name}
                    <span className="ml-2 text-xs text-muted-foreground">{c.owner}</span>
                  </p>
                  <p className="tabular text-sm font-medium">
                    {c[metric]}
                    {active.unit}
                  </p>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      c.key === BRAND.key ? "bg-primary" : "bg-muted-foreground/50",
                    )}
                    style={{ width: `${Math.max(2, (c[metric] / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="The full table"
          title="Installs, actives, who gets in, and the share of the bill"
          soWhat="The only two apps with a real share of card bills are the issuer's own app and Acme. Everyone else treats the bill as a utility tab."
          right={
            <DataBadge
              kind="modeled"
              source="Example figures for fictional apps."
            />
          }
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["App", "Positioning", "Installs", "Actives", "Who gets in", "Bill share", "Rating", "Threat"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((c) => (
                  <tr
                    key={c.key}
                    className={cn(
                      "border-b border-border/60 align-top last:border-0",
                      c.key === BRAND.key && "bg-primary/5",
                    )}
                  >
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.positioning}</td>
                    <td className="tabular px-4 py-3">{c.installs_m}M</td>
                    <td className="tabular px-4 py-3">{c.mau_m}M</td>
                    <td className={cn("px-4 py-3", GATE_TONE[c.gateTone])}>{c.gate}</td>
                    <td className="tabular px-4 py-3">{c.share_pct}%</td>
                    <td className="tabular px-4 py-3">{c.rating}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
                          THREAT_TONE[c.threat],
                        )}
                      >
                        {c.threat}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          eyebrow="Strengths and soft spots"
          title="What each one is good at, and where it leaks"
          soWhat="Every weakness in this column is a promise Acme could make to that app's users tomorrow."
          bodyClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {COMPETITORS.filter((c) => c.key !== BRAND.key).map((c) => (
            <div key={c.key} className="rounded-xl border border-border bg-surface-2/50 p-4">
              <p className="text-sm font-semibold">{c.name}</p>
              <p className="mt-2 text-sm text-positive">Strong: {c.strength}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">Weak: {c.weakness}</p>
            </div>
          ))}
        </Panel>

        <Panel
          eyebrow="What it means"
          title="Four reads a growth plan should start from"
          soWhat="Taken together: stop measuring Acme against reach, and start measuring it against the bank app's default."
          bodyClassName="grid gap-3 md:grid-cols-2"
        >
          {TAKEAWAYS.map((t) => (
            <div key={t.title} className="rounded-xl border border-border bg-surface-2/50 p-4">
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function CompanyView() {
  return <CompetitorsPage />;
}
