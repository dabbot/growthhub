/**
 * Static audit content for the ASO & SEO screen.
 * Example content: Acme, Northstar Card and Payly are fictional apps and every
 * figure below is made up. Replace with your own store and search data.
 */

export type Badge = "reported" | "derived" | "modeled";

export type StoreApp = {
  key: string;
  name: string;
  owner: string;
  rating: string;
  reviews: string;
  downloads: string;
  gate: string;
  verdict: string;
  source: string;
};

export const STORE_APPS: StoreApp[] = [
  {
    key: "acme",
    name: "Acme",
    owner: "Acme Technologies (fictional)",
    rating: "4.6",
    reviews: "1.2M",
    downloads: "10M+",
    gate: "750+ credit score to join",
    verdict:
      "Rating is strong, but it is an average of two different apps: bill payment (loved) and rewards (resented).",
    source: "Example store listing",
  },
  {
    key: "northstar",
    name: "Northstar Card",
    owner: "Northstar Bank (fictional issuer)",
    rating: "4.2",
    reviews: "600K",
    downloads: "5M+",
    gate: "Open to every Northstar cardholder",
    verdict: "A servicing app, not a habit. Users come for a statement or a limit change, then leave.",
    source: "Example store listing",
  },
  {
    key: "payly",
    name: "Payly",
    owner: "Payly Labs (fictional challenger)",
    rating: "2.6",
    reviews: "40K",
    downloads: "1M+",
    gate: "No score gate — anyone with a card",
    verdict: "1M installs and a 2.6 rating: a pool of card-payers who are actively unhappy where they are.",
    source: "Example store listing",
  },
];

export type ReviewTheme = {
  app: string;
  theme: string;
  weight: string;
  quoteGist: string;
  badge: Badge;
  source: string;
};

export const REVIEW_THEMES: ReviewTheme[] = [
  {
    app: "Acme",
    theme: "Rewards feel rigged",
    weight: "Pain index 1.00 — the loudest theme by far",
    quoteGist:
      "Reviews mentioning rewards or points average about 2.5 stars, against about 4.6 for reviews that name no problem at all.",
    badge: "modeled",
    source: "Example review analysis",
  },
  {
    app: "Acme",
    theme: "Points that buy nothing",
    weight: "Recurring inside the rewards theme",
    quoteGist:
      "Members price a store item with points, then find the same product cheaper on a marketplace without spending any.",
    badge: "modeled",
    source: "Example review analysis",
  },
  {
    app: "Acme",
    theme: "Support you cannot reach",
    weight: "Pain index 0.5",
    quoteGist:
      "Payment routed wrong, no phone line, resolution pushed back to the bank. Angry users go where they can be heard.",
    badge: "modeled",
    source: "Example review analysis",
  },
  {
    app: "Northstar Card",
    theme: "Fraud and dispute panic",
    weight: "Dominates the 1-star reviews",
    quoteGist: "Cardholders who lose money want a human within the hour and get an email address instead.",
    badge: "modeled",
    source: "Example review analysis",
  },
  {
    app: "Northstar Card",
    theme: "Collections feel like harassment",
    weight: "Repeated across low ratings",
    quoteGist:
      "Reminders keep coming minutes after a promise to pay. Nothing in the app lets a user say 'paying on the 26th' and be left alone.",
    badge: "modeled",
    source: "Example review analysis",
  },
  {
    app: "Northstar Card",
    theme: "Onboarding that stalls",
    weight: "Community threads, not store reviews",
    quoteGist: "Applications freeze between digital KYC and verification, with no status a user can trust.",
    badge: "modeled",
    source: "Example forum analysis",
  },
  {
    app: "Payly",
    theme: "The reward was devalued",
    weight: "The reason for the low rating",
    quoteGist:
      "Rewards could once settle a card bill; then they could not. Users describe the main reason to use the app disappearing.",
    badge: "modeled",
    source: "Example review analysis",
  },
  {
    app: "Payly",
    theme: "Trust wobble",
    weight: "Strong in enthusiast forums",
    quoteGist: "Card expiry and CVV requested for a bill payment; users call it shady and report difficulty deleting their account.",
    badge: "modeled",
    source: "Example forum analysis",
  },
  {
    app: "Payly",
    theme: "Basics missing",
    weight: "Consistent in 3-star reviews",
    quoteGist:
      "No autopay, no dark mode, stale outstanding balances — people stay only for the rewards, which is exactly why they leave when the rewards change.",
    badge: "modeled",
    source: "Example review analysis",
  },
];

export type SeoRow = {
  keyword: string;
  position: string;
  volume: string;
  note: string;
};

export const SEO_SNAPSHOT = {
  keywords: "5,000",
  traffic: "120,000 visits/mo (example)",
  value: "$20,000/mo of equivalent paid traffic",
  paid: "0 keywords bought on Google search",
  source: "Example search snapshot",
};

export const SEO_ROWS: SeoRow[] = [
  {
    keyword: "acme / acme app / acme login",
    position: "1–3",
    volume: "~60k/mo",
    note: "Brand demand. Already won — it measures the ad spend, it does not add members.",
  },
  {
    keyword: "acme customer care number (and variants)",
    position: "1",
    volume: "~20k/mo",
    note: "A large share of organic traffic is people hunting for a phone number. That is a support signal masquerading as SEO success.",
  },
  {
    keyword: "credit score check",
    position: "9",
    volume: "200k/mo",
    note: "The single biggest non-brand prize, and Acme is on page one's edge. Moving 9 → 3 is worth more than any new landing page.",
  },
  {
    keyword: "credit",
    position: "11",
    volume: "500k/mo",
    note: "Page two on the category's head term. One good explainer hub away from real traffic.",
  },
  {
    keyword: "northstar premium credit card",
    position: "5",
    volume: "15k/mo",
    note: "Acme already ranks on rival card pages. This is where issuer-app users are standing when they search.",
  },
  {
    keyword: "credit card bill payment offers",
    position: "2",
    volume: "5k/mo",
    note: "Exactly the Payly user's query, and Acme is second. Low-hanging.",
  },
];

export const SEO_COMPETITORS = [
  { name: "northstarbank.example", traffic: "2M/mo", note: "Far more organic traffic than Acme, mostly servicing queries." },
  { name: "cardreviews.example", traffic: "30K/mo", note: "Closest organic rival by relevance — a content site, not a bank." },
  { name: "cardcompare.example", traffic: "35K/mo", note: "Owns card-comparison intent Acme wants." },
  { name: "cardforum.example", traffic: "20K/mo", note: "Where enthusiasts decide which card to take, and what to think of Acme." },
];

export type Bet = {
  title: string;
  target: string;
  insight: string;
  build: string;
  size: string;
  effort: "Low" | "Medium" | "High";
};

export const FEATURE_BETS: Bet[] = [
  {
    title: "Say what a point is worth, in rupees, before it is earned",
    target: "Own base + Payly refugees",
    insight:
      "Both apps are bleeding on the same wound: a reward currency that quietly devalues. Acme's rewards reviews average about 2.5; Payly fell to 2.6 the moment rewards stopped clearing bills.",
    build:
      "A fixed, published rupee value per point and a 'never devalued' promise with a public changelog. The promise is the feature; the point is just the unit.",
    size: "Defends the active base, and is the single clearest reason for a Payly user to switch",
    effort: "Medium",
  },
  {
    title: "Beat the marketplace price or refund the difference",
    target: "Lapsed Acme members",
    insight:
      "The most shared complaint is opening the store, applying points, and finding the thing cheaper elsewhere without them.",
    build:
      "Price-match the top 200 store SKUs against a public marketplace, shown on the product card before checkout.",
    size: "Attacks the top-weighted complaint in the reviews",
    effort: "Medium",
  },
  {
    title: "A human in ten minutes, in the app",
    target: "Issuer-app users + own detractors",
    insight:
      "Support is Acme's second pain index, and the issuer app's worst reviews are fraud victims told to send an email.",
    build:
      "Callback-in-ten-minutes for money-stuck cases, a visible case timer, and a dispute tracker that follows the bank on the user's behalf.",
    size: "The one thing a bank app structurally cannot promise",
    effort: "High",
  },
  {
    title: "'I'm paying on the 26th' — tell the bank for me",
    target: "Issuer-app users",
    insight:
      "Collections chasing users who already committed to a date is a repeated theme in the issuer app's low ratings.",
    build:
      "A dated payment commitment inside Acme that schedules the debit, silences reminders and generates proof of intent.",
    size: "Turns Acme into the layer users want between them and the issuer",
    effort: "Medium",
  },
  {
    title: "Autopay and a balance that is actually current",
    target: "Payly users",
    insight:
      "No autopay and stale outstanding balances are the two most repeated functional gripes about Payly.",
    build:
      "Multi-card autopay with a pre-debit nudge, and a freshness timestamp on every balance shown.",
    size: "Table stakes that a 1M-install rival has not shipped",
    effort: "Low",
  },
  {
    title: "Never ask for CVV, and say so on the install screen",
    target: "Payly users",
    insight:
      "Payly's trust problem is concrete: forums flag CVV collection and hard account deletion.",
    build:
      "A 'what we never ask for' panel at onboarding plus one-tap account deletion — then make it store-listing copy and a comparison ad.",
    size: "Cheapest switch trigger on this list",
    effort: "Low",
  },
];

export type FixItem = {
  id: string;
  area: "ASO" | "SEO";
  fix: string;
  why: string;
  effort: "Low" | "Medium" | "High";
  /** Estimated build cost in person-weeks. */
  weeks: number;
  /** Rough team needed to land it. */
  squad: string;
  /** When it should be picked up. */
  horizon: "Now" | "Next" | "Later";
  /** What proves it worked. */
  measure: string;
};

export const FIX_LIST: FixItem[] = [
  {
    id: "aso-gate",
    area: "ASO",
    fix: "Stop burying the gate",
    why: "The 750+ requirement appears deep in the listing. Surfacing it first raises install-to-member conversion and cuts the rejected-at-signup cohort that leaves 1-star reviews.",
    effort: "Low",
    weeks: 1,
    squad: "ASO copy + design",
    horizon: "Now",
    measure: "Install-to-approved-member rate",
  },
  {
    id: "aso-reply",
    area: "ASO",
    fix: "Answer the rewards reviews in public",
    why: "Payly replies to its angriest reviewers; Acme largely does not. Developer responses on the rewards theme are read by every prospective installer.",
    effort: "Low",
    weeks: 1,
    squad: "Support + brand",
    horizon: "Now",
    measure: "Reply rate on 1-2 star reviews, 30-day rating",
  },
  {
    id: "aso-rating-prompt",
    area: "ASO",
    fix: "Prompt for a rating after a successful bill payment, never after a reward reveal",
    why: "Payment is the 4.6-star moment; rewards are the 2.5-star one. Timing alone moves the public average.",
    effort: "Low",
    weeks: 1,
    squad: "App engineering",
    horizon: "Now",
    measure: "Average rating of new reviews",
  },
  {
    id: "seo-canonical",
    area: "SEO",
    fix: "Consolidate the pages competing for 'acme app'",
    why: "Several pages rank for the same brand term, splitting the click. One canonical page should own it.",
    effort: "Low",
    weeks: 1,
    squad: "Web engineering",
    horizon: "Now",
    measure: "Single URL ranking for the brand term",
  },
  {
    id: "seo-score",
    area: "SEO",
    fix: "Push 'credit score check' from 9 to 3",
    why: "About 200,000 searches a month, already ranking, and the exact intent of someone who may clear the 750 gate. Biggest single non-brand prize on the site.",
    effort: "Medium",
    weeks: 4,
    squad: "Content + web engineering",
    horizon: "Next",
    measure: "Position for 'credit score check', organic signups",
  },
  {
    id: "aso-screens",
    area: "ASO",
    fix: "Run screenshots against the switcher, not the newcomer",
    why: "Three of the first five screens should answer 'why leave the issuer app or Payly' — one bill view for all cards, fixed point value, human support.",
    effort: "Medium",
    weeks: 3,
    squad: "Design + ASO",
    horizon: "Next",
    measure: "Store page view to install rate",
  },
  {
    id: "seo-care",
    area: "SEO",
    fix: "Fix the customer-care flood at source",
    why: "A large share of organic traffic is people looking for a phone number. Make in-app support findable and this becomes a deflected cost rather than a traffic statistic.",
    effort: "Medium",
    weeks: 3,
    squad: "Support + app engineering",
    horizon: "Next",
    measure: "Share of organic traffic on care queries",
  },
  {
    id: "seo-card-hub",
    area: "SEO",
    fix: "Build out the rival-card article hub",
    why: "Acme already ranks 5th for a rival issuer's premium card. A full set of card pages puts Acme in front of other issuers' customers at decision time.",
    effort: "Medium",
    weeks: 6,
    squad: "Content team",
    horizon: "Later",
    measure: "Non-brand card keywords in the top 10",
  },
  {
    id: "seo-paid",
    area: "SEO",
    fix: "Decide about paid search deliberately",
    why: "Zero keywords bought. Competitors are unchallenged on high-intent card terms — either that is a conscious brand stance or an open flank.",
    effort: "Low",
    weeks: 1,
    squad: "Growth marketing",
    horizon: "Later",
    measure: "A written decision, and a test budget if yes",
  },
];

