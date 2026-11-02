import { useEffect, useState } from "react";

/** State persisted in the browser; hydrates after mount to avoid SSR mismatch. */
export function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      setValue(raw ? (JSON.parse(raw) as T) : initial);
    } catch {
      setValue(initial);
    }
    setLoadedKey(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (loadedKey !== key) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value, loadedKey]);
  return [value, setValue] as const;
}
