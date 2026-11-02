/**
 * Who may sign in. Set VITE_ALLOWED_EMAIL_DOMAINS to a comma-separated list
 * (for example "yourcompany.com,partner.com"). Optional VITE_ALLOWED_EMAILS
 * lists individual addresses outside those domains.
 *
 * With nothing set, nobody can sign in: the dashboard fails closed.
 */
const list = (value: unknown) =>
  String(value ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const ALLOWED_DOMAINS: readonly string[] = list(import.meta.env["VITE_ALLOWED_EMAIL_DOMAINS"]);
export const ALLOWED_EMAILS: readonly string[] = list(import.meta.env["VITE_ALLOWED_EMAILS"]);

export const ACCESS_MESSAGE = ALLOWED_DOMAINS.length
  ? `Only ${ALLOWED_DOMAINS.join(" and ")} email addresses can use this dashboard.`
  : "Sign-in is not configured yet. Set VITE_ALLOWED_EMAIL_DOMAINS.";

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const address = email.trim().toLowerCase();
  if (ALLOWED_EMAILS.includes(address)) return true;
  const domain = address.split("@")[1];
  return !!domain && ALLOWED_DOMAINS.includes(domain);
}
