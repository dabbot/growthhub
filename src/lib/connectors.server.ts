type Creds = {
  api_key: string; site_url: string; service_account: string; secret_key: string;
  username: string; secret: string; base_url: string; site: string; email: string;
  api_token: string; token: string; account_id: string;
};

async function ok(res: Response, what: string) {
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(`${what} said no (${res.status}): ${body || "check the details"}`);
  }
  return res;
}

function b64url(input: ArrayBuffer | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function googleToken(saJson: string, scope: string) {
  let sa: { client_email?: string; private_key?: string; project_id?: string };
  try {
    sa = JSON.parse(saJson);
  } catch {
    throw new Error("That service account key isn't valid JSON.");
  }
  if (!sa.client_email || !sa.private_key) throw new Error("The key is missing client_email or private_key.");
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const now = Math.floor(Date.now() / 1000);
  const unsigned =
    b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })) +
    "." +
    b64url(
      JSON.stringify({
        iss: sa.client_email,
        scope,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      }),
    );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const res = await ok(
    await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${b64url(sig)}`,
      }),
    }),
    "Google",
  );
  const j = (await res.json()) as { access_token: string };
  return { token: j.access_token, sa };
}

const basic = (a: string, b: string) => "Basic " + btoa(`${a}:${b}`);

/** Makes one harmless read against the platform and returns a label for the account. */
export async function verifyConnector(platform: string, raw: Record<string, string>): Promise<{ label: string; verified: boolean }> {
  const c = new Proxy(raw, { get: (t, k: string) => t[k] ?? "" }) as unknown as Creds;
  switch (platform) {
    case "semrush": {
      const res = await ok(
        await fetch(`https://www.semrush.com/users/countapiunits.html?key=${encodeURIComponent(c.api_key)}`),
        "Semrush",
      );
      const t = (await res.text()).trim();
      if (!/^\d+$/.test(t)) throw new Error(`Semrush said: ${t.slice(0, 200)}`);
      return { label: `${Number(t).toLocaleString("en-IN")} API units left`, verified: true };
    }
    case "pagespeed": {
      const url = c.site_url || "https://example.com";
      const res = await ok(
        await fetch(
          `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=mobile&key=${encodeURIComponent(c.api_key)}`,
        ),
        "PageSpeed Insights",
      );
      const j = (await res.json()) as { lighthouseResult?: { categories?: { performance?: { score?: number } } } };
      const score = j.lighthouseResult?.categories?.performance?.score;
      return { label: `${url} · mobile score ${score != null ? Math.round(score * 100) : "?"}`, verified: true };
    }
    case "google-analytics": {
      const { token, sa } = await googleToken(c.service_account, "https://www.googleapis.com/auth/analytics.readonly");
      const res = await ok(
        await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        "Google Analytics",
      );
      const j = (await res.json()) as { accountSummaries?: { propertySummaries?: unknown[] }[] };
      const props = (j.accountSummaries ?? []).reduce((n, a) => n + (a.propertySummaries?.length ?? 0), 0);
      if (!props) throw new Error(`Connected, but ${sa.client_email} can't see any GA4 property yet. Add it as a Viewer.`);
      return { label: `${props} GA4 propert${props === 1 ? "y" : "ies"}`, verified: true };
    }
    case "search-console": {
      const { token, sa } = await googleToken(c.service_account, "https://www.googleapis.com/auth/webmasters.readonly");
      const res = await ok(
        await fetch("https://www.googleapis.com/webmasters/v3/sites", { headers: { Authorization: `Bearer ${token}` } }),
        "Search Console",
      );
      const j = (await res.json()) as { siteEntry?: { siteUrl: string }[] };
      const sites = j.siteEntry ?? [];
      if (!sites.length) throw new Error(`Connected, but ${sa.client_email} isn't a user on any Search Console property yet.`);
      return { label: sites.map((s) => s.siteUrl).slice(0, 2).join(", "), verified: true };
    }
    case "firebase": {
      const { token, sa } = await googleToken(c.service_account, "https://www.googleapis.com/auth/firebase.readonly");
      const res = await ok(
        await fetch(`https://firebase.googleapis.com/v1beta1/projects/${sa.project_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        "Firebase",
      );
      const j = (await res.json()) as { displayName?: string; projectId?: string };
      return { label: j.displayName || j.projectId || "Firebase project", verified: true };
    }
    case "amplitude": {
      await ok(
        await fetch("https://amplitude.com/api/2/events/list", {
          headers: { Authorization: basic(c.api_key, c.secret_key) },
        }),
        "Amplitude",
      );
      return { label: "Amplitude project", verified: true };
    }
    case "mixpanel": {
      const res = await ok(
        await fetch("https://mixpanel.com/api/app/me", { headers: { Authorization: basic(c.username, c.secret) } }),
        "Mixpanel",
      );
      const j = (await res.json()) as { results?: { name?: string } };
      return { label: j.results?.name || "Mixpanel organisation", verified: true };
    }
    case "metabase": {
      const base = c.base_url.replace(/\/+$/, "");
      if (!/^https:\/\//.test(base)) throw new Error("The Metabase address must start with https://");
      const res = await ok(
        await fetch(`${base}/api/user/current`, { headers: { "x-api-key": c.api_key } }),
        "Metabase",
      );
      const j = (await res.json()) as { common_name?: string };
      return { label: `${base.replace("https://", "")}${j.common_name ? ` · ${j.common_name}` : ""}`, verified: true };
    }
    case "jira": {
      const site = c.site.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!/^[a-z0-9-]+\.atlassian\.net$/i.test(site)) throw new Error("The Jira site should look like yourcompany.atlassian.net");
      const res = await ok(
        await fetch(`https://${site}/rest/api/3/myself`, {
          headers: { Authorization: basic(c.email, c.api_token), Accept: "application/json" },
        }),
        "Jira",
      );
      const j = (await res.json()) as { displayName?: string };
      return { label: `${site} · ${j.displayName ?? c.email}`, verified: true };
    }
    case "hubspot": {
      const res = await ok(
        await fetch("https://api.hubapi.com/account-info/v3/details", {
          headers: { Authorization: `Bearer ${c.token}` },
        }),
        "HubSpot",
      );
      const j = (await res.json()) as { portalId?: number };
      return { label: `HubSpot portal ${j.portalId ?? ""}`.trim(), verified: true };
    }
    case "linkedin-ads": {
      await ok(
        await fetch(`https://api.linkedin.com/rest/adAccounts/${encodeURIComponent(c.account_id)}`, {
          headers: { Authorization: `Bearer ${c.token}`, "LinkedIn-Version": "202409", "X-Restli-Protocol-Version": "2.0.0" },
        }),
        "LinkedIn",
      );
      return { label: `Ad account ${c.account_id}`, verified: true };
    }
    default:
      return { label: "Saved — we'll check it on the first data pull", verified: false };
  }
}
