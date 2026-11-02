import { createServerFn } from "@tanstack/react-start";
import { BRAND } from "./brand";
import { z } from "zod";
import type { AssignmentOverride } from "./agents";

export type AgentOutputRow = {
  id: string;
  assignment_key: string;
  agent_key: string;
  title: string;
  content: string;
  created_by: string | null;
  created_at: string;
};

export type DelegatedTask = { key: string; agent: string; title: string; brief: string; context: string; depth: number };
/** How many hand-off hops an automatic chain may take (CGO -> specialist -> next). */
export const MAX_HANDOFF_DEPTH = 2;

const Company = z.enum([BRAND.key]);

async function guard() {
  const { requireTeamUser } = await import("./require-user.server");
  return requireTeamUser();
}

export const getAgentWorkspace = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ company: Company }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    const { admin } = await import("./campaigns.server");
    const db = admin();
    const [ov, outs] = await Promise.all([
      db.from("agent_assignments")
        .select("assignment_key, agent_key, title, brief, context, removed")
        .eq("company", data.company),
      db.from("agent_outputs")
        .select("id, assignment_key, agent_key, title, content, created_by, created_at")
        .eq("company", data.company)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    if (ov.error) throw new Error(ov.error.message);
    if (outs.error) throw new Error(outs.error.message);
    return {
      overrides: (ov.data ?? []) as AssignmentOverride[],
      outputs: (outs.data ?? []) as AgentOutputRow[],
    };
  });

export const saveAssignment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      company: Company,
      key: z.string().min(1).max(80),
      agent: z.string().min(1).max(40),
      title: z.string().trim().min(1).max(160),
      brief: z.string().trim().min(1).max(3000),
      context: z.string().max(4000),
      removed: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await guard();
    const { admin } = await import("./campaigns.server");
    const { error } = await admin().from("agent_assignments").upsert(
      {
        company: data.company,
        assignment_key: data.key,
        agent_key: data.agent,
        title: data.title,
        brief: data.brief,
        context: data.context,
        removed: data.removed ?? false,
        updated_by: user.email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company,assignment_key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const resetAssignment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ company: Company, key: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    const { admin } = await import("./campaigns.server");
    const { error } = await admin()
      .from("agent_assignments")
      .delete()
      .eq("company", data.company)
      .eq("assignment_key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const runAssignment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      company: Company,
      key: z.string().min(1).max(80),
      agent: z.string().min(1).max(40),
      title: z.string().min(1).max(160),
      brief: z.string().min(1).max(3000),
      context: z.string().max(4000),
      depth: z.number().int().min(0).max(5).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await guard();
    const { runAgent } = await import("./agents.server");
    const content = await runAgent(data);
    const { admin } = await import("./campaigns.server");
    const { data: row, error } = await admin()
      .from("agent_outputs")
      .insert({
        company: data.company,
        assignment_key: data.key,
        agent_key: data.agent,
        title: data.title,
        content,
        created_by: user.email,
      })
      .select("id, assignment_key, agent_key, title, content, created_by, created_at")
      .single();
    if (error) throw new Error(error.message);

    const depth = data.depth ?? 0;
    const tasks: DelegatedTask[] = [];
    if (depth < MAX_HANDOFF_DEPTH) {
      const { delegateFrom } = await import("./agents.server");
      const found = await delegateFrom(data.company, data.agent, content);
      if (found.length) {
        const stamp = Date.now().toString(36);
        const fromName = (await import("./agents")).agentByKey(data.agent)?.name ?? data.agent;
        const rows = found.map((t, i) => ({
          company: data.company,
          assignment_key: `${t.agent}-from-${data.agent}-${stamp}-${i}`,
          agent_key: t.agent,
          title: t.title,
          brief: t.brief,
          context: `Assigned by the ${fromName} from "${data.title}". ${t.context}`.slice(0, 4000),
          removed: false,
          updated_by: user.email,
          updated_at: new Date().toISOString(),
        }));
        const { error: dErr } = await admin().from("agent_assignments").insert(rows);
        if (dErr) console.error("Saving delegated tasks failed:", dErr.message);
        else for (const r of rows) tasks.push({ key: r.assignment_key, agent: r.agent_key, title: r.title, brief: r.brief, context: r.context, depth: depth + 1 });
      }
    }
    return { ...(row as AgentOutputRow), delegated: tasks.length, tasks };
  });
