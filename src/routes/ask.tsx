import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Brain, Loader2, Square } from "lucide-react";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import { useAssumptions } from "@/lib/assumptions";
import { runAnalysis, type Analysis } from "@/lib/analyst-client";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask the Map — Growth Dashboard" },
      {
        name: "description",
        content:
          "Describe a growth hypothesis and get a prioritised opportunity analysis built only from this dashboard's own numbers.",
      },
      { property: "og:title", content: "Ask the Map — Growth Dashboard" },
      {
        property: "og:description",
        content:
          "Put a growth question to the map and get ranked opportunities, each with the figures behind it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

const STARTERS = [
  "Where do we get the cheapest next million monthly actives?",
  "Is the 24M lapsed base worth a win-back push, or should we chase new prime cardholders?",
  "If HDFC and SBI penetration is already high, which issuer base should we go after next?",
  "We want to grow in tier 2 cities. What actually works there and what will it cost us?",
  "Should we spend on people who score 750+ but hold no credit card at all?",
];

function AskPage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const { values, changedCount } = useAssumptions();

  const [question, setQuestion] = useState("");
  const [thinking, setThinking] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [askedAbout, setAskedAbout] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function ask(text: string) {
    const q = text.trim();
    if (q.length < 5 || running) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setError(null);
    setAnalysis(null);
    setThinking("");
    setAskedAbout(q);
    try {
      const result = await runAnalysis(q, values, {
        onThinking: setThinking,
        signal: controller.signal,
      });
      setAnalysis(result);
    } catch (e) {
      if ((e as Error).name === "AbortError") setError("Stopped.");
      else setError((e as Error).message);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        step="12"
        title="Ask the Map"
        question="Describe a growth hypothesis or a question in your own words. It is answered only from the numbers in this tool — the headroom maths as you have the dials set, the issuer base, the personas, the targetability tiers, the plays and the ad audit — and comes back as a ranked list of opportunities with the figures behind each one."
      />

      <Panel
        title="Your question"
        eyebrow="Growth hypothesis"
        soWhat={
          changedCount > 0
            ? `Your ${changedCount} changed ${changedCount === 1 ? "assumption is" : "assumptions are"} passed in, so the answer matches the numbers you are looking at.`
            : "The answer is built on the default assumptions. Move the dials and ask again to see how the answer shifts."
        }
      >
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="For example: we think the lapsed base is our cheapest growth. Is it, and what would we actually run?"
          className="resize-none"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") ask(question);
          }}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button disabled={running || question.trim().length < 5} onClick={() => ask(question)}>
            {running ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Brain className="mr-2 size-4" />
            )}
            {running ? "Working through it…" : "Get the analysis"}
          </Button>
          {running ? (
            <Button variant="outline" onClick={() => abortRef.current?.abort()}>
              <Square className="mr-2 size-3" /> Stop
            </Button>
          ) : null}
          <span className="text-xs text-muted-foreground">
            It reads {data.personas.length} personas, {data.issuers.length} banks and every
            assumption before answering, so give it a minute.
          </span>
        </div>

        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Or start from one of these
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={running}
                onClick={() => {
                  setQuestion(s);
                  ask(s);
                }}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {error ? (
        <Panel title="That did not work" eyebrow="Error">
          <p className="text-sm text-modeled">{error}</p>
        </Panel>
      ) : null}

      {running || (thinking && !analysis) ? (
        <Panel title="Working it out" eyebrow="Thinking out loud">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {thinking || "Reading the headroom maths, the issuer base and the personas…"}
          </p>
        </Panel>
      ) : null}

      {analysis ? (
        <>
          <Panel
            title="The read"
            eyebrow={askedAbout}
            soWhat="Every figure quoted below comes from this tool's own tables, not from outside knowledge."
          >
            <p className="text-sm leading-relaxed">{analysis.read}</p>
          </Panel>

          <Panel
            title="Opportunities, most winnable first"
            eyebrow="Prioritised"
            soWhat="Ranked by winnable people per unit of effort, not by raw segment size."
          >
            <div className="space-y-4">
              {analysis.opportunities.map((o) => (
                <article key={o.rank} className="rounded-lg border border-border bg-surface-2/50 p-4">
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {o.rank}. {o.segment} · {o.channel}
                      </p>
                      <h3 className="font-display text-base font-semibold">{o.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide">
                      <span className="rounded-full border border-primary/40 px-2 py-0.5 text-primary">
                        {o.size_m}M reachable
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5",
                          o.effort === "low"
                            ? "border-reported/40 text-reported"
                            : o.effort === "high"
                              ? "border-modeled/40 text-modeled"
                              : "border-border text-muted-foreground",
                        )}
                      >
                        {o.effort} effort
                      </span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                        {o.confidence} confidence
                      </span>
                    </div>
                  </header>

                  <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                    <Line label="Why now">{o.why_now}</Line>
                    <Line label="The move">{o.move}</Line>
                    <Line label="What it rests on">{o.evidence}</Line>
                    <Line label="What could go wrong">{o.risk}</Line>
                    <Line label="How we would know it worked">{o.success_metric}</Line>
                  </dl>
                </article>
              ))}
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Test these before betting big" eyebrow="Assumptions">
              <ul className="space-y-2 text-sm">
                {analysis.assumptions_to_test.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="What would change this answer" eyebrow="Caveat">
              <p className="text-sm leading-relaxed">{analysis.what_would_change_this}</p>
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-foreground/90">{children}</dd>
    </div>
  );
}

function CompanyView() {
  return <AskPage />;
}
