import { createServerFn } from "@tanstack/react-start";
import { CONNECTORS } from "./connectors";

export type ConnectionRow = {
  platform: string;
  account_label: string | null;
  status: string;
  connected_by: string | null;
  updated_at: string;
};

const cleanCompany = (v: unknown) => {
  const c = String(v ?? "").trim();
  if (!/^[a-z0-9-]{2,40}$/.test(c)) throw new Error("Which company?");
  return c;
};

export const listConnections = createServerFn({ method: "POST" })
  .inputValidator((d: { company: string }) => ({ company: cleanCompany(d?.company) }))
  .handler(async ({ data }): Promise<ConnectionRow[]> => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const { admin } = await import("./campaigns.server");
    const { data: rows, error } = await admin()
      .from("data_connections" as never)
      .select("platform, account_label, status, connected_by, updated_at")
      .eq("company", data.company);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ConnectionRow[];
  });

export const saveConnection = createServerFn({ method: "POST" })
  .inputValidator((d: { company: string; platform: string; credentials: Record<string, string> }) => {
    const company = cleanCompany(d?.company);
    const def = CONNECTORS.find((c) => c.id === d?.platform && !c.managedAt);
    if (!def) throw new Error("That platform can't be connected here.");
    const credentials: Record<string, string> = {};
    for (const f of def.fields) {
      const v = String(d?.credentials?.[f.key] ?? "").trim();
      if (!v) throw new Error(`${f.label} is needed.`);
      if (v.length > 8000) throw new Error(`${f.label} is too long.`);
      credentials[f.key] = v;
    }
    return { company, platform: def.id, credentials };
  })
  .handler(async ({ data }) => {
    const { requireTeamUser } = await import("./require-user.server");
    const user = await requireTeamUser();
    const { verifyConnector } = await import("./connectors.server");
    const result = await verifyConnector(data.platform, data.credentials);
    const { admin } = await import("./campaigns.server");
    const { error } = await admin()
      .from("data_connections" as never)
      .upsert({
        company: data.company,
        platform: data.platform,
        credentials: data.credentials,
        account_label: result.label,
        status: result.verified ? "connected" : "saved",
        last_error: null,
        connected_by: user.email,
        updated_at: new Date().toISOString(),
      } as never);
    if (error) throw new Error(error.message);
    return result;
  });

export const removeConnection = createServerFn({ method: "POST" })
  .inputValidator((d: { company: string; platform: string }) => ({
    company: cleanCompany(d?.company),
    platform: String(d?.platform ?? "").slice(0, 40),
  }))
  .handler(async ({ data }) => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const { admin } = await import("./campaigns.server");
    const { error } = await admin()
      .from("data_connections" as never)
      .delete()
      .eq("company", data.company)
      .eq("platform", data.platform);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
