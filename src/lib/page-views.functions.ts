import { createServerFn } from "@tanstack/react-start";

export const logPageView = createServerFn({ method: "POST" })
  .inputValidator((data: { path: string; company?: string }) => ({
    path: String(data?.path ?? "").slice(0, 300),
    company: data?.company ? String(data.company).slice(0, 40) : null,
  }))
  .handler(async ({ data }) => {
    const { requireTeamUser } = await import("./require-user.server");
    const user = await requireTeamUser();
    const { admin } = await import("./campaigns.server");
    await admin().from("page_views").insert({
      user_id: user.id,
      email: user.email,
      path: data.path || "/",
      company: data.company,
    });
    return { ok: true };
  });
