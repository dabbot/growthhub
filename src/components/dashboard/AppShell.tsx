import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { logPageView } from "@/lib/page-views.functions";
import { SlidersHorizontal, Menu, X, Plug, ChevronDown, Plus } from "lucide-react";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { ThemeToggle } from "./ThemeToggle";
import { useAssumptions } from "@/lib/assumptions";
import { useSelection } from "@/lib/selection";
import { useCompany } from "@/lib/company";
import { BRAND } from "@/lib/brand";
import { SECTIONS } from "@/lib/sections";
import { GenericDashboard } from "./GenericDashboard";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", n: "1", label: "The Addressable Market" },
  { to: "/opportunity", n: "2", label: "The 10M Opportunity" },
  { to: "/issuers", n: "3", label: "Issuer Landscape" },
  { to: "/universe", n: "4", label: "Cardholder Universe" },
  { to: "/overlap", n: "5", label: `${BRAND.name} Overlap` },
  { to: "/competitors", n: "6", label: "Competitors" },
  { to: "/platforms", n: "7", label: "Where They Live" },
  { to: "/marketing", n: "8", label: "Marketing Audit" },
  { to: "/aso", n: "9", label: "ASO & SEO Audit" },
  { to: "/playbook", n: "10", label: "Growth Playbook" },
  { to: "/allocator", n: "11", label: "Budget Allocator" },
  { to: "/unit-economics", n: "12", label: "Unit Economics" },
  { to: "/cross-sell", n: "13", label: "Cross-Sell Headroom" },
  { to: "/experiments", n: "14", label: "Growth Experiments" },
  { to: "/campaigns", n: "15", label: "Run Campaigns" },
  { to: "/variance", n: "16", label: "Model vs Actual" },
  { to: "/calendar", n: "17", label: "Growth Calendar" },
  { to: "/agents", n: "18", label: "Growth Agents" },
  { to: "/ask", n: "19", label: "Ask the Map" },
  { to: "/sources", n: "20", label: "Sources & Method" },
  { to: "/story", n: "21", label: "The Scrollytelling Cut" },
  { to: "/upload", n: "22", label: "Upload actual data" },
  { to: "/connectors", n: "23", label: "Data Connectors" },
] as const;

/** Pages that work the same for every company, outside the generated sections. */
const OWN_PAGES = ["/start", "/admin", "/connectors"];

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const { current, companies, isAdmin, selectCompany } = useCompany();
  const demo = current?.demo ?? true;
  const navigate = useNavigate();
  const { changedCount } = useAssumptions();
  const { issuer, persona, clear } = useSelection();
  const [hintStep, setHintStep] = useState(-1);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    void logPageView({ data: { path: pathname, company: current?.slug ?? BRAND.key } }).catch(() => {});
  }, [pathname, current?.slug]);
  useEffect(() => {
    try {
      if (!window.localStorage.getItem("growth-dashboard-hints-seen")) setHintStep(0);
    } catch {
      /* ignore */
    }
  }, []);
  const nextHint = () => {
    if (hintStep < 2) return setHintStep(hintStep + 1);
    setHintStep(-1);
    try {
      window.localStorage.setItem("growth-dashboard-hints-seen", "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <div>
            <p className="font-display text-sm font-semibold tracking-tight">GrowthHub</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Size the market, find the winnable audience, and turn it into campaigns you can run
            </p>
          </div>
          <button
            className="lg:hidden"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 pb-5">
          <label htmlFor="company-select" className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Company
          </label>
          <div className="relative mt-1.5">
            <select
              id="company-select"
              value={current?.id ?? ""}
              onChange={(e) => {
                selectCompany(e.target.value);
                void navigate({ to: "/" });
              }}
              className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm font-medium text-foreground"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.sector ? ` · ${c.sector}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Link
            to="/start"
            onClick={() => setNavOpen(false)}
            className={cn(
              "mt-2 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium",
              companies.every((c) => c.demo)
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-dashed border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <Plus className="size-3.5" /> Add your company
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.filter((item) => {
            if (demo) return true;
            const key = SECTIONS.find((d) => d.path === item.to)?.key;
            const m = current?.section_map.find((x) => x.key === key);
            return !m || m.include;
          }).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setNavOpen(false)}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground border-primary/50",
              }}
              inactiveProps={{ className: "border-transparent text-muted-foreground" }}
              className={cn(item.to === "/connectors" && "lg:hidden", "flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}
            >
              <span className="tabular text-[10px] text-primary">{item.n}</span>
              {demo
                ? item.label
                : (current?.section_map.find((x) => x.key === SECTIONS.find((d) => d.path === item.to)?.key)?.label ?? item.label)}
            </Link>
          ))}
          {isAdmin ? (
            <Link
              to="/admin"
              onClick={() => setNavOpen(false)}
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground border-primary/50" }}
              inactiveProps={{ className: "border-transparent text-muted-foreground" }}
              className="mt-3 flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm hover:bg-sidebar-accent"
            >
              <span className="tabular text-[10px] text-primary">★</span>
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="space-y-2 px-3 pb-5">
          {(issuer || persona) && (
            <button
              onClick={clear}
              className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filter{issuer && persona ? "s" : ""}
            </button>
          )}
        </div>
      </aside>

      {navOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-background/70 lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="flex items-center gap-2 text-sm"
          >
            <Menu className="size-4" />
            Menu
          </button>
          <ThemeToggle className="ml-auto mr-3" />
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 text-sm text-primary"
          >
            <SlidersHorizontal className="size-4" />
            Assumptions
          </button>
        </div>
        <div className="flex items-center justify-end gap-4 border-b border-border px-4 py-2 sm:px-6 lg:px-10">
          <div className="relative hidden lg:block">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/25"
          >
              <SlidersHorizontal className="size-3.5" />
              Assumptions
              {changedCount > 0 ? (
                <span className="tabular rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {changedCount}
                </span>
              ) : null}
            </button>
            {hintStep === 1 ? <Hint onNext={nextHint} label="Next">Tweak the dials behind every number — the whole dashboard recalculates.</Hint> : null}
          </div>
          <div className="relative hidden lg:block">
          <Link
            to="/connectors"
            activeProps={{ className: "bg-primary/25" }}
            className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/25"
          >
            <Plug className="size-3.5" />
            Data Connectors
          </Link>
            {hintStep === 0 ? <Hint onNext={nextHint} label="Next">Plug in your ads, analytics and SEO tools to feed in real data.</Hint> : null}
          </div>
          <div className="relative hidden lg:block">
            <ThemeToggle />
            {hintStep === 2 ? <Hint onNext={nextHint} label="Got it">Switch between light and dark mode.</Hint> : null}
          </div>
          <ThemeToggle className="lg:hidden" />
          <SignOutRow />
        </div>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {demo || OWN_PAGES.includes(pathname) ? children : <GenericDashboard />}
        </main>
      </div>

      {open ? <AssumptionsPanel onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function SignOutRow() {
  const [email, setEmail] = useState<string | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);

  if (!email) return null;

  return (
    <div className="flex items-center gap-3">
      <p className="max-w-[16rem] truncate text-xs text-muted-foreground">{email}</p>
      <button
        onClick={async () => {
          await qc.cancelQueries();
          qc.clear();
          await supabase.auth.signOut();
          void navigate({ to: "/", replace: true });
        }}
        className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}

function Hint({ children, onNext, label }: { children: ReactNode; onNext: () => void; label: string }) {
  return (
    <div className="absolute right-0 top-full z-50 mt-3 w-52 rounded-lg border border-primary/40 bg-popover p-3 text-xs leading-snug text-popover-foreground shadow-lg">
      <span className="absolute -top-1.5 right-4 size-3 rotate-45 border-l border-t border-primary/40 bg-popover" />
      {children}
      <button
        onClick={onNext}
        className="mt-2 block rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
      >
        {label}
      </button>
    </div>
  );
}
