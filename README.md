# GrowthHub

**An AI growth command center for any company, in any industry.**

Add your website, and your Play Store and App Store links if you have an app. GrowthHub reads
them, works out what your business is, who your customers are and who you compete with, and
builds a full growth dashboard for you: from the size of your market down to the campaigns
you should run next.

## The journey

1. **Sign in** with your email (magic link, no password).
2. **Add your company:** website, optional app store links, main country, and any competitors
   you want included.
3. **GrowthHub builds your dashboard.** It reads your public pages, writes a business profile,
   renames every section to fit your industry (a lending app gets "Borrower Universe", a SaaS
   tool gets "Buyer Universe"), drops sections that don't apply, and generates the rest. You
   watch it build live; it takes a few minutes.
4. **Work with it.** Rebuild any section, replace modelled numbers with your own data, plug in
   your ad, analytics and SEO tools, and let the AI growth agents turn it into next actions.

Teammates who sign in with the same work email domain see the same companies.

## What you get

| Section | What it answers |
| --- | --- |
| Addressable market | TAM, SAM and SOM, and the funnel from everyone down to the winnable audience |
| The big opportunity | The headroom between where you are and a realistic three-year target |
| Industry landscape | The major players and partners in your category, their scale and share |
| Customer universe | Named personas: who they are, what they want, where to reach them |
| Audience overlap | Where your audience overlaps with competitors and where it is uncontested |
| Competitors | Positioning, strengths, weaknesses, pricing and ratings, head to head |
| Where they live | The platforms and media each persona uses, and where reach is cheap |
| Marketing audit | Your current campaigns scored on offer, fit, proof and call to action |
| ASO & SEO audit | App store listing and website search gaps, with fixes |
| Growth playbook | Ranked plays with segment, channel, reach, conversion and effort |
| Budget allocator | How to split a marketing budget across channels, with expected CAC |
| Unit economics | CAC, ARPU, margin, LTV, payback and LTV:CAC by segment |
| Cross-sell headroom | What existing customers could also buy, and what it is worth |
| Growth experiments | A scored backlog of experiments |
| Run campaigns | Ready-to-launch campaign concepts with copy and budget |
| Model vs actual | The metrics to track against the model, and what data replaces estimates |
| Growth calendar | A 12-week calendar of launches, campaigns and seasonal moments |
| Growth agents | What each AI agent (CGO, analytics, performance, ASO/SEO, partnerships, lifecycle, creative, sprint) works on first |
| Ask the map | The questions leadership should be asking, with short answers |
| Sources & method | Where every number came from, and every assumption |
| The story | The growth story in a few beats leadership can retell |
| Upload actual data | Which of your own data to upload to replace modelled numbers |

Every generated number is labelled **reported** (found in your pages or public data),
**derived** (calculated from reported numbers) or **modelled** (an estimate), with its source
or assumption.

## The demo company

GrowthHub ships with **Acme**, a fictional credit card bill-payment app, as a fully worked
example. Its screens are hand-built and interactive: assumption dials that recalculate every
number, a budget allocator, experiment board, campaign writer that creates paused Google and
Meta campaigns, and a team of AI growth agents. Every Acme figure is made up; bank-level card
figures come from public RBI statistics. Open it from the company picker to see what a deep
build looks like.

## Running it

You need Node.js 22+, a [Supabase](https://supabase.com) project and an API key for any
OpenAI-compatible model provider.

```sh
cp .env.example .env      # Supabase keys, AI_API_KEY, who may sign in, admins
npm install
npm run dev
```

Set up the database by running the files in `supabase/migrations` in order, for example with
the Supabase CLI (`supabase db push`).

To deploy, run `npm run build` and then `npm start`. The build is a Node server by default; set
`NITRO_PRESET` (for example `vercel` or `cloudflare-module`) to target another host.

### Settings that matter

| Setting | What it does |
| --- | --- |
| `VITE_ALLOWED_EMAIL_DOMAINS` | `*` lets anyone sign in; or list your own domains. Empty means nobody can sign in. |
| `ADMIN_EMAILS` | Who sees every company and the Admin page. |
| `REQUIRE_APPROVAL` | `true` makes an admin approve each new company before it builds, to control AI spend. |
| `MAX_COMPANIES_PER_USER` | How many companies one person can add (default 3). |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | The AI provider. Defaults to OpenAI. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional emails: build ready, approval requests, sign-in alerts. |

A full build makes one AI call for the business profile and one per section, so each company
costs about two dozen long AI requests. Use a smaller `AI_MODEL` to spend less.

## How it works

- `src/lib/sections.ts` defines the sections every company gets and what each must show.
- `src/lib/builder.server.ts` reads the website and store listings (public addresses only),
  builds the business profile and section map, then generates sections in small batches.
  The open dashboard drives the build forward, so no background worker is needed.
- `src/components/dashboard/GenericDashboard.tsx` renders a built company.
- The Acme demo lives in the original hand-built screens under `src/routes`, with its data in
  `src/lib` and `supabase/migrations`. `src/lib/brand.ts` names the demo company.

Built with TanStack Start (React 19, Vite), Tailwind CSS, Supabase and Recharts.

## License

MIT
