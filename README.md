# Card Market Growth Dashboard

An interactive growth dashboard for a consumer fintech app in India's credit card market.
It sizes the market from public RBI data, works out how much of it is actually winnable,
and turns that into plays, budgets, experiments and ready-to-launch ad campaigns.

The project ships with a **fictional company, Acme**: a credit card bill-payment and rewards
app for cardholders with a 750+ credit score. **Every Acme figure is made up.** Competitor
apps on the ASO and Competitors screens (Northstar Card, Payly, SuperPay, QuickWallet) are
fictional too. Bank-level card and spend figures are public RBI statistics.

## What's inside

- **Market and headroom:** cards in force → cardholders → active → 750+ → not yet on the app
- **Issuer landscape:** bank-by-bank cards, spend, growth and the app's penetration
- **Cardholder universe:** personas, score bands and targetability tiers
- **Overlap:** bank app vs UPI super-app vs the app, as a Venn
- **Marketing and ASO/SEO audit** with a fix list and roadmap
- **Growth playbook, budget allocator, unit economics, cross-sell, experiments, calendar**
- **Run campaigns:** AI-written Google Search and Meta campaigns, created paused in your ad account
- **Growth agents:** a team of AI agents (CGO, analytics, performance, ASO, partnerships,
  lifecycle, creative, sprint) that read the dashboard and each other's work
- **Ask the Map:** questions answered only from the numbers in the tool
- **Upload actuals and connectors** to replace the example figures with your own

Every number can be moved with the assumption dials, and the whole dashboard recalculates.

## Tech

TanStack Start (React 19, Vite), Tailwind CSS, Supabase (Postgres, auth and storage),
Recharts. AI features work with any OpenAI-compatible API (OpenAI by default).

## Running locally

```sh
cp .env.example .env      # fill in Supabase, allowed email domains and AI_API_KEY
npm install
npm run dev
```

Apply the database schema and example data by running the files in `supabase/migrations`
in order (for example with the Supabase CLI: `supabase db push`).

Sign-in uses Supabase magic links and is restricted to the email domains in
`VITE_ALLOWED_EMAIL_DOMAINS`. With nothing set, nobody can sign in.

To deploy, run `npm run build` and then `npm start`. The build is a Node server by default;
set `NITRO_PRESET` (for example `vercel` or `cloudflare-module`) to target another host.

## Making it about your company

1. Edit `src/lib/brand.ts` (name, sector, products, customer).
2. Search the code for "Acme" and replace the wording.
3. Replace the example data in `supabase/migrations/*_example_seed.sql`, the Acme rows in
   the first migration, and the example content in `src/lib/growth-os.ts`,
   `src/lib/competitors.ts` and `src/lib/aso-seo.ts`.
4. Or upload your real funnel, actives and penetration on the **Upload actual data** screen.

## License

MIT
