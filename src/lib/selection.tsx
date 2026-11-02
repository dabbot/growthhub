import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Ctx = {
  issuer: string | null;
  persona: string | null;
  setIssuer: (slug: string | null) => void;
  setPersona: (slug: string | null) => void;
  clear: () => void;
};

const SelectionContext = createContext<Ctx | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [issuer, setIssuer] = useState<string | null>(null);
  const [persona, setPersona] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      issuer,
      persona,
      setIssuer: (slug: string | null) => setIssuer((prev) => (prev === slug ? null : slug)),
      setPersona: (slug: string | null) => setPersona((prev) => (prev === slug ? null : slug)),
      clear: () => {
        setIssuer(null);
        setPersona(null);
      },
    }),
    [issuer, persona],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used inside SelectionProvider");
  return ctx;
}
