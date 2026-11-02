import { AGENTS, agentByKey, COMPANY_NAME, type AgentKey } from "./agents";
import { aiBaseUrl, aiHeaders, aiKey, aiModel } from "./ai.server";
import type { CompanyKey } from "./company";
import { admin } from "./campaigns.server";

async function evidence(): Promise<string> {
  const { buildEvidencePack } = await import("./analyst.server");
  const pack = await buildEvidencePack({});
  return pack.text.slice(0, 40000);
}

async function upstreamOutputs(company: CompanyKey, reads: AgentKey[]): Promise<string> {
  if (!reads.length) return "None — you work from the dashboard data only.";
  const { data } = await admin()
    .from("agent_outputs")
    .select("agent_key, title, content, created_at")
    .eq("company", company)
    .in("agent_key", reads)
    .order("created_at", { ascending: false })
    .limit(40);
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const row of data ?? []) {
    const k = `${row.agent_key}:${row.title}`;
    if (seen.has(k)) continue;
    seen.add(k);
    parts.push(
      `### From ${agentByKey(row.agent_key)?.name ?? row.agent_key} — ${row.title}\n${String(row.content).slice(0, 5000)}`,
    );
    if (parts.length >= 8) break;
  }
  return parts.length ? parts.join("\n\n") : "Those teammates have not produced anything yet — note any gaps this leaves.";
}

export async function runAgent(input: {
  company: CompanyKey;
  agent: string;
  title: string;
  brief: string;
  context: string;
}): Promise<string> {
  if (!aiKey()) throw new Error("AI is not configured. Set AI_API_KEY.");
  const agent = agentByKey(input.agent);
  if (!agent) throw new Error("Unknown agent.");
  const name = COMPANY_NAME[input.company];

  const [facts, handoffs] = await Promise.all([
    evidence(),
    upstreamOutputs(input.company, agent.reads),
  ]);

  const team = AGENTS.map((a) => `- ${a.name}: ${a.role}`).join("\n");
  const instructions = `You are the ${agent.name} in ${name}'s AI growth team. ${agent.mandate}
Team:
${team}

Write a finished, ready-to-execute deliverable in Markdown for the assignment. Rules:
- Start with a level-1 heading naming the deliverable, then a 3-line summary.
- Use the dashboard facts and teammates' outputs; cite the figure you use. Label anything you estimate as "(estimate)".
- Be concrete: named segments, numbers, copy, owners, dates relative to today, success metrics.
- Use tables and checklists where they help someone act.
- End with "## Next actions" as a checklist, and "## Hand-off" naming which agent picks up what.
- No preamble, no questions back. Plain Indian-English business tone, ₹ and Cr/lakh units.`;

  const prompt = `Assignment: ${input.title}
Brief: ${input.brief}
Extra context from the team: ${input.context.trim() || "None."}

## Teammates' latest outputs
${handoffs}

## Dashboard facts for ${name}
${facts}`;

  const res = await fetch(`${aiBaseUrl()}/responses`, {
    method: "POST",
    headers: aiHeaders(),
    body: JSON.stringify({
      model: aiModel(),
      instructions,
      input: prompt,
      reasoning: { effort: "low" },
      store: false,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    console.error(`Agent gateway failed [${res.status}]: ${text}`);
    if (res.status === 402) throw new Error("The workspace is out of AI credits, so the agent could not run.");
    if (res.status === 429) throw new Error("The model is busy right now. Try again in a moment.");
    throw new Error(`The agent could not run [${res.status}].`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload) as { type?: string; delta?: string; response?: { output_text?: string } };
          if (ev.type === "response.output_text.delta" && ev.delta) out += ev.delta;
          else if (ev.type === "response.completed" && ev.response?.output_text) out = ev.response.output_text;
          else if (ev.type === "error") throw new Error("The model stopped before it finished. Try again.");
        } catch (e) {
          if (e instanceof Error && e.message.startsWith("The model")) throw e;
        }
      }
    }
  }
  if (!out.trim()) throw new Error("The agent returned nothing. Try again.");
  return out.trim();
}

export type Delegation = { agent: string; title: string; brief: string; context: string };

/** Turns a CGO deliverable into concrete assignments for the specialist agents. */
export async function delegateFrom(company: CompanyKey, from: string, output: string): Promise<Delegation[]> {
  if (!aiKey()) return [];
  const me = agentByKey(from);
  if (!me) return [];
  const isCgo = from === "cgo";
  const specialists = AGENTS.filter((a) => a.key !== from && a.key !== "cgo");
  const team = specialists.map((a) => `- ${a.key}: ${a.name} — ${a.role}`).join("\n");
  const res = await fetch(`${aiBaseUrl()}/responses`, {
    method: "POST",
    headers: aiHeaders(),
    body: JSON.stringify({
      model: aiModel(),
      instructions: `You are the ${me.name} in ${COMPANY_NAME[company]}'s AI growth team, handing off work after finishing a deliverable. ${isCgo ? "Give each teammate 1-2 concrete assignments that execute your plan. Every teammate below must get at least one." : "Hand off 0-2 concrete follow-up assignments ONLY to teammates whose skills are needed to act on your deliverable (e.g. copy to Content & Creative, campaigns to Performance Marketing, tickets to the Sprint Master). Return an empty list if nothing needs handing off. Never hand work back that you just did."} Titles under 12 words. Briefs 2-4 sentences, specific, with targets from the plan. Context: the bet it serves, budget/target, deadline.\nSpecialists (use these keys exactly):\n${team}`,
      input: `My deliverable:\n${output.slice(0, 20000)}`,
      reasoning: { effort: "low" },
      store: false,
      stream: true,
      text: {
        format: {
          type: "json_schema",
          name: "delegation",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["assignments"],
            properties: {
              assignments: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["agent", "title", "brief", "context"],
                  properties: {
                    agent: { type: "string", enum: specialists.map((a) => a.key) },
                    title: { type: "string" },
                    brief: { type: "string" },
                    context: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    }),
  });
  if (!res.ok || !res.body) {
    console.error(`Delegation failed [${res.status}]: ${await res.text()}`);
    return [];
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const frames = buf.split("\n\n");
    buf = frames.pop() ?? "";
    for (const f of frames) for (const line of f.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const p = line.slice(5).trim();
      if (!p || p === "[DONE]") continue;
      try {
        const ev = JSON.parse(p) as { type?: string; delta?: string; response?: { output_text?: string } };
        if (ev.type === "response.output_text.delta" && ev.delta) out += ev.delta;
        else if (ev.type === "response.completed" && ev.response?.output_text) out = ev.response.output_text;
      } catch { /* ignore */ }
    }
  }
  try {
    const parsed = JSON.parse(out) as { assignments: Delegation[] };
    return parsed.assignments
      .filter((d) => agentByKey(d.agent) && d.agent !== "cgo" && d.agent !== from && d.title && d.brief)
      .slice(0, isCgo ? 14 : 2)
      .map((d) => ({
        agent: d.agent,
        title: d.title.slice(0, 160),
        brief: d.brief.slice(0, 3000),
        context: d.context.slice(0, 4000),
      }));
  } catch {
    console.error("Delegation parse failed");
    return [];
  }
}
