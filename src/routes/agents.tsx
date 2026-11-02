import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Download, FileText, Loader2, Play, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { DataBadge } from "@/components/dashboard/DataBadge";
import { pageHead } from "@/components/dashboard/Meta";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCompany, type CompanyKey } from "@/lib/company";
import { AGENTS, agentByKey, mergeAssignments, type AgentDef, type Assignment } from "@/lib/agents";
import {
  getAgentWorkspace,
  resetAssignment,
  runAssignment,
  saveAssignment,
  type AgentOutputRow,
} from "@/lib/agents.functions";
import { cn } from "@/lib/utils";
import { enqueueHandoffs, stopCascade, useCascade, MAX_AUTO_RUNS } from "@/lib/agent-cascade";

function CascadeBar() {
  const c = useCascade();
  if (!c.running && c.done === 0 && c.failed === 0) return null;
  return (
    <div className={cn(
      "sticky top-2 z-30 overflow-hidden rounded-xl border-2 border-primary bg-card p-4 text-sm shadow-[0_0_40px_-8px_var(--color-primary)]",
      c.running && "ring-4 ring-primary/25",
    )}>
      <div className="pointer-events-none absolute inset-0 bg-primary/10" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {c.running ? <Loader2 className="size-5 animate-spin" /> : <Bot className="size-5" />}
          </span>
          <span className="text-base font-semibold">
            {c.running ? "Team working automatically" : "Automatic run finished"}
          </span>
          <span className="text-muted-foreground">
            · {c.done} done{c.queued ? ` · ${c.queued} waiting` : ""}{c.failed ? ` · ${c.failed} failed` : ""}
          </span>
        </div>
        {c.running ? (
          <button onClick={stopCascade} className="relative rounded-full border border-destructive/60 bg-card px-4 py-1.5 text-xs font-medium hover:bg-destructive/10">
            Stop after this one
          </button>
        ) : null}
      </div>
      {(() => {
        const total = c.done + c.failed + c.queued + (c.running ? 1 : 0);
        const pct = total ? Math.round(((c.done + c.failed) / total) * 100) : 0;
        return (
          <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.max(pct, c.running ? 4 : 0)}%` }} />
          </div>
        );
      })()}
      {c.current ? <p className="relative mt-2 text-sm"><span className="font-medium text-primary">Now working:</span> {c.current}</p> : null}
      {c.log.length ? (
        <ul className="mt-2 max-h-28 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
          {c.log.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      ) : null}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Keep this tab open while the team works. Each chain stops after {MAX_AUTO_RUNS} runs to protect AI credits.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/agents")({
  head: () =>
    pageHead("Growth Agents", "An AI growth team — each agent owns assignments and produces ready-to-run growth documents."),
  component: AgentsPage,
});

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function downloadMd(o: AgentOutputRow) {
  const blob = new Blob([o.content], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${slug(o.title)}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function downloadPdf(o: AgentOutputRow) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = M;
  const clean = (s: string) =>
    s.replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]*)`/g, "$1").replace(/\[(.*?)\]\(.*?\)/g, "$1").replace(/₹/g, "Rs ");
  const write = (text: string, size: number, bold = false, indent = 0, gap = 4) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(clean(text), W - M * 2 - indent) as string[];
    for (const l of lines) {
      if (y > H - M) {
        doc.addPage();
        y = M;
      }
      doc.text(l, M + indent, y);
      y += size * 1.35;
    }
    y += gap;
  };
  for (const raw of o.content.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) { y += 4; continue; }
    if (/^\|?\s*:?-{3,}/.test(line)) continue;
    if (line.startsWith("# ")) write(line.slice(2), 18, true, 0, 8);
    else if (line.startsWith("## ")) write(line.slice(3), 14, true, 0, 6);
    else if (line.startsWith("### ")) write(line.slice(4), 12, true, 0, 4);
    else if (/^\s*[-*]\s+\[( |x)\]/i.test(line)) write("[ ] " + line.replace(/^\s*[-*]\s+\[( |x)\]\s*/i, ""), 10, false, 12, 2);
    else if (/^\s*[-*]\s+/.test(line)) write("• " + line.replace(/^\s*[-*]\s+/, ""), 10, false, 12, 2);
    else if (line.startsWith("|")) write(line.split("|").map((c) => c.trim()).filter(Boolean).join("  ·  "), 9, false, 0, 2);
    else write(line, 10);
  }
  doc.save(`${slug(o.title)}.pdf`);
}

function AgentsPage() {
  const { company } = useCompany();
  const qc = useQueryClient();
  const [open, setOpen] = useState<AgentDef | null>(null);
  const [preview, setPreview] = useState<AgentOutputRow | null>(null);
  const q = useQuery({
    queryKey: ["agents", company],
    queryFn: () => getAgentWorkspace({ data: { company } }),
  });
  const assignments = useMemo(() => mergeAssignments(company, q.data?.overrides ?? []), [company, q.data]);
  const outputs = q.data?.outputs ?? [];
  const cgo = AGENTS[0]!;
  const reports = AGENTS.filter((a) => a.reportsTo === "cgo");

  const card = (a: AgentDef) => {
    const mine = assignments.filter((x) => x.agent === a.key);
    const done = mine.filter((x) => outputs.some((o) => o.assignment_key === x.key)).length;
    const last = outputs.find((o) => o.agent_key === a.key);
    return (
      <button
        key={a.key}
        onClick={() => setOpen(a)}
        className="panel w-full p-4 text-left transition-colors hover:border-primary/60"
      >
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary">
            <Bot className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{a.name}</p>
            <p className="truncate text-xs text-muted-foreground">{a.role}</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded bg-surface-2">
          <div className="h-full rounded bg-primary" style={{ width: `${mine.length ? (done / mine.length) * 100 : 0}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          <span className="tabular text-foreground">{done}/{mine.length}</span> assignments delivered
          {last ? ` · last ${fmt(last.created_at)}` : ""}
        </p>
      </button>
    );
  };

  const total = assignments.length;
  const delivered = assignments.filter((x) => outputs.some((o) => o.assignment_key === x.key)).length;
  const weekAgo = Date.now() - 7 * 864e5;
  const runsWeek = outputs.filter((o) => new Date(o.created_at).getTime() > weekAgo).length;
  const idle = AGENTS.filter((a) => !outputs.some((o) => o.agent_key === a.key)).length;
  const pct = total ? Math.round((delivered / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <CascadeBar />
      <PageHeader
        step="18 · Growth Agents"
        title="Your AI growth team"
        question="Each agent owns a set of assignments. Tap an agent to tune its briefs, run it, and download what it produces as a PDF or Markdown file."
      />

      <Panel
        title="Org progress"
        right={<DataBadge kind="derived" source="Counted from saved agent runs for this company." />}
        soWhat={
          idle
            ? `${idle} agent${idle > 1 ? "s have" : " has"} never run — the CGO and Sprint Master plan better once every specialist has delivered.`
            : "Every agent has delivered at least once — re-run the CGO and Sprint Master weekly to keep the plan current."
        }
      >
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ["Assignments delivered", `${delivered}/${total}`],
            ["Overall progress", `${pct}%`],
            ["Runs in last 7 days", String(runsWeek)],
            ["Agents not yet run", String(idle)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-border p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</p>
              <p className="tabular mt-1 text-2xl font-semibold">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 h-2 rounded bg-surface-2">
          <div className="h-full rounded bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </Panel>

      <Panel title="All agents & latest output" soWhat="One glance at who has delivered what, and the freshest document to act on from each agent.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">Agent</th>
                <th className="py-2 pr-3">Progress</th>
                <th className="py-2 pr-3">Latest output</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {AGENTS.map((a) => {
                const mine = assignments.filter((x) => x.agent === a.key);
                const done = mine.filter((x) => outputs.some((o) => o.assignment_key === x.key)).length;
                const last = outputs.find((o) => o.agent_key === a.key);
                return (
                  <tr key={a.key}>
                    <td className="py-2 pr-3">
                      <button onClick={() => setOpen(a)} className="text-left hover:text-primary">
                        <span className="font-medium">{a.name}</span>
                        <span className="block text-xs text-muted-foreground">{a.role}</span>
                      </button>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded bg-surface-2">
                          <div className="h-full rounded bg-primary" style={{ width: `${mine.length ? (done / mine.length) * 100 : 0}%` }} />
                        </div>
                        <span className="tabular text-xs">{done}/{mine.length}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      {last ? (
                        <button onClick={() => setPreview(last)} className="text-left hover:text-primary">
                          {last.title}
                          <span className="block text-xs text-muted-foreground">{fmt(last.created_at)}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not run yet</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {last ? (
                        <span className="inline-flex gap-2">
                          <FileBtn onClick={() => downloadMd(last)} label=".md" />
                          <FileBtn onClick={() => void downloadPdf(last)} label=".pdf" />
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={preview !== null} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {preview ? (
            <>
              <DialogHeader>
                <DialogTitle>{preview.title}</DialogTitle>
                <DialogDescription>
                  {agentByKey(preview.agent_key)?.name} · {fmt(preview.created_at)}
                </DialogDescription>
              </DialogHeader>
              <div className="md-out text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview.content}</ReactMarkdown>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Panel
        title="Org chart"
        right={<DataBadge kind="modeled" source="Agent outputs are AI-written from this dashboard's data and teammates' outputs." />}
        soWhat="Agents hand work to each other: the Chief Growth Officer reads every specialist's latest output, and the Sprint Master turns it all into a sprint. Run specialists first, then the CGO, then the Sprint Master."
      >
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading the team…</p>
        ) : q.error ? (
          <p className="text-sm text-destructive">{(q.error as Error).message}</p>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-xs">{card(cgo)}</div>
            <div className="h-6 w-px bg-border" />
            <div className="hidden h-px w-[calc(100%-12rem)] bg-border lg:block" />
            <div className="grid w-full gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
              {reports.map((a) => (
                <div key={a.key} className="relative">
                  <span className="absolute -top-4 left-1/2 hidden h-4 w-px bg-border lg:block" />
                  {card(a)}
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Latest deliverables" soWhat="Every run is saved for the whole team, so anyone can pick up the latest plan and act on it.">
        {outputs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet — open an agent and run an assignment.</p>
        ) : (
          <ul className="divide-y divide-border">
            {outputs.slice(0, 10).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-medium">{o.title}</span>{" "}
                  <span className="text-xs text-muted-foreground">
                    · {agentByKey(o.agent_key)?.name} · {fmt(o.created_at)}{o.created_by ? ` · ${o.created_by}` : ""}
                  </span>
                </span>
                <span className="flex gap-2">
                  <FileBtn onClick={() => downloadMd(o)} label=".md" />
                  <FileBtn onClick={() => void downloadPdf(o)} label=".pdf" />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          {open ? (
            <AgentDetail
              agent={open}
              company={company}
              assignments={assignments.filter((a) => a.agent === open.key)}
              outputs={outputs}
              refresh={() => qc.invalidateQueries({ queryKey: ["agents", company] })}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FileBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs hover:border-primary/50">
      <Download className="size-3" />
      {label}
    </button>
  );
}

function AgentDetail({
  agent,
  company,
  assignments,
  outputs,
  refresh,
}: {
  agent: AgentDef;
  company: CompanyKey;
  assignments: Assignment[];
  outputs: AgentOutputRow[];
  refresh: () => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <>
      <DialogHeader>
        <DialogTitle>{agent.name}</DialogTitle>
        <DialogDescription>{agent.mandate}</DialogDescription>
      </DialogHeader>
      {agent.reads.length ? (
        <p className="text-xs text-muted-foreground">
          Reads the latest work of: {agent.reads.map((k) => agentByKey(k)?.name).join(", ")}
        </p>
      ) : null}
      <div className="space-y-4">
        {assignments.map((a) => (
          <AssignmentCard
            key={a.key}
            a={a}
            company={company}
            outputs={outputs.filter((o) => o.assignment_key === a.key)}
            refresh={refresh}
          />
        ))}
        {adding ? (
          <AssignmentCard
            a={{ key: `${agent.key}-custom-${Date.now().toString(36)}`, agent: agent.key, title: "", brief: "", context: "", custom: true }}
            company={company}
            outputs={[]}
            refresh={() => { setAdding(false); refresh(); }}
            startEditing
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-4" /> Add an assignment
          </button>
        )}
      </div>
    </>
  );
}

function AssignmentCard({
  a,
  company,
  outputs,
  refresh,
  startEditing = false,
}: {
  a: Assignment;
  company: CompanyKey;
  outputs: AgentOutputRow[];
  refresh: () => void;
  startEditing?: boolean;
}) {
  const [editing, setEditing] = useState(startEditing);
  const [title, setTitle] = useState(a.title);
  const [brief, setBrief] = useState(a.brief);
  const [context, setContext] = useState(a.context);
  const [showOut, setShowOut] = useState(false);
  const [version, setVersion] = useState(0);
  const latest = outputs[version];

  const save = useMutation({
    mutationFn: (removed?: boolean) =>
      saveAssignment({ data: { company, key: a.key, agent: a.agent, title, brief, context, removed } }),
    onSuccess: () => { setEditing(false); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const reset = useMutation({
    mutationFn: () => resetAssignment({ data: { company, key: a.key } }),
    onSuccess: refresh,
    onError: (e) => toast.error((e as Error).message),
  });
  const run = useMutation({
    mutationFn: () =>
      runAssignment({ data: { company, key: a.key, agent: a.agent, title: title || a.title, brief: brief || a.brief, context } }),
    onSuccess: (r) => {
      setVersion(0);
      setShowOut(true);
      toast.success(
        r.delegated
          ? `Deliverable ready — handed ${r.delegated} tasks to teammates, who are starting now`
          : "Deliverable ready",
      );
      refresh();
      if (r.tasks.length) enqueueHandoffs(company, r.tasks, refresh);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="rounded-lg border border-border p-4">
      {editing ? (
        <div className="space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-medium" />
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} placeholder="What should the agent produce?"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
          <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3}
            placeholder="Your context: targets, budget, constraints, launches, what to avoid…"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button disabled={!title.trim() || !brief.trim() || save.isPending} onClick={() => save.mutate(undefined)}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
              <Save className="size-3.5" /> Save
            </button>
            <button onClick={() => { setEditing(false); setTitle(a.title); setBrief(a.brief); setContext(a.context); if (startEditing) refresh(); }}
              className="rounded-md border border-border px-3 py-1.5 text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{a.title}{a.custom ? <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">custom</span> : null}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.brief}</p>
              {a.context ? <p className="mt-1 text-xs"><span className="text-primary">Your context:</span> {a.context}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => run.mutate()} disabled={run.isPending}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60">
                {run.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                {run.isPending ? "Working…" : outputs.length ? "Run again" : "Run"}
              </button>
              <button onClick={() => setEditing(true)} className="rounded-md border border-border px-3 py-1.5 text-xs">Edit</button>
              {a.custom ? (
                <button onClick={() => save.mutate(true)} aria-label="Remove" className="rounded-md border border-border px-2 py-1.5 text-xs"><Trash2 className="size-3.5" /></button>
              ) : (
                <button onClick={() => reset.mutate()} aria-label="Reset to default" title="Reset to default" className="rounded-md border border-border px-2 py-1.5 text-xs"><RotateCcw className="size-3.5" /></button>
              )}
            </div>
          </div>
          {run.isPending ? <p className="mt-2 text-xs text-muted-foreground">The agent is reading the data and teammates' work — usually under a minute.</p> : null}
          {latest ? (
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button onClick={() => setShowOut(!showOut)} className="flex items-center gap-1 text-xs text-primary">
                  <FileText className="size-3.5" /> {showOut ? "Hide" : "View"} output · {fmt(latest.created_at)}
                </button>
                <div className="flex items-center gap-2">
                  {outputs.length > 1 ? (
                    <select value={version} onChange={(e) => setVersion(Number(e.target.value))}
                      className="rounded-md border border-border bg-card px-2 py-0.5 text-xs">
                      {outputs.map((o, i) => <option key={o.id} value={i}>{i === 0 ? "Latest" : fmt(o.created_at)}</option>)}
                    </select>
                  ) : null}
                  <FileBtn onClick={() => downloadMd(latest)} label=".md" />
                  <FileBtn onClick={() => void downloadPdf(latest)} label=".pdf" />
                </div>
              </div>
              {showOut ? (
                <div className={cn("md-out mt-3 max-h-[50vh] overflow-y-auto rounded-md bg-surface-2/60 p-4 text-sm")}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{latest.content}</ReactMarkdown>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
