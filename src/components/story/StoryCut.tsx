import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StoryStep = {
  /** Small label above the headline. */
  eyebrow: string;
  headline: string;
  body: string;
  /** Hand-written aside shown next to the big figure. */
  note?: string;
  /** The one figure the sticky panel should show at this step. */
  metric?: string;
};

export type Legend = { c: string; l: string }[];

/**
 * The scrollytelling layout used across the map: one sticky picture on the left
 * that redraws itself while the reader scrolls a column of short steps on the right.
 * Every screen keeps its full tables and panels below this block — the story is a
 * way in, never a replacement for the data.
 */
export function StoryCut({
  steps,
  visual,
  legend,
  footer,
  height = "lg",
}: {
  steps: StoryStep[];
  visual: (step: number) => ReactNode;
  legend?: (step: number) => Legend;
  footer?: ReactNode;
  height?: "sm" | "lg";
}) {
  const [step, setStep] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset["step"]);
            if (!Number.isNaN(i)) setStep(i);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const el of refs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [steps.length]);

  const current = steps[step];
  const marks = legend ? legend(step) : [];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <div className="self-start lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
        <div className="panel flex flex-col justify-start gap-5 p-6">
          {current?.metric || current?.note ? (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              {current?.metric ? (
                <p className="font-display text-3xl font-semibold tabular-nums">{current.metric}</p>
              ) : null}
              {current?.note ? (
                <p className="-rotate-1 text-sm italic text-muted-foreground">{current.note}</p>
              ) : null}
            </div>
          ) : null}

          <div className={cn(height === "sm" ? "max-h-[22rem]" : "", "min-h-0 overflow-hidden")}>
            {visual(step)}
          </div>

          {marks.length > 0 ? (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {marks.map((m) => (
                <span key={m.l} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("size-2.5 rounded-[2px]", m.c)} />
                  {m.l}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex gap-1.5">
            {steps.map((s, i) => (
              <span
                key={s.headline}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-primary" : "bg-border",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        {steps.map((s, i) => (
          <div
            key={s.headline}
            data-step={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={cn(
              "flex flex-col py-3 lg:min-h-[60vh] lg:py-8",
              i === 0 ? "justify-start pt-0" : "justify-center",
            )}
          >
            <div
              className={cn(
                "panel p-6 transition-all duration-300",
                i === step ? "opacity-100" : "opacity-45",
              )}
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-primary">{s.eyebrow}</p>
              <h2 className="mt-2 font-display text-xl font-semibold sm:text-2xl">{s.headline}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </div>
        ))}
        {footer ? <div className="pb-10">{footer}</div> : null}
      </div>
    </div>
  );
}

export type StoryBar = {
  key: string;
  label: string;
  /** Bar length, in whatever unit the screen is using. */
  value: number;
  /** Right-hand figure, already formatted. */
  display: string;
  /** Tailwind background class for the bar when it is lit. */
  tone?: string;
  /** Small line under the bar. */
  caption?: string;
  /** Dimmed bars stay visible but recede — data is never removed. */
  dim?: boolean;
  /** Draws attention to the row the current step is talking about. */
  lit?: boolean;
};

/** The workhorse visual: a bar list that re-weights itself as the reader scrolls. */
export function StoryBars({ bars, max }: { bars: StoryBar[]; max?: number }) {
  const ceiling = max ?? Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="space-y-2.5 overflow-y-auto pr-1">
      {bars.map((b) => (
        <div
          key={b.key}
          className={cn("transition-opacity duration-500", b.dim ? "opacity-30" : "opacity-100")}
        >
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className={cn("truncate", b.lit ? "font-semibold text-foreground" : undefined)}>
              {b.label}
            </span>
            <span className="tabular-nums text-sm">{b.display}</span>
          </div>
          <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                b.tone ?? "bg-primary",
                b.lit ? "" : "opacity-60",
              )}
              style={{ width: `${Math.max((b.value / ceiling) * 100, 1.5)}%` }}
            />
          </div>
          {b.caption ? (
            <p className="mt-1 text-[11px] text-muted-foreground">{b.caption}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Divider between the story cut and the full data underneath it. */
export function FullDataDivider({ note }: { note: string }) {
  return (
    <div className="my-8 flex items-center gap-4">
      <div className="h-px flex-1 bg-border" />
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{note}</p>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
