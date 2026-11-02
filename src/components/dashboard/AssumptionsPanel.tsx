import { useAssumptions } from "@/lib/assumptions";

export function AssumptionsPanel({ onClose }: { onClose: () => void }) {
  const { list, get, set, reset, changedCount } = useAssumptions();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close assumptions"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl">
        <header className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Assumptions</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Argue with the inputs and watch the Board, Overlap and Playbook move.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {list.map((a) => {
            const value = get(a.key);
            const changed = value !== a.default_value;
            return (
              <div key={a.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor={a.key} className="text-sm font-medium">
                    {a.label}
                  </label>
                  <span className="tabular text-sm font-semibold text-primary">
                    {value}
                    {a.unit === "%" ? "%" : ` ${a.unit}`}
                    {changed ? (
                      <span className="ml-2 rounded-full bg-modeled/15 px-1.5 py-px text-[9px] uppercase tracking-wider text-modeled">
                        changed
                      </span>
                    ) : null}
                  </span>
                </div>
                <input
                  id={a.key}
                  type="range"
                  min={a.min_value}
                  max={a.max_value}
                  step={a.step}
                  value={value}
                  onChange={(e) => set(a.key, Number(e.target.value))}
                  className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-primary"
                />
                <p className="mt-2 text-xs text-muted-foreground">{a.note}</p>
              </div>
            );
          })}
        </div>

        <footer className="flex items-center justify-between border-t border-border px-5 py-4">
          <span className="text-xs text-muted-foreground">
            {changedCount === 0
              ? "All inputs at their default values"
              : `${changedCount} input${changedCount > 1 ? "s" : ""} changed from default`}
          </span>
          <button
            onClick={reset}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-2"
          >
            Reset to default
          </button>
        </footer>
      </aside>
    </div>
  );
}
