import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/google-ads/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const denied = url.searchParams.get("error");
        const back = (status: string) =>
          new Response(null, {
            status: 302,
            headers: { Location: `/campaigns?google=${encodeURIComponent(status)}` },
          });

        if (denied) return back("cancelled");
        if (!code || !state) return back("cancelled");

        try {
          const { completeGoogleOAuth } = await import("@/lib/google-ads.server");
          await completeGoogleOAuth(code, state);
          return back("connected");
        } catch (e) {
          const message = e instanceof Error ? e.message : "Google sign-in failed.";
          return back(`failed:${message}`);
        }
      },
    },
  },
});
