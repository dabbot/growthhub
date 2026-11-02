import { createServerFn } from "@tanstack/react-start";
import { BRAND } from "./brand";

export type AppProfile = {
  name: string;
  owner: string;
  category: string;
  rating: string;
  reviews: string;
  downloads: string;
  gate: string;
  verdict: string;
  complaints: { theme: string; detail: string }[];
  praise: string[];
  opportunity: string;
  confidence: "high" | "medium" | "low";
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "owner",
    "category",
    "rating",
    "reviews",
    "downloads",
    "gate",
    "verdict",
    "complaints",
    "praise",
    "opportunity",
    "confidence",
  ],
  properties: {
    name: { type: "string" },
    owner: { type: "string", description: "Company behind the app, or 'Not known'." },
    category: { type: "string", description: "e.g. Credit card bill payment, Gold loan, UPI." },
    rating: { type: "string", description: "Play Store rating out of 5, or 'Not known'." },
    reviews: { type: "string", description: "Review count, e.g. 1.5M, or 'Not known'." },
    downloads: { type: "string", description: "Install band, e.g. 10M+, or 'Not known'." },
    gate: { type: "string", description: "Any eligibility gate to sign up, or 'Open to anyone'." },
    verdict: { type: "string", description: "Two sentences on how the listing reads." },
    complaints: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["theme", "detail"],
        properties: {
          theme: { type: "string" },
          detail: { type: "string", description: "What reviewers say, in one sentence." },
        },
      },
    },
    praise: { type: "array", items: { type: "string" } },
    opportunity: {
      type: "string",
      description: "What this app's unhappy users would switch for, in two sentences.",
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
} as const;

export const lookupApp = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; company?: string }) => {
    const name = String(data?.name ?? "").trim();
    if (name.length < 2) throw new Error("Type an app name first.");
    if (name.length > 80) throw new Error("That app name is too long.");
    return { name };
  })
  .handler(async ({ data }): Promise<AppProfile> => {
    const { aiBaseUrl, aiHeaders, aiKey, aiModel } = await import("./ai.server");
    if (!aiKey()) throw new Error("The assistant is not configured. Set AI_API_KEY.");

    const sector = BRAND.description;

    const res = await fetch(`${aiBaseUrl()}/responses`, {
      method: "POST",
      headers: aiHeaders(),
      body: JSON.stringify({
        model: aiModel(),
        stream: false,
        store: false,
        reasoning: { effort: "low" },
        text: {
          format: { type: "json_schema", name: "app_profile", strict: true, schema: SCHEMA },
        },
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You profile Indian consumer app listings for a growth team at " +
                  sector +
                  ". Report only what is publicly known about the app's Google Play listing and its review themes. " +
                  "Where you are not confident of a figure, write 'Not known' rather than guessing a number, and set confidence to low. " +
                  "Store figures move, so treat every number as approximate. Plain Indian business English, no jargon, no em dashes.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `App to profile: ${data.name}. Return json matching the schema. Give three to five review complaints and two to four things reviewers praise.`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Too many lookups just now. Try again in a minute.");
      if (res.status === 402) throw new Error("The AI workspace is out of credits.");
      throw new Error(`Lookup failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      output?: { type?: string; content?: { type?: string; text?: string }[] }[];
      output_text?: string;
    };
    const text =
      json.output_text ??
      json.output
        ?.flatMap((o) => o.content ?? [])
        .map((c) => c.text ?? "")
        .join("") ??
      "";
    if (!text) throw new Error("The lookup came back empty. Try the app's exact store name.");

    return JSON.parse(text) as AppProfile;
  });
