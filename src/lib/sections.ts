/**
 * The dashboard sections every company gets.
 *
 * When a company is added, the builder renames each section to fit that business
 * (a lending app's "Customer Universe" becomes "Borrower Universe"), drops sections
 * that do not apply, and generates the content for the rest. Client-safe.
 */
export type SectionDef = { key: string; path: string; label: string; intent: string };

export const SECTIONS: SectionDef[] = [
  { key: "market", path: "/", label: "The Addressable Market", intent: "Size the total addressable market (TAM/SAM/SOM) for this business in its geography, with a funnel from total population down to the winnable audience." },
  { key: "opportunity", path: "/opportunity", label: "The Big Opportunity", intent: "The single biggest growth opportunity in numbers: the headroom between today's users/revenue and the realistic 3-year target." },
  { key: "issuers", path: "/issuers", label: "Industry Landscape", intent: "The industry structure: the major players, suppliers, platforms or partners in the category, their scale and market share." },
  { key: "universe", path: "/universe", label: "Customer Universe", intent: "5-7 named customer personas with size, who they are, what they want, channels, and message hooks." },
  { key: "overlap", path: "/overlap", label: "Audience Overlap", intent: "How this company's audience overlaps with the incumbent/adjacent apps customers already use; where the uncontested audience sits." },
  { key: "competitors", path: "/competitors", label: "Competitors", intent: "Head-to-head comparison with the top 5-8 competitors: positioning, strengths, weaknesses, pricing, ratings." },
  { key: "platforms", path: "/platforms", label: "Where They Live", intent: "Which platforms and media each persona spends time on (index vs average), and where to reach them cheaply." },
  { key: "marketing", path: "/marketing", label: "Marketing Audit", intent: "Audit of the company's current marketing: what campaigns/channels it likely runs, scored on offer clarity, fit, proof, CTA, with fixes." },
  { key: "aso", path: "/aso", label: "ASO & SEO Audit", intent: "App store listing and website SEO audit based on the scraped listing: title, keywords, screenshots, ratings, content gaps, with fixes." },
  { key: "playbook", path: "/playbook", label: "Growth Playbook", intent: "8-10 ranked growth plays: segment, lever, channel, owner, reach, expected conversion, effort and impact." },
  { key: "allocator", path: "/allocator", label: "Budget Allocator", intent: "How to split a monthly marketing budget across channels, with expected CAC and new customers per channel." },
  { key: "unit-economics", path: "/unit-economics", label: "Unit Economics", intent: "CAC, ARPU, gross margin, LTV, payback period and LTV:CAC by key segment or channel." },
  { key: "cross-sell", path: "/cross-sell", label: "Cross-Sell Headroom", intent: "Additional products or services existing customers could buy, with headroom size and revenue potential." },
  { key: "experiments", path: "/experiments", label: "Growth Experiments", intent: "A backlog of 8-10 growth experiments with hypothesis, metric, expected lift, and ICE score." },
  { key: "campaigns", path: "/campaigns", label: "Run Campaigns", intent: "3-5 ready-to-launch campaign concepts with audience, channel, headline, body copy, and budget." },
  { key: "variance", path: "/variance", label: "Model vs Actual", intent: "The key metrics to track against this model, current modelled values, and what data to upload to replace estimates." },
  { key: "calendar", path: "/calendar", label: "Growth Calendar", intent: "A 12-week growth calendar with seasonal moments, launches and campaigns relevant to this business and geography." },
  { key: "agents", path: "/agents", label: "Growth Agents", intent: "What each AI growth agent (CGO, Analytics, Performance, ASO/SEO, Partnerships, Lifecycle, Content, Sprint) should work on first, with deliverables." },
  { key: "ask", path: "/ask", label: "Ask the Map", intent: "The 8 most important questions leadership should be asking about growth, each with a short data-backed answer." },
  { key: "sources", path: "/sources", label: "Sources & Method", intent: "Where every number came from: what was read from the website and app stores, public data used, and every modelled assumption with its value." },
  { key: "story", path: "/story", label: "The Story", intent: "The growth story in 6-8 beats: from market size to the winning plan, as a narrative leadership can retell." },
  { key: "upload", path: "/upload", label: "Upload actual data", intent: "Which real data files the team should upload (with expected columns) to replace modelled numbers, prioritised." },
];

export const sectionByPath = (path: string) => SECTIONS.find((s) => s.path === path);

export type SectionMapEntry = { key: string; label: string; include: boolean; angle: string };

export type SectionContent = {
  title: string;
  headline: string;
  summary: string;
  metrics: { label: string; value: string; badge: "reported" | "derived" | "modelled"; note: string }[];
  table: { title: string; columns: string[]; rows: string[][] };
  bullets: { title: string; detail: string }[];
  why_it_matters: string;
};

/** Free email providers: their users get a private workspace, not one shared by domain. */
export const PERSONAL_DOMAINS = [
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "hotmail.com", "outlook.com", "live.com",
  "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com", "rediffmail.com", "zoho.com", "gmx.com",
  "yandex.com", "mail.com",
];

export function emailDomain(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase().split("@")[1] ?? "";
}

export const isPersonalEmail = (email: string | null | undefined) => PERSONAL_DOMAINS.includes(emailDomain(email));
