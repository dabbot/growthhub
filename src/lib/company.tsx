import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { BRAND } from "./brand";

export type CompanyKey = typeof BRAND.key;

export const COMPANIES: { value: CompanyKey; label: string; sector: string }[] = [
  { value: BRAND.key, label: BRAND.name, sector: BRAND.sector },
];

const Ctx = createContext<{
  company: CompanyKey;
  setCompany: (c: CompanyKey) => void;
}>({ company: BRAND.key, setCompany: () => {} });

/** Single-company workspace. Kept as a provider so per-company data stays keyed. */
export function CompanyProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={{ company: BRAND.key, setCompany: () => {} }}>{children}</Ctx.Provider>;
}

export const useCompany = () => useContext(Ctx);
