import { createServerFn } from "@tanstack/react-start";

export type AdVariant = {
  angle?: string;
  headlines?: string[];
  descriptions?: string[];
  primary_text?: string;
  headline?: string;
  description?: string;
};

export type CampaignRow = {
  id: string;
  platform: "google" | "meta";
  persona_key: string | null;
  play_key: string | null;
  name: string;
  objective: string;
  audience_note: string | null;
  targeting: { min_age?: number; interests?: string[]; city_tier?: string; negative_keywords?: string[] };
  daily_budget_inr: number;
  headlines: string[];
  descriptions: string[];
  keywords: string[];
  primary_texts: string[];
  ad_variants: AdVariant[];
  creative_brief: string | null;
  image_paths: string[];
  landing_url: string;
  status: string;
  external_id: string | null;
  external_status: string | null;
  launch_log: string | null;
  created_at: string;
};

export type CampaignWorkspace = {
  campaigns: (CampaignRow & { image_urls: string[] })[];
  google: {
    configured: boolean;
    signedIn: boolean;
    connected: boolean;
    email: string | null;
    customerId: string | null;
    accountName: string | null;
    hasDeveloperToken: boolean;
  };
  meta: { connected: boolean; accountId: string | null; accountName: string | null; hasPage: boolean };
};

export const getCampaignWorkspace = createServerFn({ method: "GET" }).handler(
  async (): Promise<CampaignWorkspace> => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const { admin, signedCreativeUrls } = await import("./campaigns.server");
    const { googleStatus } = await import("./google-ads.server");
    const supabase = admin();

    const [{ data: rows }, { data: meta }, google] = await Promise.all([
      supabase
        .from("generated_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase.from("meta_connection").select("ad_account_id, account_name, page_id").maybeSingle(),
      googleStatus(),
    ]);

    const campaigns = await Promise.all(
      ((rows ?? []) as CampaignRow[]).map(async (r) => ({
        ...r,
        image_urls: await signedCreativeUrls(supabase, r.image_paths ?? []),
      })),
    );

    return {
      campaigns,
      google,
      meta: {
        connected: Boolean(meta),
        accountId: meta?.ad_account_id ?? null,
        accountName: meta?.account_name ?? null,
        hasPage: Boolean(meta?.page_id),
      },
    };
  },
);

/* ---------------------------- Meta connection ---------------------------- */

export const connectMeta = createServerFn({ method: "POST" })
  .inputValidator((data: { adAccountId: string; accessToken: string; pageId?: string }) => {
    if (!data?.adAccountId?.trim()) throw new Error("Enter your Meta ad account ID.");
    if (!data?.accessToken?.trim()) throw new Error("Enter a Meta access token.");
    return data;
  })
  .handler(async ({ data }) => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const { admin, metaGet } = await import("./campaigns.server");
    const act = data.adAccountId.trim().startsWith("act_")
      ? data.adAccountId.trim()
      : `act_${data.adAccountId.trim().replace(/\D/g, "")}`;

    const account = (await metaGet(act, data.accessToken.trim(), {
      fields: "name,account_status,currency",
    })) as { name?: string };

    const supabase = admin();
    const { error } = await supabase.from("meta_connection").upsert({
      key: "default",
      ad_account_id: act,
      access_token: data.accessToken.trim(),
      page_id: data.pageId?.trim() || null,
      account_name: account.name ?? act,
      connected_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { accountName: account.name ?? act };
  });

export const disconnectMeta = createServerFn({ method: "POST" }).handler(async () => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
  const { admin } = await import("./campaigns.server");
  await admin().from("meta_connection").delete().eq("key", "default");
  return { ok: true };
});

/* ------------------------------- Generation ------------------------------ */

type Draft = {
  google: {
    name: string;
    headlines: string[];
    descriptions: string[];
    keywords: string[];
    negative_keywords?: string[];
    ads?: { angle: string; headlines: string[]; descriptions: string[] }[];
  };
  meta: {
    name: string;
    primary_texts: string[];
    headlines: string[];
    descriptions: string[];
    audience: string;
    min_age?: number;
    interests?: string[];
    ads?: { angle: string; primary_text: string; headline: string; description: string }[];
  };
  creative_brief: string;
  objective: string;
};

export const generateCampaigns = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      personaSlug: string;
      playSlug: string;
      dailyBudgetInr: number;
      landingUrl: string;
      withImage: boolean;
    }) => {
      if (!data?.personaSlug) throw new Error("Pick an audience first.");
      if (!data?.playSlug) throw new Error("Pick a play first.");
      return data;
    },
  )
  .handler(async ({ data }) => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const { admin, writeCampaignCopy, renderCreative, storeCreative } = await import(
      "./campaigns.server"
    );
    const supabase = admin();

    const [{ data: persona }, { data: play }] = await Promise.all([
      supabase.from("personas").select("*").eq("slug", data.personaSlug).maybeSingle(),
      supabase.from("plays").select("*").eq("slug", data.playSlug).maybeSingle(),
    ]);
    if (!persona || !play) throw new Error("That audience or play no longer exists.");

    const prompt = `Write one Google Search campaign and one Meta campaign for Acme.

AUDIENCE
Name: ${persona.name}
Who they are: ${persona.who}
Size: ${persona.size_m}M people
Cards they hold: ${persona.primary_issuers}, ${persona.cards_held} cards each
City tier: ${persona.city_tier}
Typical monthly card spend: ${persona.typical_spend}
Relationship with Acme today: ${persona.brand_status} (${persona.penetration_pct}% already on Acme)
What they want: ${persona.wants}
Where they are reachable: ${persona.channels}
Message that works: ${persona.message}
Hooks: ${persona.hooks}

THE PLAY
${play.name} — ${play.rationale}
Lever: ${play.lever}. Channel: ${play.channel}. Segment: ${play.segment}.

RULES
- Google headlines: 12 of them, max 30 characters each, no truncation, no ellipsis.
- Google descriptions: 4 of them, max 90 characters each.
- Google keywords: 15 phrase-match search terms an Indian user would actually type.
- Meta primary texts: 3 of them, 90 to 180 characters, first line must hook.
- google.ads: EIGHT distinct ready-to-run search ads. Each has "angle" (2-4 words naming the
  distinct idea, e.g. "Missed due date"), 3 headlines (max 30 chars each) and 2 descriptions
  (max 90 chars each). Every ad must argue a genuinely different reason to join, not a reword.
- meta.ads: EIGHT distinct ready-to-run feed ads. Each has "angle", "primary_text"
  (90-180 chars), "headline" (max 40 chars), "description" (max 30 chars). Vary the format
  across them: proof, question, number, story, contrast, social proof, warning, invitation.
- Meta headlines: 3, max 40 characters. Meta descriptions: 2, max 30 characters.
- Indian English. Rupee amounts only if the play names one. No competitor names.
- No guaranteed returns, no fake urgency, no invented reward amounts.
- creative_brief: one paragraph describing a single still image in the brand's style — clean
  background, one accent colour, one clear subject, generous negative space, no text.

Reply as JSON exactly:
{"objective":"one line","creative_brief":"...","google":{"name":"...","headlines":[],"descriptions":[],"keywords":[],"negative_keywords":[],"ads":[{"angle":"...","headlines":["","",""],"descriptions":["",""]}]},"meta":{"name":"...","primary_texts":[],"headlines":[],"descriptions":[],"audience":"one line describing who to target","min_age":25,"interests":[],"ads":[{"angle":"...","primary_text":"...","headline":"...","description":"..."}]}}`;

    const draft = (await writeCampaignCopy(prompt)) as Draft;

    let imagePath: string | null = null;
    if (data.withImage && draft.creative_brief) {
      const b64 = await renderCreative(
        `${draft.creative_brief}\n\nPremium fintech advertising still, photographic, square, no text, no logos, no watermarks, clean background with a single accent colour.`,
      );
      imagePath = await storeCreative(
        supabase,
        `${data.personaSlug}/${Date.now()}.png`,
        b64,
      );
    }

    const base = {
      persona_key: data.personaSlug,
      play_key: data.playSlug,
      objective: draft.objective ?? play.name,
      audience_note: draft.meta?.audience ?? persona.who,
      daily_budget_inr: data.dailyBudgetInr,
      landing_url: data.landingUrl || "https://example.com",
      creative_brief: draft.creative_brief ?? null,
      status: "draft",
    };

    const { data: inserted, error } = await supabase
      .from("generated_campaigns")
      .insert([
        {
          ...base,
          platform: "google",
          name: draft.google?.name ?? `${persona.name} — search`,
          headlines: draft.google?.headlines ?? [],
          descriptions: draft.google?.descriptions ?? [],
          keywords: draft.google?.keywords ?? [],
          primary_texts: [],
          image_paths: [],
          targeting: { negative_keywords: draft.google?.negative_keywords ?? [] },
          ad_variants: (draft.google?.ads ?? []).slice(0, 8),
        },
        {
          ...base,
          platform: "meta",
          name: draft.meta?.name ?? `${persona.name} — feed`,
          headlines: draft.meta?.headlines ?? [],
          descriptions: draft.meta?.descriptions ?? [],
          keywords: [],
          primary_texts: draft.meta?.primary_texts ?? [],
          image_paths: imagePath ? [imagePath] : [],
          targeting: {
            min_age: draft.meta?.min_age ?? 25,
            interests: draft.meta?.interests ?? [],
            city_tier: persona.city_tier,
          },
          ad_variants: (draft.meta?.ads ?? []).slice(0, 8),
        },
      ])
      .select("id");
    if (error) throw new Error(error.message);
    return { created: inserted?.length ?? 0 };
  });

/* --------------------------------- Launch -------------------------------- */

export const launchCampaign = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => {
    if (!data?.id) throw new Error("Which campaign?");
    return data;
  })
  .handler(async ({ data }) => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const {
      admin,
      launchGoogleCampaign,
      launchMetaCampaign,
      CREATIVE_BUCKET,
    } = await import("./campaigns.server");
    const supabase = admin();

    const { data: row } = await supabase
      .from("generated_campaigns")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("That campaign no longer exists.");
    if (row.status === "launched") throw new Error("This one is already in the ad account.");

    let externalId = "";
    if (row.platform === "google") {
      const { googleStatus } = await import("./google-ads.server");
      if (!(await googleStatus()).connected) {
        throw new Error(
          "Google Ads is not connected yet. Sign in with Google and pick an ad account on the Run Campaigns page first.",
        );
      }
      externalId = await launchGoogleCampaign({
        name: row.name,
        dailyBudgetInr: Number(row.daily_budget_inr),
        headlines: row.headlines ?? [],
        descriptions: row.descriptions ?? [],
        keywords: row.keywords ?? [],
        landingUrl: row.landing_url,
        variants: (row.ad_variants ?? []) as AdVariant[],
      });
    } else {
      const { data: conn } = await supabase.from("meta_connection").select("*").maybeSingle();
      if (!conn) throw new Error("Connect your Meta ad account first.");

      let imageB64: string | null = null;
      const path = (row.image_paths ?? [])[0];
      if (path) {
        const { data: file } = await supabase.storage.from(CREATIVE_BUCKET).download(path);
        if (file) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          let bin = "";
          for (const b of bytes) bin += String.fromCharCode(b);
          imageB64 = btoa(bin);
        }
      }

      externalId = await launchMetaCampaign(
        {
          ad_account_id: conn.ad_account_id,
          access_token: conn.access_token,
          page_id: conn.page_id,
          account_name: conn.account_name,
        },
        {
          name: row.name,
          dailyBudgetInr: Number(row.daily_budget_inr),
          primaryText: (row.primary_texts ?? [])[0] ?? "",
          headline: (row.headlines ?? [])[0] ?? "",
          description: (row.descriptions ?? [])[0] ?? "",
          landingUrl: row.landing_url,
          imageB64,
          minAge: Number((row.targeting as { min_age?: number })?.min_age ?? 25),
          cities: [],
          variants: (row.ad_variants ?? []) as AdVariant[],
        },
      );
    }

    await supabase
      .from("generated_campaigns")
      .update({
        status: "launched",
        external_id: externalId,
        external_status: "PAUSED",
        launch_log: `Created paused with ${Math.max(1, ((row.ad_variants ?? []) as AdVariant[]).length)} ads in ${row.platform === "google" ? "Google Ads" : "Meta Ads Manager"} on ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`,
      })
      .eq("id", row.id);

    return { externalId };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => {
    if (!data?.id) throw new Error("Which campaign?");
    return data;
  })
  .handler(async ({ data }) => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const { admin } = await import("./campaigns.server");
    await admin().from("generated_campaigns").delete().eq("id", data.id);
    return { ok: true };
  });

/* --------------------------- Google connection --------------------------- */

export const saveGoogleCredentials = createServerFn({ method: "POST" })
  .inputValidator((data: { clientId: string; clientSecret: string; developerToken: string }) => {
    if (!data?.clientId?.trim()) throw new Error("Enter the Google OAuth client ID.");
    if (!data?.clientSecret?.trim()) throw new Error("Enter the Google OAuth client secret.");
    if (!data?.developerToken?.trim()) throw new Error("Enter the Google Ads developer token.");
    return data;
  })
  .handler(async ({ data }) => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const { saveGoogleApp } = await import("./google-ads.server");
    await saveGoogleApp(data);
    return { ok: true };
  });

export const startGoogleSignIn = createServerFn({ method: "POST" })
  .inputValidator((data: { origin: string }) => {
    if (!data?.origin?.startsWith("http")) throw new Error("Could not work out this app's address.");
    return data;
  })
  .handler(async ({ data }) => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const { buildGoogleAuthUrl } = await import("./google-ads.server");
    return { url: await buildGoogleAuthUrl(data.origin) };
  });

export const listGoogleAdAccounts = createServerFn({ method: "POST" }).handler(async () => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
  const { listGoogleAccounts } = await import("./google-ads.server");
  return { accounts: await listGoogleAccounts() };
});

export const chooseGoogleAdAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { customerId: string; accountName: string; loginCustomerId?: string }) => {
    if (!data?.customerId?.trim()) throw new Error("Pick an ad account.");
    return data;
  })
  .handler(async ({ data }) => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
    const { selectGoogleAccount } = await import("./google-ads.server");
    await selectGoogleAccount(data);
    return { ok: true };
  });

export const disconnectGoogle = createServerFn({ method: "POST" }).handler(async () => {
    const { requireTeamUser } = await import("./require-user.server");
    await requireTeamUser();
  const { disconnectGoogleAccount } = await import("./google-ads.server");
  await disconnectGoogleAccount();
  return { ok: true };
});

export const googleRedirectUriFor = createServerFn({ method: "POST" })
  .inputValidator((data: { origin: string }) => data)
  .handler(async ({ data }) => {
    const { googleRedirectUri } = await import("./google-ads.server");
    return { redirectUri: googleRedirectUri(data.origin) };
  });
