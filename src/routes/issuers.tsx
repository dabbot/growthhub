import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import { issuerTable } from "@/lib/model";
import { useSelection } from "@/lib/selection";
import { fmtCr, fmtPct, fmtRupees, fmtSigned } from "@/lib/format";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/issuers")({
  head: () => ({
    meta: [
      { title: "Issuer Landscape — GrowthHub" },
      {
        name: "description",
        content:
          "Bank-by-bank view of India's credit card market: cards, spend per card, growth and Acme penetration.",
      },
      { property: "og:title", content: "Issuer Landscape — GrowthHub" },
      {
        property: "og:description",
        content: "Which banks' customers are the most valuable and the fastest growing.",
      },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

const CATEGORIES = ["All", "Private", "PSU", "Foreign", "Small Finance"] as const;

type Row = ReturnType<typeof issuerTable>[number];

function median(values: number[]) {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function IssuersPage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const [issuer, setIssuerState] = useState<string | null>(null);
  const setIssuer = (slug: string | null) => setIssuerState(slug);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [sort, setSort] = useState<"cards_m" | "spend_cr" | "spend_per_card" | "yoy_spend_pct">(
    "cards_m",
  );

  const rows = useMemo(() => {
    const all = issuerTable(data);
    return all
      .filter((r) => category === "All" || r.category === category)
      .sort((a, b) => b[sort] - a[sort]);
  }, [data, category, sort]);

  const trend = useMemo(() => {
    const months = Array.from(new Set(data.issuerMonthly.map((r) => r.month))).sort();
    const top = issuerTable(data).slice(0, 5);
    return months.map((m) => {
      const year = new Date(m).getFullYear();
      const point: Record<string, number | string> = { month: year.toString() };
      for (const t of top) {
        const row = data.issuerMonthly.find((r) => r.month === m && r.issuer_slug === t.slug);
        if (row) point[t.name] = Number(row.cards_m);
      }
      const brand = data.brandMonthly
        .filter((c) => new Date(c.month).getFullYear() === year)
        .sort((a, b) => (a.month < b.month ? 1 : -1))[0];
      if (brand) point["Acme monthly actives"] = Number(brand.mau_m);
      return point;
    });
  }, [data]);

  const topNames = issuerTable(data)
    .slice(0, 5)
    .map((r) => r.name);
  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];

  const tooltipStyle = {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--color-popover-foreground)",
  };
  const tooltipItemStyle = { color: "var(--color-popover-foreground)" };

  const midSpend = median(rows.map((r) => r.spend_per_card));
  const midGrowth = median(rows.map((r) => r.net_adds_12m_m));
  const quadrants = [
    {
      key: "premium-growing",
      title: "Premium and growing",
      meaning: "High spend per card, adding cards fast",
      action: "Win these members first — each one is worth the most and there are more of them every month.",
      tone: "border-primary/50 bg-primary/10",
      test: (r: Row) => r.spend_per_card >= midSpend && r.net_adds_12m_m >= midGrowth,
    },
    {
      key: "premium-flat",
      title: "Premium but flat",
      meaning: "High spend per card, barely adding cards",
      action: "A fixed, valuable pool. Go deeper per member rather than waiting for the base to grow.",
      tone: "border-derived/40 bg-derived/5",
      test: (r: Row) => r.spend_per_card >= midSpend && r.net_adds_12m_m < midGrowth,
    },
    {
      key: "volume-growing",
      title: "Volume and growing",
      meaning: "Lower spend per card, adding cards fast",
      action: "Cheap reach and the next wave of upgraders. Worth acquiring early, at a low cost per member.",
      tone: "border-border bg-surface-2/50",
      test: (r: Row) => r.spend_per_card < midSpend && r.net_adds_12m_m >= midGrowth,
    },
    {
      key: "volume-flat",
      title: "Volume and flat",
      meaning: "Lower spend per card, slow growth",
      action: "Lowest return per member. Cover with always-on channels, not paid pushes.",
      tone: "border-border bg-surface-2/30",
      test: (r: Row) => r.spend_per_card < midSpend && r.net_adds_12m_m < midGrowth,
    },
  ];

  const selected = rows.find((r) => r.slug === issuer) ?? null;



  return (
    <div>
      <PageHeader
        step="3 · Issuer Landscape"
        title="Which banks' customers are the most valuable and fastest growing?"
        question="Click any bank to open its full card, spend and Acme-overlap picture."
      />

      <Dialog open={selected !== null} onOpenChange={(o: boolean) => { if (!o) setIssuer(null); }}>
        <DialogContent className="max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selected.name}</DialogTitle>
                <DialogDescription>
                  {selected.category} · {fmtPct(selected.share_pct, 1)} of all cards in force ·
                  July 2026
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Cards in force", `${selected.cards_m.toFixed(2)}M`],
                  ["Monthly spend", fmtCr(selected.spend_cr)],
                  ["Spend per card / month", fmtRupees(selected.spend_per_card)],
                  ["Spend growth, year on year", fmtSigned(selected.yoy_spend_pct)],
                  ["Cards added in 12 months", `+${selected.net_adds_12m_m.toFixed(2)}M`],
                  ["Already on Acme", fmtPct(selected.penetration_pct, 0)],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-lg border border-border bg-surface-2/40 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</p>
                    <p className="tabular mt-0.5 text-lg font-semibold">{v}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Roughly{" "}
                <span className="font-semibold text-foreground">
                  {(selected.cards_m * (1 - selected.penetration_pct / 100)).toFixed(2)}M
                </span>{" "}
                of its cards are not on Acme today.{" "}
                {selected.spend_per_card >= midSpend
                  ? "Spend per card is above the median bank, so each member won here is worth more than average."
                  : "Spend per card is below the median bank, so win these cheaply or not at all."}{" "}
                {selected.net_adds_12m_m >= midGrowth
                  ? "It is also adding cards faster than most banks, so the pool keeps growing."
                  : "The card base is growing slowly, so treat this as a fixed pool."}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Card and spend figures are RBI bank-wise statistics. Acme penetration is an
                example estimate —{" "}
                {data.penetration.find((p) => p.issuer_slug === selected.slug)?.method_note ??
                  "see Sources & Method"}
              </p>
            </>
          ) : null}
        </DialogContent>
      </Dialog>


      <div className="mb-4 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              category === c
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <Panel
        eyebrow="July 2026"
        title="Bank table"
        soWhat="HDFC, SBI Card, ICICI and Axis hold roughly 70% of cards and over three-quarters of spend — but they are moving apart. SBI Card added 2.9M cards and grew spend 21.6%; ICICI's spend fell 5.9%. Acme's penetration runs 22% at HDFC and 8% at SBI Card, so the fastest-growing book is also the emptiest."
        bodyClassName="p-0"
        right={<DataBadge kind="reported" source="RBI bank-wise card statistics, Jul 2026" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Issuer</th>
                {(
                  [
                    ["cards_m", "Cards (M)"],
                    ["spend_cr", "Monthly spend"],
                    ["spend_per_card", "Spend / card / mo"],
                    ["yoy_spend_pct", "YoY spend"],
                  ] as const
                ).map(([key, label]) => (
                  <th
                    key={key}
                    className="cursor-pointer px-5 py-3 text-right hover:text-foreground"
                    onClick={() => setSort(key)}
                  >
                    {label}
                    {sort === key ? " ↓" : ""}
                  </th>
                ))}
                <th className="px-5 py-3 text-right">Net adds 12mo</th>
                <th className="px-5 py-3 text-right">Share</th>
                <th className="px-5 py-3 text-right">Acme penetration</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.slug}
                  onClick={() => setIssuer(r.slug)}
                  className={cn(
                    "cursor-pointer border-b border-border/60 transition-colors hover:bg-surface-2",
                    issuer === r.slug && "bg-primary/10",
                  )}
                >
                  <td className="px-5 py-3">
                    <span className="font-medium">{r.name}</span>
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r.category}
                    </span>
                  </td>
                  <td className="tabular px-5 py-3 text-right">{r.cards_m.toFixed(2)}</td>
                  <td className="tabular px-5 py-3 text-right">{fmtCr(r.spend_cr)}</td>
                  <td className="tabular px-5 py-3 text-right">{fmtRupees(r.spend_per_card)}</td>
                  <td
                    className={cn(
                      "tabular px-5 py-3 text-right",
                      r.yoy_spend_pct >= 0 ? "text-positive" : "text-negative",
                    )}
                  >
                    {fmtSigned(r.yoy_spend_pct)}
                  </td>
                  <td className="tabular px-5 py-3 text-right">+{r.net_adds_12m_m.toFixed(2)}M</td>
                  <td className="tabular px-5 py-3 text-right">{fmtPct(r.share_pct, 1)}</td>
                  <td
                    className="tabular px-5 py-3 text-right text-modeled"
                    title={
                      data.penetration.find((p) => p.issuer_slug === r.slug)?.method_note ??
                      "Example estimate; see Sources & Method"
                    }
                  >
                    {fmtPct(r.penetration_pct, 0)}
                    <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                      {data.penetration.find((p) => p.issuer_slug === r.slug)?.confidence ?? ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel
          eyebrow="Where to spend effort"
          title="Which banks' customers are worth chasing"
          soWhat={`Banks are split on two things only: how much a card is used, and how fast the bank is adding cards. Everything above ${fmtRupees(midSpend)} a month and +${midGrowth.toFixed(2)}M a year sits in the first box.`}
          right={
            <DataBadge
              kind="derived"
              source="Spend per card and net adds from RBI; the split is the median bank on each measure"
            />
          }
          bodyClassName="grid gap-3 sm:grid-cols-2"
        >
          {quadrants.map((q) => {
            const members = rows.filter(q.test);
            return (
              <div key={q.key} className={cn("rounded-lg border p-4", q.tone)}>
                <h3 className="text-sm font-semibold">{q.title}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{q.meaning}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {members.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No bank in this box</span>
                  ) : (
                    members.map((m) => (
                      <button
                        key={m.slug}
                        onClick={() => setIssuer(m.slug)}
                        title={`${fmtRupees(m.spend_per_card)} per card / month · +${m.net_adds_12m_m.toFixed(2)}M cards in 12 months`}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                          issuer === m.slug
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border hover:bg-surface-2",
                        )}
                      >
                        {m.name}
                      </button>
                    ))
                  )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{q.action}</p>
              </div>
            );
          })}
        </Panel>

        <Panel
          eyebrow="Since 2019"
          title="Card base trend, top 5 issuers vs Acme"
          soWhat="Acme's active base has grown steadily alongside the biggest issuers' card books."
          right={
            <DataBadge
              kind="modeled"
              source="Issuer cards from RBI; Acme monthly actives are example figures"
            />
          }
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 16, bottom: 4, left: -10 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `${v}M`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipItemStyle}
                  formatter={(v: number) => `${Number(v).toFixed(2)}M`}
                />
                {topNames.map((n, i) => (
                  <Line
                    key={n}
                    type="monotone"
                    dataKey={n}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="Acme monthly actives"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  strokeDasharray="5 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {topNames.map((n, i) => (
              <span key={n} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: colors[i % colors.length] }}
                />
                {n}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-primary">
              <span className="h-0.5 w-4 rounded-full bg-primary" />
              Acme monthly actives
            </span>
          </div>
        </Panel>

      </div>
    </div>
  );
}

function CompanyView() {
  return <IssuersPage />;
}
