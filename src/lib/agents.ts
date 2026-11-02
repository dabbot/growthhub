import { BRAND } from "./brand";
import type { CompanyKey } from "./company";

export type AgentKey =
  | "cgo"
  | "analytics"
  | "performance"
  | "aso"
  | "partnerships"
  | "lifecycle"
  | "creative"
  | "sprint";

export type AgentDef = {
  key: AgentKey;
  name: string;
  role: string;
  mandate: string;
  reportsTo: AgentKey | null;
  /** Agents whose latest outputs this agent reads before working. */
  reads: AgentKey[];
};

export const AGENTS: AgentDef[] = [
  {
    key: "cgo",
    name: "Chief Growth Officer",
    role: "Sets the growth bets and budget",
    mandate:
      "Owns the growth number. Turns the team's findings into a small set of ranked bets with owners, budget and targets.",
    reportsTo: null,
    reads: ["analytics", "performance", "aso", "partnerships", "lifecycle", "creative"],
  },
  {
    key: "analytics",
    name: "Analytics Agent",
    role: "Sizes the market and finds where growth leaks",
    mandate:
      "Reads the dashboard's numbers, sizes segments, spots funnel leaks and sets the metrics every other agent is judged on.",
    reportsTo: "cgo",
    reads: [],
  },
  {
    key: "performance",
    name: "Performance Marketing Agent",
    role: "Runs paid acquisition on Google and Meta",
    mandate:
      "Plans paid campaigns, audiences, bids and budgets, and writes launch-ready campaign specs.",
    reportsTo: "cgo",
    reads: ["analytics"],
  },
  {
    key: "aso",
    name: "ASO & SEO Agent",
    role: "Wins organic installs and search traffic",
    mandate: "Fixes the store listings and website so people searching find and choose the app.",
    reportsTo: "cgo",
    reads: ["analytics"],
  },
  {
    key: "partnerships",
    name: "Partnerships Agent",
    role: "Builds partner and inorganic channels",
    mandate: "Finds partners and deals that bring customers in bulk, and drafts outreach.",
    reportsTo: "cgo",
    reads: ["analytics"],
  },
  {
    key: "lifecycle",
    name: "Lifecycle & CRM Agent",
    role: "Activates, retains and cross-sells",
    mandate:
      "Designs push, email, SMS and in-app journeys that turn installs into active, repeat and multi-product customers.",
    reportsTo: "cgo",
    reads: ["analytics"],
  },
  {
    key: "creative",
    name: "Content & Creative Agent",
    role: "Writes ads, copy and content",
    mandate: "Produces ad copy, landing-page copy and content briefs in the brand's voice.",
    reportsTo: "cgo",
    reads: ["analytics", "performance"],
  },
  {
    key: "sprint",
    name: "Sprint Master Agent",
    role: "Turns plans into a two-week sprint",
    mandate:
      "Converts every agent's output into a ticketed sprint with owners, estimates, dependencies and a review ritual.",
    reportsTo: "cgo",
    reads: ["cgo", "analytics", "performance", "aso", "partnerships", "lifecycle", "creative"],
  },
];

export const agentByKey = (k: string) => AGENTS.find((a) => a.key === k);

export type Assignment = {
  key: string;
  agent: AgentKey;
  title: string;
  brief: string;
  context: string;
  custom?: boolean;
};

const CTX: Record<CompanyKey, { name: string; product: string; customer: string }> = {
  [BRAND.key]: { name: BRAND.name, product: BRAND.product, customer: BRAND.customer },
};

export function defaultAssignments(company: CompanyKey): Assignment[] {
  const c = CTX[company];
  const a = (agent: AgentKey, key: string, title: string, brief: string): Assignment => ({
    key: `${agent}-${key}`,
    agent,
    title,
    brief,
    context: "",
  });
  return [
    a("analytics", "headroom", "Headroom and segment sizing",
      `Size the addressable base for ${c.name} (${c.customer}), how much is already won, and the three largest unwon segments. Show the working for every number.`),
    a("analytics", "funnel", "Funnel leak report",
      `Walk ${c.name}'s funnel step by step, name the biggest drop-offs and what each is worth if fixed by 10%.`),
    a("analytics", "kpis", "North-star and KPI tree",
      `Define ${c.name}'s north-star metric and a KPI tree with weekly targets each agent will be measured on.`),
    a("performance", "media-plan", "30-day paid media plan",
      `Build a 30-day Google and Meta plan for ${c.name}: campaigns, audiences, daily budgets, bid strategy, expected CAC and kill rules.`),
    a("performance", "audit", "Live ad audit and fixes",
      `Audit ${c.name}'s current ads and list what to pause, scale and change, with reasons.`),
    a("aso", "listing", "Store listing rewrite",
      `Rewrite ${c.name}'s Play Store and App Store title, subtitle, short and long description and screenshot captions for the top search terms.`),
    a("aso", "seo", "SEO content and technical plan",
      `List the ten search terms ${c.name} should rank for, the page to build for each, and technical fixes for the website.`),
    a("partnerships", "shortlist", "Partner shortlist and pitch",
      `Shortlist eight partners that can bring ${c.name} ${c.customer} in bulk, the value exchange for each, and a first outreach email.`),
    a("lifecycle", "activation", "Activation journey",
      `Design a 14-day journey that turns a new ${c.name} install into an active customer: triggers, channels, message copy and success metric.`),
    a("lifecycle", "cross-sell", "Cross-sell campaigns",
      `Plan cross-sell journeys across ${c.product}, with target segment, offer, copy and expected lift.`),
    a("creative", "ads", "Ad copy pack",
      `Write ten Google search ads and ten Meta ads for ${c.name}'s top paid campaigns, each tagged with the angle it tests.`),
    a("creative", "landing", "Landing page copy",
      `Write landing-page copy for ${c.name}'s main acquisition campaign: headline, sub-head, proof points, FAQ and call to action.`),
    a("cgo", "strategy", "Quarterly growth strategy",
      `Read the team's outputs and set ${c.name}'s top five growth bets for the quarter with owner agent, budget share, target and the one risk that would kill each.`),
    a("cgo", "budget", "Budget allocation memo",
      `Split this quarter's growth budget across paid, organic, partnerships and lifecycle for ${c.name}, with the expected return of each rupee.`),
    a("sprint", "sprint", "Two-week sprint plan",
      `Turn every agent's latest output into a two-week sprint for ${c.name}: tickets with owner, estimate, dependency, acceptance criteria, and a daily stand-up and review agenda.`),
    a("sprint", "status", "Weekly status report",
      `Write a weekly growth status report for ${c.name}: what each agent shipped, what is blocked, metrics moved, and decisions needed from leadership.`),
  ];
}

export type AssignmentOverride = {
  assignment_key: string;
  agent_key: string;
  title: string;
  brief: string;
  context: string;
  removed: boolean;
};

export function mergeAssignments(company: CompanyKey, overrides: AssignmentOverride[]): Assignment[] {
  const byKey = new Map(overrides.map((o) => [o.assignment_key, o]));
  const base = defaultAssignments(company);
  const out: Assignment[] = [];
  for (const d of base) {
    const o = byKey.get(d.key);
    if (o?.removed) continue;
    out.push(o ? { ...d, title: o.title, brief: o.brief, context: o.context } : d);
  }
  const baseKeys = new Set(base.map((d) => d.key));
  for (const o of overrides) {
    if (baseKeys.has(o.assignment_key) || o.removed) continue;
    out.push({
      key: o.assignment_key,
      agent: o.agent_key as AgentKey,
      title: o.title,
      brief: o.brief,
      context: o.context,
      custom: true,
    });
  }
  return out;
}

export const COMPANY_NAME: Record<CompanyKey, string> = { [BRAND.key]: BRAND.name };
