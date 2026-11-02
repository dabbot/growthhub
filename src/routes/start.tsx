import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { pageHead } from "@/components/dashboard/Meta";
import { useCompany } from "@/lib/company";
import { addCompany } from "@/lib/onboarding.functions";

export const Route = createFileRoute("/start")({
  head: () =>
    pageHead(
      "Add your company",
      "Share your website and app store links and get a full growth dashboard built for your business.",
    ),
  component: StartPage,
});

const STEPS = [
  "Reads your website and app store listings",
  "Works out your business, customers, geography and competitors",
  "Renames every section to fit your industry",
  "Builds market size, overlap, audits, playbook, unit economics and the rest",
];

function StartPage() {
  const { selectCompany, requireApproval } = useCompany();
  const submit = useServerFn(addCompany);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", website: "", play: "", appstore: "", country: "India", competitors: "", description: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_minmax(0,28rem)]">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <p className="text-[11px] uppercase tracking-[0.18em]">Start here</p>
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Build your growth command center</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Add your website, and your app store links if you have an app. The dashboard studies your business and builds
          every section for it: your addressable market, customer groups, overlap with competitors, marketing, SEO and app
          store audits, growth playbook, budget plan, unit economics, experiments and more.
        </p>
        <ol className="mt-6 space-y-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3 text-sm">
              <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs text-primary">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-xl text-xs text-muted-foreground">
          Every generated number is labelled reported, derived or modelled. Replace modelled numbers with your own by
          uploading data or plugging in connectors. A full build takes a few minutes.
        </p>
      </div>

      <form
        className="space-y-3 rounded-2xl border border-border bg-card p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setBusy(true);
          try {
            const r = await submit({ data: f });
            await qc.invalidateQueries({ queryKey: ["access"] });
            selectCompany(r.id);
            void navigate({ to: "/" });
          } catch (err) {
            setError(err instanceof Error ? err.message.replace(/^\[.*?\]\s*/, "") : "Something went wrong.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="font-display text-sm font-semibold">Your company</p>
        <input required className={input} placeholder="Company name" value={f.name} onChange={set("name")} />
        <input required type="url" className={input} placeholder="Website, e.g. https://yourcompany.com" value={f.website} onChange={set("website")} />
        <input type="url" className={input} placeholder="Google Play link (optional)" value={f.play} onChange={set("play")} />
        <input type="url" className={input} placeholder="App Store link (optional)" value={f.appstore} onChange={set("appstore")} />
        <div className="grid grid-cols-2 gap-3">
          <input className={input} placeholder="Main country" value={f.country} onChange={set("country")} />
          <input className={input} placeholder="Top competitors (optional)" value={f.competitors} onChange={set("competitors")} />
        </div>
        <textarea
          rows={3}
          className={input}
          placeholder="In a line or two, what do you do? (helps if your site is hard to read)"
          value={f.description}
          onChange={set("description")}
        />
        <button
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {requireApproval ? "Request my dashboard" : "Build my dashboard"}
        </button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </form>
    </div>
  );
}
