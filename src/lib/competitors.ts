/**
 * Competitor set for the Acme view.
 * Example content: Acme, Payly, SuperPay and QuickWallet are fictional apps and
 * every figure is made up. Replace with your own market research.
 */

export type Competitor = {
  key: string;
  name: string;
  owner: string;
  positioning: string;
  installs_m: number;
  mau_m: number;
  gate: string;
  gateTone: "closed" | "soft" | "open";
  share_pct: number; // share of credit card bill payments made in an app
  rating: string;
  strength: string;
  weakness: string;
  threat: "high" | "medium" | "low";
};

export const COMPETITORS: Competitor[] = [
  {
    key: "acme",
    name: "Acme",
    owner: "Acme Technologies (fictional)",
    positioning: "Members-only club for high-score cardholders",
    installs_m: 10,
    mau_m: 3,
    gate: "750+ credit score",
    gateTone: "closed",
    share_pct: 18,
    rating: "4.6",
    strength: "High-spending cardholder base and the habit of paying the bill in-app",
    weakness: "The gate caps the addressable base, and rewards are the most resented part of the app",
    threat: "low",
  },
  {
    key: "bankapps",
    name: "Bank apps",
    owner: "Each card issuer's own app",
    positioning: "Where the card was issued, so where the bill gets paid",
    installs_m: 200,
    mau_m: 50,
    gate: "Hold the bank's card",
    gateTone: "closed",
    share_pct: 50,
    rating: "4.2",
    strength: "Default destination, zero acquisition cost, statement and limit live there",
    weakness: "Clunky, no cross-card view, nothing rewarding about paying",
    threat: "high",
  },
  {
    key: "superpay",
    name: "SuperPay",
    owner: "Fictional payments super-app",
    positioning: "UPI first, bill payments attached",
    installs_m: 400,
    mau_m: 200,
    gate: "Open to anyone",
    gateTone: "open",
    share_pct: 12,
    rating: "4.4",
    strength: "Unmatched reach and daily UPI habit",
    weakness: "Card bill payment is a utility tab, not a reason to open the app",
    threat: "medium",
  },
  {
    key: "quickwallet",
    name: "QuickWallet",
    owner: "Fictional wallet and payments app",
    positioning: "Everything payments, including card bills",
    installs_m: 300,
    mau_m: 60,
    gate: "Open to anyone",
    gateTone: "open",
    share_pct: 8,
    rating: "4.3",
    strength: "Deep merchant and bill-payment rails",
    weakness: "Past outages cost it trust with premium users",
    threat: "medium",
  },
  {
    key: "payly",
    name: "Payly",
    owner: "Payly Labs (fictional challenger)",
    positioning: "Pay every card bill in one place",
    installs_m: 1,
    mau_m: 0.2,
    gate: "Open to anyone",
    gateTone: "open",
    share_pct: 1,
    rating: "2.6",
    strength: "Direct copy of Acme's core job, without the gate",
    weakness: "2.6 rating — a million installs of actively unhappy card-payers",
    threat: "low",
  },
];

export const TAKEAWAYS = [
  {
    title: "The rival is habit, not a fintech",
    text: "About half of all card bills are paid inside the issuer's own app. That pool is not loyal — it is simply the default. Winning it needs a reason to switch at the moment the bill lands, not a better rewards catalogue.",
  },
  {
    title: "The gate is the moat and the ceiling",
    text: "750+ keeps the base premium and the credit risk low, and it is why spend per member beats every open app. It also means every competitor with an open door is accumulating tomorrow's prime customers before Acme can talk to them.",
  },
  {
    title: "Payly's unhappy installs",
    text: "Same job, no gate, 2.6 stars. It is the cleanest switcher pool in the market: people who already pay bills in a third-party app and already dislike theirs.",
  },
  {
    title: "Scale apps cannot be beaten on reach",
    text: "The payment super-apps have many times the actives. Competing on reach is unwinnable; competing on what happens after the bill is paid is not.",
  },
];
