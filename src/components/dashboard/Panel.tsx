import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  eyebrow,
  soWhat,
  right,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  eyebrow?: string;
  soWhat?: string;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("panel flex flex-col overflow-hidden", className)}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            {eyebrow ? (
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            {title ? <h2 className="text-base font-semibold">{title}</h2> : null}
          </div>
          {right}
        </header>
      )}
      <div className={cn("flex-1 px-5 py-4", bodyClassName)}>{children}</div>
      {soWhat ? (
        <footer className="border-t border-border bg-surface-2/60 px-5 py-3">
          <p className="text-sm text-muted-foreground">
            <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Why it matters
            </span>
            {soWhat}
          </p>
        </footer>
      ) : null}
    </section>
  );
}
