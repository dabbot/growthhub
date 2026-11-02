import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

import { isAllowedEmail, ACCESS_MESSAGE } from "./allowed-domains";

export type TeamUser = { id: string; email: string };

/**
 * Everything in this dashboard is for your own team only (see allowed-domains.ts).
 * Verifies the caller's session token server-side and checks the email domain.
 */
export async function requireTeamUser(): Promise<TeamUser> {
  const header = getRequest()?.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) {
    throw new Error("Sign in with your work email to do this.");
  }
  const token = header.slice(7).trim();
  if (token.split(".").length !== 3) {
    throw new Error("Sign in with your work email to do this.");
  }

  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const supabase = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  const claims = data?.claims as { sub?: string; email?: string } | undefined;
  if (error || !claims?.sub) {
    throw new Error("Your session has expired. Sign in again.");
  }
  if (!isAllowedEmail(claims.email)) {
    throw new Error(ACCESS_MESSAGE);
  }
  return { id: claims.sub, email: claims.email! };
}
