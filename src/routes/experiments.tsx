import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { pageHead } from "@/components/dashboard/Meta";
import { useCompany } from "@/lib/company";
import { EXP_STORAGE, SEED_EXPERIMENTS, rice, type ExpStatus, type Experiment } from "@/lib/growth-os";
import { useLocal } from "@/lib/use-local";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/experiments")({
  head: () =>
    pageHead("Growth Experiments", "A scored backlog of growth tests, tracked from idea to won or killed."),
  component: ExperimentsPage,
});

const COLS: { key: ExpStatus; label: string }[] = [
  { key: "backlog", label: "Ideas" },
  { key: "prioritised", label: "Up next" },
  { key: "in_flight", label: "Running" },
  { key: "won", label: "Won" },
  { key: "killed", label: "Killed" },
];

function ExperimentsPage() {
  const { company } = useCompany();
  const [items, setItems] = useLocal<Experiment[]>(EXP_STORAGE(company), SEED_EXPERIMENTS[company]);
  const [draft, setDraft] = useState({ title: "", segment: "", channel: "", reach: 500, impact: 1, confidence: 50, effort: 2 });

  const update = (id: string, patch: Partial<Experiment>) =>
    setItems(items.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const ranked = [...items].sort((a, b) => rice(b) - rice(a));
  const won = items.filter((e) => e.status === "won").length;
  const done = won + items.filter((e) => e.status === "killed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        step="14 · Growth Experiments"
        title="What are we testing, and is it working?"
        question="Every idea scored by reach × impact × confidence ÷ effort, then tracked until it's won or killed."
        right={<p className="text-sm text-muted-foreground">Win rate <span className="tabular text-foreground">{done ? Math.round((won / done) * 100) : 0}%</span> of {done} finished</p>}
      />

      <Panel
        title="Add an idea"
        right={<DataBadge kind="derived" source="Score = reach (k/qtr) × impact × confidence ÷ person-weeks. Saved in this browser." />}
        soWhat="Scoring every idea the same way stops the loudest voice winning the roadmap."
      >
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.title.trim()) return;
            setItems([...items, { ...draft, id: crypto.randomUUID(), status: "backlog" }]);
            setDraft({ ...draft, title: "" });
          }}
        >
          <input className="rounded-md border border-border bg-card px-3 py-2 text-sm md:col-span-2" placeholder="Hypothesis, e.g. 'Early bill reminders lift repeat payments'" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <input className="rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="Customer group" value={draft.segment} onChange={(e) => setDraft({ ...draft, segment: e.target.value })} />
          <input className="rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="Channel" value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value })} />
          {(
            [
              ["reach", "Reach (k / quarter)", 10, 10000, 10],
              ["impact", "Impact (0.25–3)", 0.25, 3, 0.25],
              ["confidence", "Confidence %", 10, 100, 10],
              ["effort", "Effort (person-weeks)", 0.5, 12, 0.5],
            ] as const
          ).map(([k, label, min, max, step]) => (
            <label key={k} className="text-xs text-muted-foreground">
              {label}
              <input type="number" min={min} max={max} step={step} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground" />
            </label>
          ))}
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground md:col-span-4 md:justify-self-start">Add to backlog</button>
        </form>
      </Panel>

      <Panel title="Board" soWhat="Killed tests are as valuable as wins — they stop the team spending twice on the same wrong idea.">
        <div className="grid gap-3 lg:grid-cols-5">
          {COLS.map((col) => (
            <div key={col.key} className="rounded-lg bg-surface-2/60 p-2">
              <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {col.label} · {items.filter((e) => e.status === col.key).length}
              </p>
              <div className="space-y-2">
                {ranked.filter((e) => e.status === col.key).map((e) => (
                  <div key={e.id} className="rounded-md border border-border bg-card p-3">
                    <p className="text-sm leading-snug">{e.title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{e.segment} · {e.channel}</p>
                    <p className="tabular mt-1 text-xs text-primary">Score {Math.round(rice(e))}</p>
                    {e.status === "won" || e.status === "killed" ? (
                      <input
                        className="mt-2 w-full rounded border border-border bg-transparent px-2 py-1 text-[11px]"
                        placeholder="Result, e.g. +12% repeat pay"
                        value={e.result ?? ""}
                        onChange={(ev) => update(e.id, { result: ev.target.value })}
                      />
                    ) : null}
                    <div className="mt-2 flex items-center gap-1">
                      <select
                        value={e.status}
                        onChange={(ev) => update(e.id, { status: ev.target.value as ExpStatus })}
                        className="flex-1 rounded border border-border bg-card px-1 py-0.5 text-[11px]"
                        aria-label="Move to"
                      >
                        {COLS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                      <button onClick={() => setItems(items.filter((x) => x.id !== e.id))} className="px-1 text-[11px] text-muted-foreground hover:text-foreground" aria-label="Delete">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Priority ranking" soWhat="Top of this list is what the next sprint should pick up.">
        <ol className="space-y-1 text-sm">
          {ranked.filter((e) => e.status === "backlog" || e.status === "prioritised").map((e, i) => (
            <li key={e.id} className="flex justify-between gap-3 border-b border-border py-1.5">
              <span><span className="tabular mr-2 text-muted-foreground">{i + 1}.</span>{e.title}</span>
              <span className={cn("tabular shrink-0", i < 2 && "text-primary")}>{Math.round(rice(e))}</span>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
