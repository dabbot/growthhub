import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { notifySignIn } from "@/lib/sign-in-alert.functions";
import { ACCESS_MESSAGE, isAllowedEmail } from "@/lib/allowed-domains";

type State =
  | { kind: "loading" }
  | { kind: "out" }
  | { kind: "in"; email: string }
  | { kind: "refused"; email: string };

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let alive = true;

    const settle = async (email: string | null | undefined) => {
      if (!alive) return;
      if (!email) return setState({ kind: "out" });
      if (!isAllowedEmail(email)) {
        await supabase.auth.signOut();
        if (alive) setState({ kind: "refused", email });
        return;
      }
      setState({ kind: "in", email });
    };

    void supabase.auth.getSession().then(({ data }) => settle(data.session?.user.email));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setState((s) => (s.kind === "refused" ? s : { kind: "out" }));
        return;
      }
      if (event === "SIGNED_IN" && session && isAllowedEmail(session.user.email)) {
        const key = `signin-alert-${session.access_token.slice(-24)}`;
        try {
          const sid = JSON.parse(atob(session.access_token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/"))).session_id;
          if (sid && !localStorage.getItem(`signin-alert-${sid}`)) {
            localStorage.setItem(`signin-alert-${sid}`, "1");
            setTimeout(() => void notifySignIn().catch(() => {}), 0);
          }
        } catch {
          void key;
        }
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
        void settle(session?.user.email);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.kind === "in") return <>{children}</>;

  return (
    <SignIn
      refusedEmail={state.kind === "refused" ? state.email : null}
      onRetry={() => setState({ kind: "out" })}
    />
  );
}

function SignIn({ refusedEmail, onRetry }: { refusedEmail: string | null; onRetry: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(refusedEmail ? ACCESS_MESSAGE : null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const address = email.trim().toLowerCase();
    if (!isAllowedEmail(address)) {
      setError(ACCESS_MESSAGE);
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEmail(address);
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (err) setError("That code didn't work. Check it, or send a new one.");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in oklab, var(--primary) 35%, transparent) 1px, transparent 1.5px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <div
          className="absolute -left-40 -top-40 size-[520px] rounded-full blur-3xl"
          style={{ background: "color-mix(in oklab, var(--primary) 22%, transparent)" }}
        />
        <div
          className="absolute -bottom-48 -right-40 size-[560px] rounded-full blur-3xl"
          style={{ background: "color-mix(in oklab, var(--accent) 30%, transparent)" }}
        />
        {[
          "left-[8%] top-[14%] -rotate-12",
          "right-[10%] top-[20%] rotate-12",
          "left-[14%] bottom-[12%] rotate-6",
          "right-[12%] bottom-[16%] -rotate-6",
        ].map((pos) => (
          <div
            key={pos}
            className={`absolute hidden h-32 w-52 rounded-2xl border border-primary/20 bg-card/20 backdrop-blur-[2px] md:block ${pos}`}
          >
            <div className="ml-5 mt-8 h-6 w-9 rounded-md border border-primary/25" />
            <div className="mx-5 mt-8 h-1.5 rounded-full bg-primary/15" />
          </div>
        ))}
      </div>
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card/90 p-7 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <p className="font-display text-sm font-semibold tracking-tight text-foreground">
            GrowthHub
          </p>
        </div>
        <h1 className="mt-4 font-display text-xl font-semibold leading-tight tracking-tight text-foreground">
          Your growth command center.
        </h1>
        <p className="mt-2 text-sm leading-snug text-muted-foreground">
          Add your website or app and get your market size, competitors, audits, growth playbook and
          unit economics in one place, with AI growth agents turning it into next actions.
        </p>
        <p className="mt-4 border-t border-border pt-4 text-xs leading-snug text-muted-foreground">
          Sign in with your email. We'll send you a sign-in link and an 8-digit code. Use your work email to share companies with teammates.
        </p>

        {step === "email" ? (
          <form onSubmit={sendCode} className="mt-5 space-y-3">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (refusedEmail) onRetry();
              }}
              placeholder="you@workemail"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Send me a code
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-5 space-y-3">
            <p className="text-xs text-muted-foreground">
              We emailed <span className="text-foreground">{email}</span> — paste the 8-digit
              code, or just click the link in that email.
            </p>
            <input
              inputMode="numeric"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="12345678"
              className="tabular w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-lg tracking-[0.3em] text-foreground outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
          </form>
        )}

        {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
