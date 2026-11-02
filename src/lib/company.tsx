import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BRAND } from "./brand";
import type { Access, AccessCompany } from "./onboarding.functions";

/** Key for the hand-built demo screens and their per-company data (src/lib/growth-os.ts etc.). */
export type CompanyKey = typeof BRAND.key;

const STORAGE = "growth-dashboard-company-id";

type Ctx = {
  /** Data key used by the demo screens. */
  company: CompanyKey;
  /** The company open right now: the demo, or one added through onboarding. */
  current: AccessCompany | null;
  companies: AccessCompany[];
  isAdmin: boolean;
  requireApproval: boolean;
  selectCompany: (id: string) => void;
};

const Context = createContext<Ctx | null>(null);

export function CompanyProvider({ access, children }: { access: Access; children: ReactNode }) {
  const list = access.companies;
  // Open your own company first; fall back to the demo.
  const [id, setId] = useState<string | null>(list[0]?.id ?? null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE);
      if (saved && list.some((c) => c.id === saved)) setId(saved);
    } catch {
      /* storage unavailable: keep the default */
    }
  }, [list]);

  const value = useMemo<Ctx>(() => {
    const current = list.find((c) => c.id === id) ?? list[0] ?? null;
    return {
      company: BRAND.key,
      current,
      companies: list,
      isAdmin: access.isAdmin,
      requireApproval: access.requireApproval,
      selectCompany: (next: string) => {
        setId(next);
        try {
          window.localStorage.setItem(STORAGE, next);
        } catch {
          /* storage unavailable */
        }
      },
    };
  }, [id, list, access.isAdmin, access.requireApproval]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useCompany = () => {
  const v = useContext(Context);
  if (!v) throw new Error("useCompany used outside CompanyProvider");
  return v;
};

/** True when the open company shows the hand-built demo screens. */
export const useIsDemo = () => useCompany().current?.demo ?? true;
