import { admin } from "./campaigns.server";

const GOOGLE_API_VERSION = "v21";
const GOOGLE_ADS_API = `https://googleads.googleapis.com/${GOOGLE_API_VERSION}`;
const SCOPE = "https://www.googleapis.com/auth/adwords";

export type GoogleConnectionRow = {
  key: string;
  client_id: string | null;
  client_secret: string | null;
  developer_token: string | null;
  refresh_token: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  google_email: string | null;
  customer_id: string | null;
  login_customer_id: string | null;
  account_name: string | null;
};

export type GoogleStatus = {
  /** App credentials saved (client id/secret + developer token). */
  configured: boolean;
  /** A Google account has authorised the app. */
  signedIn: boolean;
  /** An ad account is chosen, so campaigns can be created. */
  connected: boolean;
  email: string | null;
  customerId: string | null;
  accountName: string | null;
  hasDeveloperToken: boolean;
};

export async function getGoogleConnection(): Promise<GoogleConnectionRow | null> {
  const { data } = await admin()
    .from("google_connection")
    .select("*")
    .eq("key", "default")
    .maybeSingle();
  return (data as GoogleConnectionRow | null) ?? null;
}

/** App-level Google credentials: project secrets win, saved row is the fallback. */
export function googleAppCreds(c: GoogleConnectionRow | null): {
  clientId: string | null;
  clientSecret: string | null;
  developerToken: string | null;
} {
  return {
    clientId: process.env["GOOGLE_OAUTH_CLIENT_ID"] ?? c?.client_id ?? null,
    clientSecret: process.env["GOOGLE_OAUTH_CLIENT_SECRET"] ?? c?.client_secret ?? null,
    developerToken: process.env["GOOGLE_ADS_DEVELOPER_TOKEN"] ?? c?.developer_token ?? null,
  };
}

export async function googleStatus(): Promise<GoogleStatus> {
  const c = await getGoogleConnection();
  const app = googleAppCreds(c);
  const configured = Boolean(app.clientId && app.clientSecret && app.developerToken);
  const signedIn = Boolean(c?.refresh_token);
  return {
    configured,
    signedIn,
    connected: Boolean(signedIn && c?.customer_id && app.developerToken),
    email: c?.google_email ?? null,
    customerId: c?.customer_id ?? null,
    accountName: c?.account_name ?? null,
    hasDeveloperToken: Boolean(app.developerToken),
  };
}

export async function saveGoogleApp(input: {
  clientId: string;
  clientSecret: string;
  developerToken: string;
}): Promise<void> {
  const { error } = await admin()
    .from("google_connection")
    .upsert(
      {
        key: "default",
        client_id: input.clientId.trim(),
        client_secret: input.clientSecret.trim(),
        developer_token: input.developerToken.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
  if (error) throw new Error(error.message);
}

export function googleRedirectUri(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/public/google-ads/callback`;
}

export async function buildGoogleAuthUrl(origin: string): Promise<string> {
  const app = googleAppCreds(await getGoogleConnection());
  if (!app.clientId || !app.clientSecret) {
    throw new Error("Add your Google OAuth client ID and secret first.");
  }
  const state = crypto.randomUUID();
  const redirectUri = googleRedirectUri(origin);
  const { error } = await admin()
    .from("google_oauth_state")
    .insert({ state, redirect_uri: redirectUri });
  if (error) throw new Error(error.message);

  const params = new URLSearchParams({
    client_id: app.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: `${SCOPE} openid email`,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function tokenRequest(body: Record<string, string>): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google sign-in failed [${res.status}]: ${text}`);
  return JSON.parse(text);
}

function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const part = idToken.split(".")[1] ?? "";
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return (payload.email as string) ?? null;
  } catch {
    return null;
  }
}

/** Exchanges the OAuth code for a refresh token and stores it. Returns the signed-in email. */
export async function completeGoogleOAuth(code: string, state: string): Promise<string | null> {
  const db = admin();
  const { data: stateRow } = await db
    .from("google_oauth_state")
    .select("state, redirect_uri")
    .eq("state", state)
    .maybeSingle();
  if (!stateRow) throw new Error("This sign-in link has expired. Start again from Run Campaigns.");
  await db.from("google_oauth_state").delete().eq("state", state);

  const app = googleAppCreds(await getGoogleConnection());
  if (!app.clientId || !app.clientSecret) throw new Error("Google app credentials are missing.");

  const token = await tokenRequest({
    code,
    client_id: app.clientId,
    client_secret: app.clientSecret,
    redirect_uri: (stateRow as { redirect_uri: string }).redirect_uri,
    grant_type: "authorization_code",
  });
  if (!token.refresh_token) {
    throw new Error(
      "Google did not return a long-lived token. Remove this app's access in your Google account and connect again.",
    );
  }
  const email = emailFromIdToken(token.id_token);
  const { error } = await db
    .from("google_connection")
    .update({
      refresh_token: token.refresh_token,
      access_token: token.access_token,
      token_expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      google_email: email,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "default");
  if (error) throw new Error(error.message);
  return email;
}

export async function googleAccessToken(): Promise<{ token: string; conn: GoogleConnectionRow }> {
  const c = await getGoogleConnection();
  const app = googleAppCreds(c);
  if (!c?.refresh_token || !app.clientId || !app.clientSecret) {
    throw new Error("No Google account is connected yet.");
  }
  const fresh =
    c.access_token && c.token_expires_at && Date.parse(c.token_expires_at) - Date.now() > 60_000;
  if (fresh) return { token: c.access_token as string, conn: c };

  const token = await tokenRequest({
    client_id: app.clientId,
    client_secret: app.clientSecret,
    refresh_token: c.refresh_token,
    grant_type: "refresh_token",
  });
  await admin()
    .from("google_connection")
    .update({
      access_token: token.access_token,
      token_expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("key", "default");
  return { token: token.access_token, conn: c };
}

function adsHeaders(token: string, conn: GoogleConnectionRow): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "developer-token": googleAppCreds(conn).developerToken ?? "",
    "Content-Type": "application/json",
  };
  if (conn.login_customer_id) headers["login-customer-id"] = conn.login_customer_id.replace(/-/g, "");
  return headers;
}

export async function googleAdsPost(path: string, body: unknown): Promise<unknown> {
  const { token, conn } = await googleAccessToken();
  if (!googleAppCreds(conn).developerToken) {
    throw new Error("A Google Ads developer token is required.");
  }
  const res = await fetch(`${GOOGLE_ADS_API}/${path}`, {
    method: "POST",
    headers: adsHeaders(token, conn),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google Ads [${res.status}]: ${text}`);
  return JSON.parse(text || "{}");
}

export type GoogleAccount = { customerId: string; name: string; manager: boolean };

/** Lists the ad accounts this Google login can reach, with their names. */
export async function listGoogleAccounts(): Promise<GoogleAccount[]> {
  const { token, conn } = await googleAccessToken();
  if (!googleAppCreds(conn).developerToken) {
    throw new Error("A Google Ads developer token is required.");
  }
  const listRes = await fetch(`${GOOGLE_ADS_API}/customers:listAccessibleCustomers`, {
    headers: adsHeaders(token, conn),
  });
  const listText = await listRes.text();
  if (!listRes.ok) throw new Error(`Google Ads [${listRes.status}]: ${listText}`);
  const resourceNames: string[] = JSON.parse(listText || "{}").resourceNames ?? [];

  const accounts: GoogleAccount[] = [];
  for (const rn of resourceNames.slice(0, 25)) {
    const id = rn.split("/")[1] ?? "";
    if (!id) continue;
    try {
      const res = await fetch(`${GOOGLE_ADS_API}/customers/${id}/googleAds:search`, {
        method: "POST",
        headers: adsHeaders(token, conn),
        body: JSON.stringify({
          query:
            "SELECT customer.id, customer.descriptive_name, customer.manager FROM customer LIMIT 1",
        }),
      });
      if (!res.ok) {
        accounts.push({ customerId: id, name: `Account ${id}`, manager: false });
        continue;
      }
      const json = (await res.json()) as {
        results?: { customer?: { descriptiveName?: string; manager?: boolean } }[];
      };
      const cust = json.results?.[0]?.customer;
      accounts.push({
        customerId: id,
        name: cust?.descriptiveName ?? `Account ${id}`,
        manager: Boolean(cust?.manager),
      });
    } catch {
      accounts.push({ customerId: id, name: `Account ${id}`, manager: false });
    }
  }
  return accounts;
}

export async function selectGoogleAccount(input: {
  customerId: string;
  accountName: string;
  loginCustomerId?: string | null;
}): Promise<void> {
  const { error } = await admin()
    .from("google_connection")
    .update({
      customer_id: input.customerId.replace(/-/g, ""),
      account_name: input.accountName,
      login_customer_id: input.loginCustomerId ? input.loginCustomerId.replace(/-/g, "") : null,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "default");
  if (error) throw new Error(error.message);
}

export async function disconnectGoogleAccount(): Promise<void> {
  const { error } = await admin()
    .from("google_connection")
    .update({
      refresh_token: null,
      access_token: null,
      token_expires_at: null,
      google_email: null,
      customer_id: null,
      login_customer_id: null,
      account_name: null,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "default");
  if (error) throw new Error(error.message);
}
