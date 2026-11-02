import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Assumption } from "./dashboard.functions";

type AssumptionValues = Record<string, number>;

type Ctx = {
  list: Assumption[];
  values: AssumptionValues;
  set: (key: string, value: number) => void;
  reset: () => void;
  changedCount: number;
  get: (key: string) => number;
};

const AssumptionsContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "growth-dashboard-assumptions";

export function AssumptionsProvider({
  list,
  children,
}: {
  list: Assumption[];
  children: ReactNode;
}) {
  const defaults = useMemo(() => {
    const out: AssumptionValues = {};
    for (const a of list) out[a.key] = a.value;
    return out;
  }, [list]);

  const [values, setValues] = useState<AssumptionValues>(defaults);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setValues({ ...defaults, ...(JSON.parse(raw) as AssumptionValues) });
    } catch {
      /* ignore */
    }
  }, [defaults]);

  const set = useCallback((key: string, value: number) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const next: AssumptionValues = {};
    for (const a of list) next[a.key] = a.default_value;
    setValues(next);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [list]);

  const changedCount = list.filter((a) => (values[a.key] ?? a.value) !== a.default_value).length;

  const get = useCallback(
    (key: string) => values[key] ?? defaults[key] ?? 0,
    [values, defaults],
  );

  return (
    <AssumptionsContext.Provider value={{ list, values, set, reset, changedCount, get }}>
      {children}
    </AssumptionsContext.Provider>
  );
}

export function useAssumptions() {
  const ctx = useContext(AssumptionsContext);
  if (!ctx) throw new Error("useAssumptions must be used inside AssumptionsProvider");
  return ctx;
}
