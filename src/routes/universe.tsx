import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import { useAssumptions } from "@/lib/assumptions";
import { headroom, targetability } from "@/lib/model";
import { useSelection } from "@/lib/selection";
import { fmtM, fmtPct } from "@/lib/format";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/universe")({
  head: () => ({
    meta: [
      { title: "Cardholder Universe — Growth Dashboard" },
      {
        name: "description",
        content:
          "Seven acting-sized personas inside India's 52M credit cardholders, with Acme penetration for each.",
      },
      { property: "og:title", content: "Cardholder Universe — Growth Dashboard" },
      {
        property: "og:description",
        content: "Who these 52M people are, in groups a team can act on.",
      },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

function UniversePage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const { get } = useAssumptions();
  const { persona, setPersona, issuer } = useSelection();
  const [bank, setBank] = useState<string>("all");
  const h = headroom(data, get);
  const tiers = targetability(data, get);
  const maxBand = Math.max(...data.scoreBands.map((b) => Number(b.size_m)), 1);
  const uncarded = data.scoreBands
    .filter((b) => !b.has_card)
    .reduce((s, b) => s + Number(b.size_m), 0);

  const activeSlug = bank !== "all" ? bank : issuer;
  const issuerName = activeSlug
    ? (data.issuers.find((i) => i.slug === activeSlug)?.name ?? null)
    : null;
  const base = data.personas.reduce((s, p) => s + Number(p.size_m), 0);
  const scale = h.cardholders / base;

  const sized = data.personas
    .map((p) => ({ ...p, sized_m: Number(p.size_m) * scale }))
    .filter((p) => !issuerName || p.primary_issuers.includes(issuerName.split(" ")[0]!));

  const selected = data.personas.find((p) => p.slug === persona) ?? null;
  const total = sized.reduce((s, p) => s + p.sized_m, 0) || 1;

  const bySize = [...sized].sort((a, b) => b.sized_m - a.sized_m);
  const biggest = bySize[0];
  const emptiest = [...bySize]
    .filter((p) => p.sized_m > 3)
    .sort((a, b) => Number(a.penetration_pct) - Number(b.penetration_pct))[0];
  const lowHanging = tiers.find((t) => t.key === "low_hanging") ?? tiers[0];
  const useless = [...tiers].sort((a, b) => b.size_m - a.size_m)[0];


  return (
    <div>
      <PageHeader
        step="4 · Cardholder Universe"
        title={`Who are these ${fmtM(h.cardholders, 0)} people, in groups we can act on?`}
        question="Sizes move with the cards-per-holder assumption. Click a persona for channels, message and product hooks."
        right={
          <div className="flex flex-col items-end gap-2">
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Filter by bank
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="min-w-[200px] rounded-md border border-border bg-surface-2 px-3 py-2 text-sm normal-case tracking-normal text-foreground"
              >
                <option value="all">All banks</option>
                {[...data.issuers]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((i) => (
                    <option key={i.slug} value={i.slug}>
                      {i.name}
                    </option>
                  ))}
              </select>
            </label>
            <Link
              to="/upload"
              className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20"
            >
              Upload actual data →
            </Link>
          </div>
        }
      />

      <p className="mb-4 rounded-md border border-modeled/30 bg-modeled/10 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="font-medium text-modeled">Acme penetration here is modelled. </span>
        The percentages on the treemap and the persona cards are estimates until Acme&rsquo;s own
        cohort figures are loaded.{" "}
        <Link to="/upload" className="text-primary hover:underline">
          Upload actual data
        </Link>
        .
      </p>


      {issuerName ? (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
          Filtered to personas holding {issuerName} cards
          {bank !== "all" ? (
            <button onClick={() => setBank("all")} className="underline underline-offset-2">
              clear
            </button>
          ) : null}
        </p>
      ) : null}


      <Panel
        eyebrow="Treemap"
        title="The cardholder base by persona"
        soWhat="Colour is Acme penetration: the two biggest blocks are also the two emptiest."
        right={<DataBadge kind="modeled" source="Example split of the cardholder base by issuer mix" assumptionKeys={["cards_per_holder", "prime_share"]} />}
      >
        <div className="flex h-64 flex-wrap gap-1.5">
          {[...sized]
            .sort((a, b) => b.sized_m - a.sized_m)
            .map((p) => {
              const share = (p.sized_m / total) * 100;
              const pen = Number(p.penetration_pct);
              return (
                <button
                  key={p.slug}
                  onClick={() => setPersona(p.slug)}
                  style={{
                    flexBasis: `${Math.max(share * 2.4, 22)}%`,
                    flexGrow: p.sized_m,
                    backgroundColor: `color-mix(in oklab, var(--color-primary) ${Math.min(Math.max(pen, 4), 55)}%, var(--color-surface-2))`,
                  }}
                  className={cn(
                    "flex min-w-[150px] flex-col justify-between rounded-lg border p-3 text-left transition-colors",
                    persona === p.slug ? "border-primary" : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="text-xs font-semibold">{p.name}</span>
                  <span className="tabular text-[11px] text-foreground/85">
                    {fmtM(p.sized_m, 1)} · {fmtPct(pen, 0)} on Acme
                  </span>
                </button>
              );
            })}
        </div>
        <p className="mt-3 rounded-md border border-modeled/30 bg-modeled/10 px-3 py-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-modeled">Why three personas read 0%. </span>
          Virgin prime, lapsed prime and credit-graduated are{" "}
          <span className="text-foreground">defined</span> by not being active on Acme — never
          installed, lapsed, or rejected at the gate. The 0% is the definition of the group, not a
          measurement that nobody in it has ever opened the app. In practice a small tail of each
          sits in Acme&rsquo;s dormant base; a realistic range is 0&ndash;4% until cohort totals
          confirm it.
        </p>
      </Panel>

      <Panel
        className="mt-4"
        eyebrow="Targetability"
        title="Low hanging, difficult, impossible, useless"
        soWhat={`Only ${fmtM(tiers[0]?.size_m ?? 0, 1)} people are genuinely low hanging. Planning against 52M is planning against a number that does not exist.`}
        right={
          <DataBadge
            kind="modeled"
            source="Example tier boundaries applied to the score bands"
            assumptionKeys={["cards_per_holder", "active_card_rate", "prime_share"]}
          />
        }
        bodyClassName="grid gap-3 lg:grid-cols-2 xl:grid-cols-4"
      >
        {tiers.map((t) => (
          <div
            key={t.key}
            className={cn(
              "flex flex-col rounded-lg border p-4",
              t.key === "low_hanging"
                ? "border-primary/50 bg-primary/10"
                : t.key === "difficult"
                  ? "border-derived/40 bg-derived/5"
                  : "border-border bg-surface-2/50",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">{t.label}</h3>
              <span className="rounded-full border border-border px-2 py-px text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.verdict}
              </span>
            </div>
            <p className="tabular mt-3 font-display text-3xl font-semibold text-primary">
              {fmtM(t.size_m, 1)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {fmtPct(t.share_pct, 0)} {t.basis_label}
            </p>
            <p className="mt-3 text-xs">{t.who}</p>
            <p className="mt-2 flex-1 text-[11px] text-muted-foreground">{t.why}</p>
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Cost to win · {t.cost_to_win}
              </p>
              <p className="mt-1 text-xs">{t.play}</p>
            </div>
          </div>
        ))}
      </Panel>

      <Panel
        className="mt-4"
        eyebrow="750+ universe"
        title="Everyone scoring 750 or above, card or no card"
        soWhat={`${fmtM(uncarded, 1)} people are prime by score and carry no credit card at all. They are invisible in RBI card data and absent from every plan on this map.`}
        right={<DataBadge kind="modeled" source="CIBIL score-band distribution across the credit-active population" />}
      >
        <div className="space-y-2">
          {data.scoreBands.map((b) => {
            const size = Number(b.size_m);
            const onBrand = Number(b.on_brand_m);
            return (
              <div key={b.key} className="rounded-lg border border-border bg-surface-2/40 px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">
                    {b.label}
                    <span
                      className={cn(
                        "ml-2 rounded-full border px-2 py-px text-[10px] uppercase tracking-wider",
                        b.has_card
                          ? "border-border text-muted-foreground"
                          : "border-modeled/40 text-modeled",
                      )}
                    >
                      {b.has_card ? "has a card" : "no card yet"}
                    </span>
                  </span>
                  <span className="tabular text-sm">
                    {fmtM(size, 1)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {onBrand > 0 ? `${fmtM(onBrand, 1)} on Acme` : "none on Acme"}
                    </span>
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary/35"
                    style={{ width: `${(size / maxBand) * 100}%` }}
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${size ? (onBrand / size) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{b.note}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {sized.map((p) => (
          <button
            key={p.slug}
            onClick={() => setPersona(p.slug)}
            className={cn(
              "panel px-5 py-4 text-left transition-colors hover:border-primary/50",
              persona === p.slug && "border-primary",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">{p.name}</h3>
              <span className="tabular font-display text-lg font-semibold text-primary">
                {fmtM(p.sized_m, 1)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{p.who}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
              <dt className="text-muted-foreground">Issuers</dt>
              <dd className="text-right">{p.primary_issuers}</dd>
              <dt className="text-muted-foreground">City tier</dt>
              <dd className="text-right">{p.city_tier}</dd>
              <dt className="text-muted-foreground">Cards held</dt>
              <dd className="tabular text-right">{Number(p.cards_held).toFixed(1)}</dd>
              <dt className="text-muted-foreground">Typical spend</dt>
              <dd className="tabular text-right">{p.typical_spend}</dd>
              <dt className="text-muted-foreground">Acme status</dt>
              <dd className="text-right">{p.brand_status}</dd>
            </dl>
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="text-foreground">What they want: </span>
              {p.wants}
            </p>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Close persona"
            onClick={() => setPersona(selected.slug)}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />
          <aside className="relative h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface px-5 py-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-primary">Persona</p>
                <h2 className="mt-1 text-xl font-semibold">{selected.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selected.who}</p>
              </div>
              <button
                onClick={() => setPersona(selected.slug)}
                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <Field label="Estimated size">
                {fmtM(Number(selected.size_m) * scale, 1)} cardholders{" "}
                <DataBadge kind="modeled" assumptionKeys={["cards_per_holder"]} />
              </Field>
              <Field label="Acme penetration">{fmtPct(Number(selected.penetration_pct), 0)}</Field>
              <Field label="Where they are">{selected.channels}</Field>
              <Field label="Message that fits">“{selected.message}”</Field>
              <Field label="Product hooks">{selected.hooks}</Field>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/50 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1.5">{children}</p>
    </div>
  );
}

function CompanyView() {
  return <UniversePage />;
}
