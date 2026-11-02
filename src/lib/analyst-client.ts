export type Opportunity = {
  rank: number;
  title: string;
  segment: string;
  size_m: number;
  why_now: string;
  move: string;
  channel: string;
  effort: "low" | "medium" | "high";
  confidence: "high" | "medium" | "low";
  evidence: string;
  risk: string;
  success_metric: string;
};

export type Analysis = {
  read: string;
  opportunities: Opportunity[];
  assumptions_to_test: string[];
  what_would_change_this: string;
};

type Handlers = {
  onThinking: (text: string) => void;
  signal?: AbortSignal;
};

/**
 * Posts the question, reads the Server-Sent Events the model streams back,
 * surfaces its thinking as it arrives, and returns the finished analysis.
 */
export async function runAnalysis(
  question: string,
  assumptions: Record<string, number>,
  handlers: Handlers,
): Promise<Analysis> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const res = await fetch("/api/analyst", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ question, assumptions }),
    signal: handlers.signal ?? null,
  });

  if (!res.ok || !res.body) {
    throw new Error((await res.text()) || "The analysis could not run.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let thinking = "";

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
        let event: { type?: string; delta?: string; response?: { output_text?: string } };
        try {
          event = JSON.parse(payload);
        } catch {
          continue;
        }
        if (event.type === "response.output_text.delta" && event.delta) {
          answer += event.delta;
        } else if (event.type === "response.reasoning_summary_text.delta" && event.delta) {
          thinking += event.delta;
          handlers.onThinking(thinking);
        } else if (event.type === "response.completed" && event.response?.output_text) {
          answer = event.response.output_text;
        } else if (event.type === "error") {
          throw new Error("The model stopped before it finished. Try again.");
        }
      }
    }
  }

  if (!answer.trim()) {
    throw new Error(
      thinking.trim()
        ? "The model thought it through but returned no analysis. Try rephrasing the question."
        : "The model returned nothing. Try again.",
    );
  }

  try {
    return JSON.parse(answer) as Analysis;
  } catch {
    throw new Error("The analysis came back in an unreadable shape. Try again.");
  }
}
