/**
 * The company this dashboard is built around.
 *
 * Everything shipped with the project describes "Acme", a fictional credit card
 * bill-payment and rewards app. All Acme figures are made-up examples. Change
 * these fields (and the example data in src/lib and supabase/migrations) to
 * point the dashboard at your own product.
 */
export const BRAND = {
  key: "acme",
  name: "Acme",
  url: "https://example.com",
  sector: "Credit card bill payments",
  /** One line used in AI prompts. */
  description: "Acme, a fictional Indian app for credit cardholders with a good credit score",
  product: "credit card bill payments, Acme Credit Line, UPI, Insurance, Travel and the Rewards Store",
  customer: "active credit cardholders with a 750+ score",
} as const;
