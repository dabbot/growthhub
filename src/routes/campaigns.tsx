import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Rocket, Trash2, Sparkles, Plug, CheckCircle2 } from "lucide-react";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import {
  getCampaignWorkspace,
  generateCampaigns,
  launchCampaign,
  deleteCampaign,
  connectMeta,
  disconnectMeta,
  saveGoogleCredentials,
  startGoogleSignIn,
  listGoogleAdAccounts,
  chooseGoogleAdAccount,
  disconnectGoogle,
  googleRedirectUriFor,
  type CampaignWorkspace,
} from "@/lib/campaigns.functions";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Run Campaigns — GrowthHub" },
      {
        name: "description",
        content:
          "Turn a persona and a play into a ready Google Search and Meta campaign, then push it live in one click.",
      },
      { property: "og:title", content: "Run Campaigns — GrowthHub" },
      {
        property: "og:description",
        content: "Auto-written Google and Meta campaigns, created paused in your own ad accounts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

function CampaignsPage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const qc = useQueryClient();

  const fetchWorkspace = useServerFn(getCampaignWorkspace);
  const workspace = useQuery({
    queryKey: ["campaign-workspace"],
    queryFn: () => fetchWorkspace(),
  });

  const runGenerate = useServerFn(generateCampaigns);
  const runLaunch = useServerFn(launchCampaign);
  const runDelete = useServerFn(deleteCampaign);

  const [persona, setPersona] = useState(data.personas[0]?.slug ?? "");
  const [play, setPlay] = useState(data.plays[0]?.slug ?? "");
  const [budget, setBudget] = useState(5000);
  const [landing, setLanding] = useState("https://example.com");
  const [withImage, setWithImage] = useState(true);


  const refresh = () => qc.invalidateQueries({ queryKey: ["campaign-workspace"] });

  const gen = useMutation({
    mutationFn: () =>
      runGenerate({
        data: {
          personaSlug: persona,
          playSlug: play,
          dailyBudgetInr: budget,
          landingUrl: landing,
          withImage,
        },
      }),
    onSuccess: () => {
      toast.success("Campaigns written. Review them below before going live.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const launch = useMutation({
    mutationFn: (id: string) => runLaunch({ data: { id } }),
    onSuccess: () => {
      toast.success("Created in your ad account — paused, so nothing spends yet.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => runDelete({ data: { id } }),
    onSuccess: refresh,
  });


  const ws = workspace.data;
  const campaigns = ws?.campaigns ?? [];
  const selectedPersona = data.personas.find((p) => p.slug === persona);
  const selectedPlay = data.plays.find((p) => p.slug === play);

  return (
    <div className="space-y-6">
      <PageHeader
        step="11"
        title="Run Campaigns"
        question="Pick who you are going after and which play you are running. The tool writes the Google search campaign and the Meta feed campaign, draws the creative, and creates both in your own ad accounts — always paused, so nothing spends until your team switches it on."
      />

      {/* Connections */}
      <ConnectionPanels workspace={ws} onChanged={refresh} />


      {/* Generator */}
      <Panel
        title="Write a campaign"
        eyebrow="Generator"
        soWhat="Every campaign is built from a real segment in this tool, so the audience, the budget and the message all trace back to the headroom maths."
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Label>Who are we going after?</Label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
            >
              {data.personas.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} — {p.size_m}M, {p.penetration_pct}% on Acme
                </option>
              ))}
            </select>
            {selectedPersona ? (
              <p className="mt-2 text-xs text-muted-foreground">{selectedPersona.who}</p>
            ) : null}
          </div>
          <div className="lg:col-span-2">
            <Label>Which play?</Label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
              value={play}
              onChange={(e) => setPlay(e.target.value)}
            >
              {data.plays.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
            {selectedPlay ? (
              <p className="mt-2 text-xs text-muted-foreground">{selectedPlay.rationale}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="budget">Daily budget (₹)</Label>
            <Input
              id="budget"
              type="number"
              min={500}
              step={500}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </div>
          <div className="lg:col-span-2">
            <Label htmlFor="landing">Landing page</Label>
            <Input
              id="landing"
              value={landing}
              onChange={(e) => setLanding(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={withImage}
                onChange={(e) => setWithImage(e.target.checked)}
              />
              Draw the creative
            </label>
          </div>
        </div>

        <Button
          className="mt-4"
          disabled={gen.isPending}
          onClick={() => gen.mutate()}
        >
          {gen.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 size-4" />
          )}
          {gen.isPending ? "Writing the campaign…" : "Generate Google + Meta campaign"}
        </Button>
      </Panel>

      {/* Campaigns */}
      <Panel
        title="Campaigns ready to go"
        eyebrow="Drafts"
        soWhat="Everything is created paused in your ad account. Switching it on stays a human decision, made inside Google or Meta."
      >
        {workspace.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing written yet. Pick an audience and a play above.
          </p>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => (
              <article
                key={c.id}
                className="rounded-lg border border-border bg-surface-2/50 p-4"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {c.platform === "google" ? "Google Search" : "Meta feed"} · ₹
                      {Number(c.daily_budget_inr).toLocaleString("en-IN")} a day
                    </p>
                    <h3 className="text-sm font-semibold">{c.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{c.objective}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide",
                        c.status === "launched"
                          ? "border-reported/40 text-reported"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {c.status === "launched" ? "In ad account (paused)" : "Draft"}
                    </span>
                    {c.status !== "launched" ? (
                      <Button
                        size="sm"
                        disabled={launch.isPending}
                        onClick={() => launch.mutate(c.id)}
                      >
                        {launch.isPending ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Rocket className="mr-2 size-4" />
                        )}
                        Take it live
                      </Button>
                    ) : null}
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete campaign"
                      onClick={() => remove.mutate(c.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </header>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {c.image_urls[0] ? (
                    <img
                      src={c.image_urls[0]}
                      alt={`Creative for ${c.name}`}
                      className="h-40 w-full rounded-md object-cover md:h-full"
                      loading="lazy"
                    />
                  ) : null}
                  <div className={cn("space-y-3 text-sm", c.image_urls[0] ? "md:col-span-2" : "md:col-span-3")}>
                    {c.primary_texts.length > 0 ? (
                      <Field label="Ad text">
                        {c.primary_texts.map((t, i) => (
                          <p key={i} className="mb-1">
                            {t}
                          </p>
                        ))}
                      </Field>
                    ) : null}
                    {c.headlines.length > 0 ? (
                      <Field label="Headlines">{c.headlines.join(" · ")}</Field>
                    ) : null}
                    {c.descriptions.length > 0 ? (
                      <Field label="Descriptions">{c.descriptions.join(" · ")}</Field>
                    ) : null}
                    {c.keywords.length > 0 ? (
                      <Field label="Search terms">{c.keywords.join(", ")}</Field>
                    ) : null}
                    {c.audience_note ? <Field label="Audience">{c.audience_note}</Field> : null}
                    {(c.ad_variants ?? []).length > 0 ? (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {c.ad_variants.length} ads ready in this campaign
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {c.ad_variants.map((v, i) => (
                            <div
                              key={i}
                              className="rounded-md border border-border/60 bg-background/40 p-3"
                            >
                              <p className="text-[10px] uppercase tracking-[0.16em] text-modeled">
                                Ad {i + 1}
                                {v.angle ? ` · ${v.angle}` : ""}
                              </p>
                              {v.primary_text ? (
                                <p className="mt-1 text-sm text-foreground/90">{v.primary_text}</p>
                              ) : null}
                              {v.headline ? (
                                <p className="mt-1 text-sm font-medium text-foreground">
                                  {v.headline}
                                </p>
                              ) : null}
                              {v.description ? (
                                <p className="text-xs text-muted-foreground">{v.description}</p>
                              ) : null}
                              {v.headlines?.length ? (
                                <p className="mt-1 text-sm font-medium text-foreground">
                                  {v.headlines.join(" · ")}
                                </p>
                              ) : null}
                              {v.descriptions?.length ? (
                                <p className="text-xs text-muted-foreground">
                                  {v.descriptions.join(" · ")}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {c.launch_log ? (
                      <p className="text-xs text-reported">{c.launch_log}</p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm text-foreground/90">{children}</div>
    </div>
  );
}

type GoogleState = CampaignWorkspace["google"] | undefined;

function GooglePanel({ google, onChanged }: { google: GoogleState; onChanged: () => void }) {
  const runSaveCreds = useServerFn(saveGoogleCredentials);
  const runSignIn = useServerFn(startGoogleSignIn);
  const runListAccounts = useServerFn(listGoogleAdAccounts);
  const runChoose = useServerFn(chooseGoogleAdAccount);
  const runDisconnect = useServerFn(disconnectGoogle);
  const runRedirect = useServerFn(googleRedirectUriFor);

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [devToken, setDevToken] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [redirectUri, setRedirectUri] = useState("");
  const [accounts, setAccounts] = useState<
    { customerId: string; name: string; manager: boolean }[] | null
  >(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    runRedirect({ data: { origin: window.location.origin } })
      .then((r: { redirectUri: string }) => setRedirectUri(r.redirectUri))
      .catch(() => undefined);

    const status = new URLSearchParams(window.location.search).get("google");
    if (!status) return;
    if (status === "connected") toast.success("Google account connected. Now pick an ad account.");
    else if (status === "cancelled") toast.message("Google sign-in was cancelled.");
    else if (status.startsWith("failed:")) toast.error(status.slice(7));
    window.history.replaceState({}, "", window.location.pathname);
    onChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveCreds = useMutation({
    mutationFn: () =>
      runSaveCreds({ data: { clientId, clientSecret, developerToken: devToken } }),
    onSuccess: () => {
      toast.success("Google app details saved. Now sign in with your Google account.");
      setClientSecret("");
      setShowSetup(false);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signIn = useMutation({
    mutationFn: () => runSignIn({ data: { origin: window.location.origin } }),
    onSuccess: (r: { url: string }) => {
      window.location.href = r.url;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const load = useMutation({
    mutationFn: () => runListAccounts(),
    onSuccess: (r: { accounts: { customerId: string; name: string; manager: boolean }[] }) => {
      setAccounts(r.accounts);
      if (r.accounts.length === 0) toast.message("This Google login cannot see any ad accounts.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const choose = useMutation({
    mutationFn: (a: { customerId: string; name: string; manager: boolean }) =>
      runChoose({ data: { customerId: a.customerId, accountName: a.name } }),
    onSuccess: () => {
      toast.success("Ad account selected. You can take campaigns live now.");
      setAccounts(null);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const drop = useMutation({
    mutationFn: () => runDisconnect(),
    onSuccess: () => {
      toast.success("Google account disconnected.");
      setAccounts(null);
      onChanged();
    },
  });

  return (
    <Panel
      title="Google Ads"
      eyebrow="Ad account"
      soWhat="Sign in once with the Google account that owns Acme's ad account. Campaigns are created paused, with a phrase-match keyword set and a responsive search ad."
    >
      {google?.connected ? (
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2 text-reported">
            <CheckCircle2 className="size-4" />
            Connected as {google.email ?? "your Google account"} — using {google.accountName} (
            {google.customerId}).
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => load.mutate()}>
              Change ad account
            </Button>
            <Button variant="outline" size="sm" onClick={() => drop.mutate()}>
              Disconnect
            </Button>
          </div>
          {accounts ? <AccountPicker accounts={accounts} onPick={(a) => choose.mutate(a)} /> : null}
        </div>
      ) : google?.signedIn ? (
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="size-4 text-reported" />
            Signed in as {google.email ?? "your Google account"}. Pick which ad account to use.
          </p>
          <div className="flex gap-2">
            <Button size="sm" disabled={load.isPending} onClick={() => load.mutate()}>
              {load.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Show my ad accounts
            </Button>
            <Button variant="outline" size="sm" onClick={() => drop.mutate()}>
              Sign out
            </Button>
          </div>
          {accounts ? <AccountPicker accounts={accounts} onPick={(a) => choose.mutate(a)} /> : null}
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2 text-foreground">
            <Plug className="size-4 text-modeled" /> No Google ad account connected yet.
          </p>
          <Button
            disabled={signIn.isPending}
            onClick={() => (google?.configured ? signIn.mutate() : setShowSetup(true))}
          >
            {signIn.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plug className="mr-2 size-4" />
            )}
            Connect Google ad account
          </Button>
          <p className="text-xs text-muted-foreground">
            {google?.configured
              ? "Sign in with the Google account that has access to Acme's ad account, then pick the account to use."
              : "First time here: add your Google app details once, then everyone just clicks connect."}
          </p>
          {google?.configured ? (
            <button
              type="button"
              className="block text-xs text-muted-foreground underline"
              onClick={() => setShowSetup((v) => !v)}
            >
              Change the Google app details
            </button>
          ) : null}
          {showSetup || !google?.configured ? (
            <SetupForm
              clientId={clientId}
              clientSecret={clientSecret}
              devToken={devToken}
              setClientId={setClientId}
              setClientSecret={setClientSecret}
              setDevToken={setDevToken}
              redirectUri={redirectUri}
              pending={saveCreds.isPending}
              onSave={() => saveCreds.mutate()}
            />
          ) : null}
        </div>
      )}
    </Panel>
  );
}

function AccountPicker({
  accounts,
  onPick,
}: {
  accounts: { customerId: string; name: string; manager: boolean }[];
  onPick: (a: { customerId: string; name: string; manager: boolean }) => void;
}) {
  if (accounts.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No ad accounts came back for this Google login.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {accounts.map((a) => (
        <li key={a.customerId} className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="text-sm">
            {a.name}{" "}
            <span className="text-xs text-muted-foreground">
              {a.customerId}
              {a.manager ? " · manager account" : ""}
            </span>
          </span>
          <Button size="sm" variant="outline" onClick={() => onPick(a)}>
            Use this
          </Button>
        </li>
      ))}
    </ul>
  );
}

function SetupForm(props: {
  clientId: string;
  clientSecret: string;
  devToken: string;
  setClientId: (v: string) => void;
  setClientSecret: (v: string) => void;
  setDevToken: (v: string) => void;
  redirectUri: string;
  pending: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="g-client">Google client ID</Label>
          <Input
            id="g-client"
            placeholder="1234-abc.apps.googleusercontent.com"
            value={props.clientId}
            onChange={(e) => props.setClientId(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="g-secret">Client secret</Label>
          <Input
            id="g-secret"
            type="password"
            value={props.clientSecret}
            onChange={(e) => props.setClientSecret(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="g-dev">Google Ads developer token</Label>
        <Input
          id="g-dev"
          type="password"
          value={props.devToken}
          onChange={(e) => props.setDevToken(e.target.value)}
        />
      </div>
      <Button size="sm" disabled={props.pending} onClick={props.onSave}>
        {props.pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Save and enable Google sign-in
      </Button>
      <p className="text-xs text-muted-foreground">
        Create an OAuth client (web application) in Google Cloud and add this redirect address:{" "}
        <code className="break-all text-foreground/80">{props.redirectUri || "loading…"}</code>. The
        developer token comes from the Google Ads API Center. All three stay on the server.
      </p>
    </div>
  );
}

function ConnectionPanels({
  workspace,
  onChanged,
}: {
  workspace: CampaignWorkspace | undefined;
  onChanged: () => void;
}) {
  const runConnectMeta = useServerFn(connectMeta);
  const runDisconnectMeta = useServerFn(disconnectMeta);
  const [metaAccount, setMetaAccount] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [metaPage, setMetaPage] = useState("");

  const saveMeta = useMutation({
    mutationFn: () =>
      runConnectMeta({
        data: { adAccountId: metaAccount, accessToken: metaToken, pageId: metaPage },
      }),
    onSuccess: (r: { accountName: string }) => {
      toast.success(`Connected to ${r.accountName}.`);
      setMetaToken("");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dropMeta = useMutation({
    mutationFn: () => runDisconnectMeta(),
    onSuccess: () => {
      toast.success("Meta account disconnected.");
      onChanged();
    },
  });

  const ws = workspace;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GooglePanel google={ws?.google} onChanged={onChanged} />

      <Panel
        title="Meta Ads"
        eyebrow="Ad account"
        soWhat="Your token stays on the server. It is never sent to the browser or shown again."
      >
        {ws?.meta.connected ? (
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 text-reported">
              <CheckCircle2 className="size-4" />
              Connected to {ws.meta.accountName} ({ws.meta.accountId}).
            </p>
            {!ws.meta.hasPage ? (
              <p className="text-modeled">
                No Facebook page saved, so Meta campaigns will be created without the ad itself.
                Reconnect with a page ID to get the full ad.
              </p>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => dropMeta.mutate()}>
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="meta-account">Ad account ID</Label>
                <Input
                  id="meta-account"
                  placeholder="act_1234567890"
                  value={metaAccount}
                  onChange={(e) => setMetaAccount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="meta-page">Facebook page ID (optional)</Label>
                <Input
                  id="meta-page"
                  placeholder="1098765432"
                  value={metaPage}
                  onChange={(e) => setMetaPage(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="meta-token">Access token</Label>
              <Input
                id="meta-token"
                type="password"
                placeholder="System user token with ads_management"
                value={metaToken}
                onChange={(e) => setMetaToken(e.target.value)}
              />
            </div>
            <Button size="sm" disabled={saveMeta.isPending} onClick={() => saveMeta.mutate()}>
              {saveMeta.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Connect Meta account
            </Button>
            <p className="text-xs text-muted-foreground">
              Create a system user in Meta Business Settings, give it access to the ad account with
              the ads_management permission, and generate a token. Paste it once here.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}

function CompanyView() {
  return <CampaignsPage />;
}
