import { createServerFn } from "@tanstack/react-start";

export type RoadmapStatusRow = {
  item_id: string;
  status: string;
  updated_at: string;
};

export const getRoadmapStatuses = createServerFn({ method: "GET" }).handler(
  async (): Promise<RoadmapStatusRow[]> => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const { admin } = await import("./campaigns.server");
    const { data, error } = await admin()
      .from("roadmap_status")
      .select("item_id, status, updated_at");
    if (error) throw new Error(error.message);
    return (data ?? []) as RoadmapStatusRow[];
  },
);

const ALLOWED = new Set(["not_started", "in_progress", "shipped"]);

export const setRoadmapStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { itemId: string; status: string }) => {
    const itemId = String(data?.itemId ?? "").trim();
    const status = String(data?.status ?? "").trim();
    if (!itemId || itemId.length > 80) throw new Error("Which item?");
    if (!ALLOWED.has(status)) throw new Error("That is not a valid status.");
    return { itemId, status };
  })
  .handler(async ({ data }) => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const { admin } = await import("./campaigns.server");
    const { error } = await admin()
      .from("roadmap_status")
      .upsert({
        item_id: data.itemId,
        status: data.status,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
