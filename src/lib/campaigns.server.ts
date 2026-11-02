import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { aiBaseUrl, aiHeaders, aiImageModel, aiModel } from "./ai.server";
import { BRAND } from "./brand";

export const CREATIVE_BUCKET = "campaign-creatives";

export function admin(): SupabaseClient {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Backend is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function writeCampaignCopy(prompt: string): Promise<unknown> {
  const res = await fetch(`${aiBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: aiHeaders(),
    body: JSON.stringify({
      model: aiModel(),
      reasoning_effort: "low",
      max_completion_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You are a performance marketer at ${BRAND.description}. ` +
            "You write ad campaigns for Google Ads and Meta. Be specific, never generic. " +
            "Never promise guaranteed results, never quote a reward amount or offer that was not given to you, " +
            "never name a competitor brand. Reply with JSON only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Campaign writer failed [${res.status}]: ${body}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("The campaign writer returned nothing. Try again.");
  return JSON.parse(text);
}

export async function renderCreative(prompt: string): Promise<string> {
  const res = await fetch(`${aiBaseUrl()}/images/generations`, {
    method: "POST",
    headers: aiHeaders(),
    body: JSON.stringify({ model: aiImageModel(), prompt, size: "1024x1024" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Creative generation failed [${res.status}]: ${body}`);
  }
  const json = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image came back from the creative generator.");
  return b64;
}

export function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export async function storeCreative(
  supabase: SupabaseClient,
  path: string,
  b64: string,
): Promise<string> {
  const { error } = await supabase.storage
    .from(CREATIVE_BUCKET)
    .upload(path, b64ToBytes(b64), { contentType: "image/png", upsert: true });
  if (error) throw new Error(`Could not save the creative: ${error.message}`);
  return path;
}

export async function signedCreativeUrls(
  supabase: SupabaseClient,
  paths: string[],
): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data } = await supabase.storage
    .from(CREATIVE_BUCKET)
    .createSignedUrls(paths, 60 * 60 * 12);
  return (data ?? []).map((d) => d.signedUrl ?? "").filter((u) => u.length > 0);
}

/* ------------------------------- Google Ads ------------------------------ */

export async function googleReady(): Promise<boolean> {
  const { googleStatus } = await import("./google-ads.server");
  return (await googleStatus()).connected;
}

async function googleMutate(path: string, body: unknown): Promise<unknown> {
  const { googleAdsPost } = await import("./google-ads.server");
  return googleAdsPost(path, body);
}

export type GoogleLaunchInput = {
  name: string;
  dailyBudgetInr: number;
  headlines: string[];
  descriptions: string[];
  keywords: string[];
  landingUrl: string;
  variants?: { angle?: string; headlines?: string[]; descriptions?: string[] }[];
};

export async function launchGoogleCampaign(input: GoogleLaunchInput): Promise<string> {
  const { getGoogleConnection } = await import("./google-ads.server");
  const conn = await getGoogleConnection();
  const customerId = (conn?.customer_id ?? "").replace(/-/g, "");
  if (!customerId) throw new Error("Pick a Google ad account first.");
  const micros = Math.round(input.dailyBudgetInr * 1_000_000);

  const budgetRes = (await googleMutate(`customers/${customerId}/campaignBudgets:mutate`, {
    operations: [
      {
        create: {
          name: `${input.name} budget ${Date.now()}`,
          amountMicros: String(micros),
          deliveryMethod: "STANDARD",
          explicitlyShared: false,
        },
      },
    ],
  })) as { results?: { resourceName?: string }[] };
  const budget = budgetRes.results?.[0]?.resourceName;
  if (!budget) throw new Error("Google Ads did not return a budget.");

  const campaignRes = (await googleMutate(`customers/${customerId}/campaigns:mutate`, {
    operations: [
      {
        create: {
          name: `${input.name} ${new Date().toISOString().slice(0, 10)}`,
          status: "PAUSED",
          advertisingChannelType: "SEARCH",
          manualCpc: {},
          campaignBudget: budget,
          networkSettings: {
            targetGoogleSearch: true,
            targetSearchNetwork: true,
            targetContentNetwork: false,
          },
        },
      },
    ],
  })) as { results?: { resourceName?: string }[] };
  const campaign = campaignRes.results?.[0]?.resourceName;
  if (!campaign) throw new Error("Google Ads did not return a campaign.");

  const groupRes = (await googleMutate(`customers/${customerId}/adGroups:mutate`, {
    operations: [
      {
        create: {
          name: `${input.name} ad group`,
          campaign,
          status: "ENABLED",
          type: "SEARCH_STANDARD",
          cpcBidMicros: String(Math.round(micros / 20)),
        },
      },
    ],
  })) as { results?: { resourceName?: string }[] };
  const adGroup = groupRes.results?.[0]?.resourceName;
  if (!adGroup) throw new Error("Google Ads did not return an ad group.");

  if (input.keywords.length > 0) {
    await googleMutate(`customers/${customerId}/adGroupCriteria:mutate`, {
      operations: input.keywords.slice(0, 20).map((kw) => ({
        create: {
          adGroup,
          status: "ENABLED",
          keyword: { text: kw, matchType: "PHRASE" },
        },
      })),
    });
  }

  const pickText = (list: string[] | undefined, pool: string[], min: number, cap: number) => {
    const out = [...(list ?? []), ...pool].map((t) => t.slice(0, cap));
    const unique = Array.from(new Set(out.filter(Boolean)));
    return unique.slice(0, Math.max(min, Math.min(unique.length, min + 2)));
  };

  const variants =
    input.variants && input.variants.length > 0
      ? input.variants
      : [{ headlines: input.headlines, descriptions: input.descriptions }];

  await googleMutate(`customers/${customerId}/adGroupAds:mutate`, {
    operations: variants.slice(0, 8).map((v) => ({
      create: {
        adGroup,
        status: "PAUSED",
        ad: {
          finalUrls: [input.landingUrl],
          responsiveSearchAd: {
            headlines: pickText(v.headlines, input.headlines, 3, 30).map((text) => ({ text })),
            descriptions: pickText(v.descriptions, input.descriptions, 2, 90).map((text) => ({
              text,
            })),
          },
        },
      },
    })),
  });

  return campaign;
}

/* ---------------------------------- Meta --------------------------------- */

const META_API = "https://graph.facebook.com/v21.0";

export type MetaConnection = {
  ad_account_id: string;
  access_token: string;
  page_id: string | null;
  account_name: string | null;
};

export async function metaGet(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ access_token: token, ...params });
  const res = await fetch(`${META_API}/${path}?${qs}`);
  const text = await res.text();
  if (!res.ok) throw new Error(`Meta [${res.status}]: ${text}`);
  return JSON.parse(text || "{}");
}

async function metaPost(path: string, token: string, body: Record<string, unknown>) {
  const form = new URLSearchParams({ access_token: token });
  for (const [k, v] of Object.entries(body)) {
    form.set(k, typeof v === "string" ? v : JSON.stringify(v));
  }
  const res = await fetch(`${META_API}/${path}`, { method: "POST", body: form });
  const text = await res.text();
  if (!res.ok) throw new Error(`Meta [${res.status}]: ${text}`);
  return JSON.parse(text || "{}") as Record<string, unknown>;
}

export type MetaLaunchInput = {
  name: string;
  dailyBudgetInr: number;
  primaryText: string;
  headline: string;
  description: string;
  landingUrl: string;
  imageB64: string | null;
  minAge: number;
  cities: string[];
  variants?: { angle?: string; primary_text?: string; headline?: string; description?: string }[];
};

export async function launchMetaCampaign(
  conn: MetaConnection,
  input: MetaLaunchInput,
): Promise<string> {
  const act = conn.ad_account_id.startsWith("act_")
    ? conn.ad_account_id
    : `act_${conn.ad_account_id}`;
  const token = conn.access_token;

  const campaign = await metaPost(`${act}/campaigns`, token, {
    name: input.name,
    objective: "OUTCOME_TRAFFIC",
    status: "PAUSED",
    special_ad_categories: ["FINANCIAL_PRODUCTS_SERVICES"],
  });
  const campaignId = String(campaign["id"] ?? "");
  if (!campaignId) throw new Error("Meta did not return a campaign.");

  const adSet = await metaPost(`${act}/adsets`, token, {
    name: `${input.name} ad set`,
    campaign_id: campaignId,
    status: "PAUSED",
    daily_budget: String(Math.round(input.dailyBudgetInr * 100)),
    billing_event: "IMPRESSIONS",
    optimization_goal: "LINK_CLICKS",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    targeting: {
      geo_locations: { countries: ["IN"] },
      age_min: input.minAge,
      age_max: 65,
      publisher_platforms: ["facebook", "instagram"],
    },
  });
  const adSetId = String(adSet["id"] ?? "");
  if (!adSetId) throw new Error("Meta did not return an ad set.");

  if (!conn.page_id) return campaignId;

  let imageHash: string | null = null;
  if (input.imageB64) {
    const upload = await metaPost(`${act}/adimages`, token, { bytes: input.imageB64 });
    const images = (upload["images"] ?? {}) as Record<string, { hash?: string }>;
    imageHash = Object.values(images)[0]?.hash ?? null;
  }

  const ads =
    input.variants && input.variants.length > 0
      ? input.variants.slice(0, 8)
      : [
          {
            angle: undefined,
            primary_text: input.primaryText,
            headline: input.headline,
            description: input.description,
          },
        ];

  for (const [i, v] of ads.entries()) {
    const label = v.angle ? `${input.name} — ${v.angle}` : `${input.name} ad ${i + 1}`;
    const creative = await metaPost(`${act}/adcreatives`, token, {
      name: `${label} creative`,
      object_story_spec: {
        page_id: conn.page_id,
        link_data: {
          message: v.primary_text || input.primaryText,
          link: input.landingUrl,
          name: v.headline || input.headline,
          description: v.description || input.description,
          call_to_action: { type: "LEARN_MORE", value: { link: input.landingUrl } },
          ...(imageHash ? { image_hash: imageHash } : {}),
        },
      },
      degrees_of_freedom_spec: {
        creative_features_spec: { standard_enhancements: { enroll_status: "OPT_OUT" } },
      },
    });
    const creativeId = String(creative["id"] ?? "");
    if (!creativeId) continue;
    await metaPost(`${act}/ads`, token, {
      name: label,
      adset_id: adSetId,
      status: "PAUSED",
      creative: { creative_id: creativeId },
    });
  }

  return campaignId;
}
