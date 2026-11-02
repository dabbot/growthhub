import { useAssumptions } from "@/lib/assumptions";
import { cn } from "@/lib/utils";

export type BadgeKind = "reported" | "derived" | "modeled" | string;

const styles: Record<string, string> = {
  reported: "border-reported/40 text-reported bg-reported/10",
  derived: "border-derived/40 text-derived bg-derived/10",
  modeled: "border-modeled/40 text-modeled bg-modeled/10",
};

export function DataBadge({
  kind,
  source,
  assumptionKeys = [],
  className,
}: {
  kind: BadgeKind;
  source?: string | undefined;
  assumptionKeys?: string[] | undefined;
  className?: string | undefined;
}) {
  const { list, get } = useAssumptions();
  const used = list.filter((a) => assumptionKeys.includes(a.key));

  return (
    <span className={cn("relative inline-flex group/badge align-middle", className)}>
      <span
        className={cn(
          "cursor-help rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em]",
          styles[kind] ?? styles["modeled"],
        )}
      >
        {kind}
      </span>
      <span className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden w-64 rounded-lg border border-border bg-popover p-3 text-left text-xs font-normal normal-case tracking-normal text-popover-foreground shadow-xl group-hover/badge:block">
        <span className="block font-semibold text-foreground">
          {kind === "reported"
            ? "Reported figure"
            : kind === "derived"
              ? "Derived figure"
              : "Modeled figure"}
        </span>
        {source ? <span className="mt-1 block text-muted-foreground">{source}</span> : null}
        {used.length > 0 ? (
          <span className="mt-2 block space-y-1">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Assumptions behind it
            </span>
            {used.map((a) => (
              <span key={a.key} className="block text-muted-foreground">
                {a.label}:{" "}
                <span className="tabular text-foreground">
                  {get(a.key)}
                  {a.unit === "%" ? "%" : ` ${a.unit}`}
                </span>
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </span>
  );
}
