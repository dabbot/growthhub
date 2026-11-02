import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "growth-dashboard-theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [light, setLight] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY) !== "dark";
    setLight(saved);
    document.documentElement.classList.toggle("light", saved);
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      window.localStorage.setItem(KEY, next ? "light" : "dark");
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Dark mode" : "Light mode"}
      className={`flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground ${className}`}
    >
      {light ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
    </button>
  );
}
