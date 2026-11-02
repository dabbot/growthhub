export type ConnectorField = {
  key: string;
  label: string;
  placeholder?: string;
  secret?: boolean;
  multiline?: boolean;
};

export type Connector = {
  id: string;
  name: string;
  logo: string; // simple-icons slug
  color: string;
  group: "Ads" | "Analytics" | "SEO & Web" | "Product & Work" | "CRM & Engagement";
  gives: string;
  how: string;
  fields: ConnectorField[];
  managedAt?: string; // connected elsewhere in the dashboard
  verified: boolean; // we check the credentials live
};

const SA: ConnectorField = {
  key: "service_account",
  label: "Service account key (JSON)",
  placeholder: '{ "type": "service_account", ... }',
  secret: true,
  multiline: true,
};

export const CONNECTORS: Connector[] = [
  {
    id: "google-ads",
    name: "Google Ads",
    logo: "googleads",
    color: "#4285F4",
    group: "Ads",
    gives: "Campaigns, spend, clicks, conversions",
    how: "Sign in with Google on the Run Campaigns screen.",
    fields: [],
    managedAt: "/campaigns",
    verified: true,
  },
  {
    id: "meta-ads",
    name: "Meta Ads",
    logo: "meta",
    color: "#0467DF",
    group: "Ads",
    gives: "Facebook and Instagram campaigns, spend, results",
    how: "Connect your ad account on the Run Campaigns screen.",
    fields: [],
    managedAt: "/campaigns",
    verified: true,
  },
  {
    id: "semrush",
    name: "Semrush",
    logo: "semrush",
    color: "#FF642D",
    group: "SEO & Web",
    gives: "Keyword ranks, traffic, backlinks, rival domains",
    how: "Semrush → Subscription info → API units → copy your API key.",
    fields: [{ key: "api_key", label: "API key", secret: true }],
    verified: true,
  },
  {
    id: "pagespeed",
    name: "PageSpeed Insights",
    logo: "pagespeedinsights",
    color: "#4285F4",
    group: "SEO & Web",
    gives: "Page speed and Core Web Vitals for your site",
    how: "Google Cloud → APIs & Services → Credentials → create an API key with PageSpeed Insights enabled.",
    fields: [
      { key: "api_key", label: "API key", secret: true },
      { key: "site_url", label: "Website to test", placeholder: "https://example.com" },
    ],
    verified: true,
  },
  {
    id: "search-console",
    name: "Google Search Console",
    logo: "googlesearchconsole",
    color: "#458CF5",
    group: "SEO & Web",
    gives: "Search queries, impressions, clicks, positions",
    how: "Create a service account in Google Cloud, add its email as a user on your Search Console property, then paste its key.",
    fields: [SA],
    verified: true,
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    logo: "googleanalytics",
    color: "#E37400",
    group: "Analytics",
    gives: "Traffic, sources, sign-ups and conversions (GA4)",
    how: "Create a service account in Google Cloud, add its email as a Viewer on your GA4 property, then paste its key.",
    fields: [SA],
    verified: true,
  },
  {
    id: "firebase",
    name: "Firebase",
    logo: "firebase",
    color: "#FFCA28",
    group: "Analytics",
    gives: "App installs, active users, crash-free rate",
    how: "Firebase console → Project settings → Service accounts → Generate new private key.",
    fields: [SA],
    verified: true,
  },
  {
    id: "amplitude",
    name: "Amplitude",
    logo: "amplitude",
    color: "#1E61F0",
    group: "Analytics",
    gives: "Product events, funnels, retention",
    how: "Amplitude → Settings → Projects → your project → copy API key and secret key.",
    fields: [
      { key: "api_key", label: "API key" },
      { key: "secret_key", label: "Secret key", secret: true },
    ],
    verified: true,
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    logo: "mixpanel",
    color: "#7856FF",
    group: "Analytics",
    gives: "Product events, funnels, retention",
    how: "Mixpanel → Organization settings → Service accounts → create one.",
    fields: [
      { key: "username", label: "Service account username" },
      { key: "secret", label: "Service account secret", secret: true },
    ],
    verified: true,
  },
  {
    id: "metabase",
    name: "Metabase",
    logo: "metabase",
    color: "#509EE3",
    group: "Analytics",
    gives: "Your saved questions and MIS dashboards",
    how: "Metabase → Admin → Authentication → API keys → create key.",
    fields: [
      { key: "base_url", label: "Metabase address", placeholder: "https://metabase.yourcompany.com" },
      { key: "api_key", label: "API key", secret: true },
    ],
    verified: true,
  },
  {
    id: "jira",
    name: "Jira",
    logo: "jira",
    color: "#0052CC",
    group: "Product & Work",
    gives: "Growth tickets, status and shipped features for the roadmap",
    how: "id.atlassian.com → Security → Create API token.",
    fields: [
      { key: "site", label: "Jira site", placeholder: "yourcompany.atlassian.net" },
      { key: "email", label: "Your Atlassian email" },
      { key: "api_token", label: "API token", secret: true },
    ],
    verified: true,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    logo: "hubspot",
    color: "#FF7A59",
    group: "CRM & Engagement",
    gives: "Contacts, lifecycle stages, email campaigns",
    how: "HubSpot → Settings → Integrations → Private apps → create app → copy token.",
    fields: [{ key: "token", label: "Private app token", secret: true }],
    verified: true,
  },
  {
    id: "appsflyer",
    name: "AppsFlyer",
    logo: "appsflyer",
    color: "#00C2FF",
    group: "Ads",
    gives: "Install attribution by channel and campaign",
    how: "AppsFlyer → Security center → API tokens → copy the V2 token.",
    fields: [
      { key: "api_token", label: "API token (V2)", secret: true },
      { key: "app_id", label: "App ID", placeholder: "com.example.app" },
    ],
    verified: false,
  },
  {
    id: "clevertap",
    name: "CleverTap",
    logo: "clevertap",
    color: "#E0115F",
    group: "CRM & Engagement",
    gives: "Push, in-app and WhatsApp engagement",
    how: "CleverTap → Settings → Project → copy Account ID and Passcode.",
    fields: [
      { key: "account_id", label: "Account ID" },
      { key: "passcode", label: "Passcode", secret: true },
    ],
    verified: false,
  },
  {
    id: "linkedin-ads",
    name: "LinkedIn Ads",
    logo: "linkedin",
    color: "#0A66C2",
    group: "Ads",
    gives: "Campaign spend and leads",
    how: "LinkedIn developer portal → your app → generate an access token with ad reporting access.",
    fields: [
      { key: "token", label: "Access token", secret: true },
      { key: "account_id", label: "Ad account ID" },
    ],
    verified: true,
  },
];

export const CONNECTOR_GROUPS = [
  "Ads",
  "Analytics",
  "SEO & Web",
  "Product & Work",
  "CRM & Engagement",
] as const;
