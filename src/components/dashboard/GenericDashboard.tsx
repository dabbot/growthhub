import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Clock, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useCompany } from "@/lib/company";
import { SECTIONS, type SectionContent } from "@/lib/sections";
import {
  advanceBuild,
  getCompanySections,
  rebuildCompany,
  removeCompany,
  resumeBuild,
} from "@/lib/onboarding.functions";
import { cn } from "@/lib/utils";

const BADGE: Record<string, string> = {
  reported: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  derived: "border-amber-500/40 text-amber-600 dark:text-amber-400",
  modelled: "border-fuchsia-500/40 text-fuchsia-600 dark:text-fuchsia-400",
};

/** Keeps the build moving while someone has the dashboard open. */
function useBuildDriver(companyId: string, active: boolean) {
  const advance = useServerFn(advanceBuild);
  const qc = useQueryClient();
  const [step, setStep] = useState<string | null>(null);
  const running = useRef(false);
  useEffect(() => {
    if (!active) return;
    let alive = true;
    const loop = async () => {
      if (running.current) return;
      running.current = true;
      while (alive) {
        try {
          const r = await advance({ data: { companyId } });
          if (!alive) break;
          setStep(r.build_step ?? null);
          void qc.invalidateQueries({ queryKey: ["sections", companyId] });
          if (r.build_status !== "queued" && r.build_status !== "building") {
            void qc.invalidateQueries({ queryKey: ["access"] });
            break;
          }
        } catch {
          break;
        }
        await new Promise((res) => setTimeout(res, 3000));
      }
      running.current = false;
    };
    void loop();
    return () => {
      alive = false;
    };
  }, [active, companyId, advance, qc]);
  return step;
}

export function GenericDashboard() {
  const { current } = useCompany();
  if (!current) return null;
  if (current.status === "pending") {
    return (
      <Notice icon={<Clock className="size-5 text-primary" />} title={`${current.name} is waiting for approval`}>
        An admin needs to approve this company before its dashboard is built. You will get an email when it is ready.
      </Notice>
    );
  }
  if (current.status === "rejected") {
    return <Notice title="This company was not approved">Ask the admin of this dashboard if you think this is a mistake.</Notice>;
  }
  return <BuiltDashboard />;
}

function Notice({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-border bg-card p-7 text-center">
      {icon ? <div className="flex justify-center">{icon}</div> : null}
      <h1 className="mt-3 font-display text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function BuiltDashboard() {
  const { current, companies, selectCompany } = useCompany();
  const c0 = current!;
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const fetchSections = useServerFn(getCompanySections);
  const rebuild = useServerFn(rebuildCompany);
  const resume = useServerFn(resumeBuild);
  const remove = useServerFn(removeCompany);
  const qc = useQueryClient();
  const building = c0.build_status === "queued" || c0.build_status === "building";
  const liveStep = useBuildDriver(c0.id, building);
  const { data: sections = [] } = useQuery({
    queryKey: ["sections", c0.id],
    queryFn: () => fetchSections({ data: { companyId: c0.id } }),
    refetchInterval: building ? 5000 : false,
  });
  useEffect(() => {
    if (!building) return;
    const t = setInterval(() => void qc.invalidateQueries({ queryKey: ["access"] }), 5000);
    return () => clearInterval(t);
  }, [building, qc]);
  const readyCount = sections.filter((s) => s.status === "ready").length;

  const def = SECTIONS.find((s) => s.path === path);
  const map = c0.section_map.find((m) => m.key === def?.key);
  const row = sections.find((s) => s.section_key === def?.key);
  const stopped = c0.build_status === "paused" || c0.build_status === "failed";

  const banner =
    building || stopped ? (
      <div className="mb-6 rounded-xl border-2 border-primary/60 bg-primary/10 p-4">
        <div className="flex items-center gap-3">
          {building ? <Loader2 className="size-5 animate-spin text-primary" /> : null}
          <div className="flex-1">
            <p className="font-display text-sm font-semibold">
              {building ? `Building ${c0.name}'s dashboard` : c0.build_status === "paused" ? "Build paused" : "Build stopped"}
            </p>
            <p className="text-xs text-muted-foreground">
              {stopped ? c0.build_error : liveStep ?? c0.build_step ?? "Starting…"}
              {sections.length ? ` · ${readyCount} of ${sections.length} sections ready` : ""}
              {building ? " · keep this tab open while it builds" : ""}
            </p>
          </div>
          {stopped ? (
            <button
              onClick={async () => {
                await resume({ data: { companyId: c0.id } });
                await qc.invalidateQueries({ queryKey: ["access"] });
              }}
              className="rounded-full border border-primary/40 px-3 py-1 text-xs text-primary"
            >
              Resume
            </button>
          ) : null}
        </div>
        {sections.length ? (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/15">
            <div className="h-full bg-primary transition-all" style={{ width: `${(readyCount / sections.length) * 100}%` }} />
          </div>
        ) : null}
      </div>
    ) : null;

  const footer = c0.isOwner ? (
    <div className="mt-12 flex justify-end border-t border-border pt-4">
      <button
        onClick={async () => {
          if (!window.confirm(`Remove ${c0.name} and everything generated for it?`)) return;
          await remove({ data: { companyId: c0.id } });
          const next = companies.find((x) => x.id !== c0.id);
          if (next) selectCompany(next.id);
          await qc.invalidateQueries({ queryKey: ["access"] });
          void navigate({ to: "/" });
        }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3" /> Remove this company
      </button>
    </div>
  ) : null;

  if (!def || (map && !map.include)) {
    return (
      <div className="mx-auto max-w-6xl">
        {banner}
        <p className="text-sm text-muted-foreground">This section does not apply to {c0.name}.</p>
      </div>
    );
  }

  const c: SectionContent | null = row?.status === "ready" ? row.content : null;

  return (
    <div className="mx-auto max-w-6xl">
      {banner}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-primary">
            {c0.name}
            {c0.sector ? ` · ${c0.sector}` : ""}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{map?.label ?? def.label}</h1>
          {c ? <p className="mt-2 max-w-3xl text-lg leading-snug">{c.headline}</p> : null}
        </div>
        {row && row.status !== "pending" ? (
          <button
            onClick={async () => {
              await rebuild({ data: { companyId: c0.id, sectionKey: def.key } });
              await qc.invalidateQueries({ queryKey: ["access"] });
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3" /> Rebuild section
          </button>
        ) : null}
      </div>

      {!c ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {row?.status === "failed"
            ? `This section could not be built: ${row.error}`
            : "This section is being built. It will appear here automatically."}
        </div>
      ) : (
        <>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{c.summary}</p>
          {c.metrics.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {c.metrics.map((m, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <span className={cn("rounded-full border px-1.5 text-[9px] uppercase tracking-wider", BADGE[m.badge])}>{m.badge}</span>
                  </div>
                  <p className="tabular mt-2 font-display text-2xl font-semibold">{m.value}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{m.note}</p>
                </div>
              ))}
            </div>
          ) : null}
          {c.table.rows.length ? (
            <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
              <p className="border-b border-border px-4 py-3 font-display text-sm font-semibold">{c.table.title}</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    {c.table.columns.map((h, i) => (
                      <th key={i} className="px-4 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.table.rows.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      {r.map((v, j) => (
                        <td key={j} className="px-4 py-2 align-top">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {c.bullets.length ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {c.bullets.map((b, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-display text-sm font-semibold">{b.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{b.detail}</p>
                </div>
              ))}
            </div>
          ) : null}
          <p className="mt-6 border-l-2 border-primary pl-3 text-sm">
            <span className="font-semibold">Why it matters: </span>
            {c.why_it_matters}
          </p>
        </>
      )}
      {footer}
    </div>
  );
}
