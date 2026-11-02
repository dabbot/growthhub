import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analyst")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { question?: string; assumptions?: Record<string, number> };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response("Send a question.", { status: 400 });
        }

        const question = (body.question ?? "").trim();
        if (question.length < 5) {
          return new Response("Write a bit more about what you want to know.", { status: 400 });
        }
        if (question.length > 2000) {
          return new Response("That question is too long. Trim it down.", { status: 400 });
        }

        const { requireTeamUser } = await import("@/lib/require-user.server");
        try {
          await requireTeamUser();
        } catch (error) {
          return new Response((error as Error).message, { status: 401 });
        }


        const { aiBaseUrl, aiHeaders, aiKey } = await import("@/lib/ai.server");
        if (!aiKey()) return new Response("AI is not configured. Set AI_API_KEY.", { status: 500 });

        const { buildEvidencePack, analystRequestBody } = await import("@/lib/analyst.server");

        let pack: { text: string; assumptionNote: string };
        try {
          pack = await buildEvidencePack(body.assumptions ?? {});
        } catch (error) {
          return new Response((error as Error).message, { status: 500 });
        }

        let upstream: Response;
        try {
          upstream = await fetch(`${aiBaseUrl()}/responses`, {
            method: "POST",
            headers: aiHeaders(),
            body: JSON.stringify(
              analystRequestBody(question, pack.text, pack.assumptionNote),
            ),
            signal: request.signal,
          });
        } catch (error) {
          if ((error as Error).name === "AbortError") return new Response(null, { status: 499 });
          throw error;
        }

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text();
          console.error(`Analyst gateway failed [${upstream.status}]: ${text}`);
          const message =
            upstream.status === 402
              ? "The workspace is out of AI credits, so the analysis could not run."
              : upstream.status === 429
                ? "The model is busy right now. Try again in a moment."
                : `The analysis could not run [${upstream.status}].`;
          return new Response(message, { status: upstream.status });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
