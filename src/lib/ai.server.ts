/**
 * AI provider settings (server only).
 *
 * Any OpenAI-compatible API works. Defaults to OpenAI; point AI_BASE_URL at another
 * provider or a gateway to switch. Text calls use the Responses and Chat Completions
 * endpoints, ad creatives use the Images endpoint.
 */

export function aiBaseUrl(): string {
  return (process.env["AI_BASE_URL"] || "https://api.openai.com/v1").replace(/\/+$/, "");
}

export function aiKey(): string | null {
  return process.env["AI_API_KEY"] || null;
}

/** Headers for an AI request. Throws when no key is configured. */
export function aiHeaders(): Record<string, string> {
  const key = aiKey();
  if (!key) throw new Error("AI is not configured. Set AI_API_KEY.");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export const aiModel = () => process.env["AI_MODEL"] || "gpt-5";
export const aiImageModel = () => process.env["AI_IMAGE_MODEL"] || "gpt-image-1";
