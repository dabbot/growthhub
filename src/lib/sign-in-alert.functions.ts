import { createServerFn } from "@tanstack/react-start";

function describeDevice(ua: string): string {
  if (!ua) return "Unknown";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "unknown OS";
  return `${browser} on ${os}`;
}

const fmt = (d: Date) =>
  d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

export const notifySignIn = createServerFn({ method: "POST" }).handler(async () => {
  const { requireTeamUser } = await import("./require-user.server");
  const user = await requireTeamUser();
  const { getRequest } = await import("@tanstack/react-start/server");
  const req = getRequest();
  const h = req?.headers;

  // Session id from the (already verified) token — one email per sign-in.
  let sessionId = "";
  try {
    const token = (h?.get("authorization") ?? "").slice(7);
    const payload = JSON.parse(Buffer.from(token.split(".")[1]!, "base64url").toString());
    sessionId = String(payload.session_id ?? "");
  } catch {
    /* ignore */
  }
  if (!sessionId) return { ok: false };

  let firstTime = false;
  let firstSeen: string | undefined;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (data.user?.created_at) {
      const created = new Date(data.user.created_at);
      firstSeen = fmt(created);
      firstTime = Date.now() - created.getTime() < 15 * 60 * 1000;
    }
  } catch {
    /* ignore */
  }

  const city = h?.get("cf-ipcity") ?? "";
  const country = h?.get("cf-ipcountry") ?? "";
  const ip = h?.get("cf-connecting-ip") ?? h?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

  // Optional: email the owner on every sign-in. Skipped when SIGN_IN_ALERT_EMAIL is not set.
  const alertTo = process.env["SIGN_IN_ALERT_EMAIL"];
  if (!alertTo) return { ok: true };
  const { sendTemplateEmail } = await import("./email-templates/send-email");
  try {
    await sendTemplateEmail("sign-in-alert", alertTo, {
      templateData: {
        email: user.email,
        time: fmt(new Date()),
        firstTime,
        firstSeen,
        location: [city, country].filter(Boolean).join(", ") || "Unknown",
        ip: ip || "Unknown",
        device: describeDevice(h?.get("user-agent") ?? ""),
      },
      idempotencyKey: `sign-in-alert-${sessionId}`,
    });
  } catch (e) {
    console.error("sign-in alert failed", e);
  }
  return { ok: true };
});
