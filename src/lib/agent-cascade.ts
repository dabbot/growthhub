import { useSyncExternalStore } from "react";
import { agentByKey } from "./agents";
import type { CompanyKey } from "./company";
import { runAssignment, type DelegatedTask } from "./agents.functions";

/** Safety cap on automatic runs in one chain, to protect AI credits. */
export const MAX_AUTO_RUNS = 20;

type State = {
  running: boolean;
  current: string | null;
  done: number;
  queued: number;
  failed: number;
  log: string[];
};

let state: State = { running: false, current: null, done: 0, queued: 0, failed: 0, log: [] };
let queue: (DelegatedTask & { company: CompanyKey })[] = [];
let stopRequested = false;
let onChange: (() => void) | null = null;
const subs = new Set<() => void>();

const set = (p: Partial<State>) => {
  state = { ...state, ...p };
  subs.forEach((f) => f());
};

export function useCascade() {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => state,
    () => state,
  );
}

export function stopCascade() {
  stopRequested = true;
  queue = [];
  set({ queued: 0 });
}

/** Queue hand-offs and work through them one after another. */
export function enqueueHandoffs(company: CompanyKey, tasks: DelegatedTask[], refresh: () => void) {
  onChange = refresh;
  const room = MAX_AUTO_RUNS - state.done - queue.length - (state.running ? 1 : 0);
  const add = tasks.slice(0, Math.max(0, room)).map((t) => ({ ...t, company }));
  queue.push(...add);
  if (!state.running) {
    set({ done: 0, failed: 0, log: [] });
  }
  set({ queued: queue.length });
  if (!state.running) void pump();
}

async function pump() {
  stopRequested = false;
  set({ running: true });
  while (queue.length && !stopRequested) {
    const t = queue.shift()!;
    const name = agentByKey(t.agent)?.name ?? t.agent;
    set({ current: `${name}: ${t.title}`, queued: queue.length });
    try {
      const r = await runAssignment({
        data: { company: t.company, key: t.key, agent: t.agent, title: t.title, brief: t.brief, context: t.context, depth: t.depth },
      });
      set({ done: state.done + 1, log: [...state.log, `✓ ${name} — ${t.title}`] });
      if (!stopRequested && r.tasks.length) {
        const room = MAX_AUTO_RUNS - state.done - queue.length;
        queue.push(...r.tasks.slice(0, Math.max(0, room)).map((x) => ({ ...x, company: t.company })));
      }
    } catch (e) {
      const msg = (e as Error).message;
      set({ failed: state.failed + 1, log: [...state.log, `✗ ${name} — ${msg}`] });
      // Credits / busy errors: stop the whole chain rather than burn through it.
      if (/credits|busy|Sign in|session/i.test(msg)) { queue = []; }
    }
    onChange?.();
  }
  set({ running: false, current: null, queued: 0 });
  onChange?.();
}
