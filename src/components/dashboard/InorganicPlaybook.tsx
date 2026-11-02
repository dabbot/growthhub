import { useState } from "react";
import { Panel } from "@/components/dashboard/Panel";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { cn } from "@/lib/utils";

type Partner = { name: string; type: string; theyGet: string; weGet: string; size: string; effort: "Low" | "Medium" | "High" };
type Deal = { target: string; kind: string; why: string; bulk: string; watch: string };

/** Example ideas for the fictional Acme. Sizes are made up for illustration. */
const DATA: { partners: Partner[]; deals: Deal[]; soWhatP: string; soWhatA: string } = {
  partners: [
    { name: "A large public-sector card issuer", type: "Card issuer co-brand", theyGet: "Faster on-time repayment and lower collection cost on a fast-growing base", weGet: "In-app bill pay as the default for new cards, where Acme is weakest today", size: "1–2M members", effort: "High" },
    { name: "Newer private-bank card books", type: "Issuer onboarding", theyGet: "Engaged 750+ customers and card activation nudges", weGet: "Access to card books outside the largest issuers", size: "0.5–1M", effort: "Medium" },
    { name: "Airline and hotel loyalty programmes", type: "Rewards exchange", theyGet: "High-spend members converting rewards into their points", weGet: "A reason for premium spenders to open Acme monthly", size: "0.2–0.5M", effort: "Medium" },
    { name: "Credit bureaus", type: "Score-improvement funnel", theyGet: "Paid report upgrades and coaching revenue", weGet: "A pipeline of users crossing 750 who then qualify for Acme", size: "0.3–0.8M", effort: "Medium" },
    { name: "Premium D2C and travel brands", type: "Rewards Store / Travel", theyGet: "Affluent buyers without discount-led acquisition cost", weGet: "Exclusive offers that pull lapsed members back", size: "0.3–0.6M reactivations", effort: "Low" },
    { name: "Employers and payroll platforms", type: "B2B2C benefits", theyGet: "A premium perk for salaried staff", weGet: "Bulk onboarding of salaried 750+ employees", size: "0.1–0.4M", effort: "Medium" },
  ],
  deals: [
    { target: "Smaller card bill-pay and rewards apps", kind: "Acqui-hire / user book", why: "Same job-to-be-done, users already paying card bills in-app", bulk: "1–4M installs, ~0.3–0.8M active", watch: "Much of the base will be below 750 — only the qualified slice counts" },
    { target: "Credit-score and card-comparison platforms", kind: "Full acquisition", why: "Top-of-funnel for people about to get their first or next card", bulk: "Millions of monthly visitors; high intent", watch: "Must keep neutrality or bank partners walk" },
    { target: "Expense and corporate-card players", kind: "Strategic buy", why: "Salaried, card-using professionals through their employer", bulk: "Thousands of companies → 0.2–0.6M users", watch: "B2B churn and integration cost" },
    { target: "Wealth and investing apps with affluent users", kind: "Tuck-in", why: "Overlaps Acme's 750+ affluent profile; cross-sell both ways", bulk: "0.4–1M investors", watch: "Regulatory approvals and brand fit" },
  ],
  soWhatP: "Organic plays win members one campaign at a time; one issuer default inside a large bank app could add more qualified members than a year of paid media.",
  soWhatA: "Buying a user base only pays if it is 750+ — price any deal on the qualified, active slice, not headline installs.",
};

export function InorganicPlaybook() {
  const d = DATA;
  const [tab, setTab] = useState<"partners" | "deals">("partners");
  return (
    <Panel
      className="mt-4"
      eyebrow="Inorganic growth playbook"
      title="Grow faster through partners and acquisitions"
      soWhat={tab === "partners" ? d.soWhatP : d.soWhatA}
      right={<DataBadge kind="modeled" source="Illustrative ideas and sizing — no partner or target has been approached" />}
    >
      <div className="mb-4 inline-flex rounded-full border border-border p-0.5 text-xs">
        {(["partners", "deals"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-full px-3 py-1", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            {t === "partners" ? "Strategic partnerships" : "Acquisitions"}
          </button>
        ))}
      </div>

      {tab === "partners" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {d.partners.map((p) => (
            <div key={p.name} className="rounded-lg border border-border bg-surface-2/50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-primary">{p.type}</p>
                  <p className="mt-1 text-sm font-semibold">{p.name}</p>
                </div>
                <div className="text-right">
                  <p className="tabular text-sm font-semibold text-primary">{p.size}</p>
                  <p className="text-[10px] text-muted-foreground">{p.effort} effort</p>
                </div>
              </div>
              <p className="mt-2 text-xs"><span className="text-muted-foreground">They get: </span>{p.theyGet}</p>
              <p className="mt-1 text-xs"><span className="text-muted-foreground">We get: </span>{p.weGet}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {d.deals.map((a) => (
            <div key={a.target} className="rounded-lg border border-border bg-surface-2/50 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{a.target}</p>
                <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary">{a.kind}</span>
              </div>
              <p className="mt-2 text-xs"><span className="text-muted-foreground">Why: </span>{a.why}</p>
              <p className="mt-1 text-xs"><span className="text-muted-foreground">Customers it brings: </span><span className="tabular">{a.bulk}</span></p>
              <p className="mt-1 text-xs text-modeled"><span className="text-muted-foreground">Watch out: </span>{a.watch}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
