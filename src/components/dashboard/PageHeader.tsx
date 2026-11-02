export function PageHeader({
  step,
  title,
  question,
  right,
}: {
  step: string;
  title: string;
  question: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-primary">{step}</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">{question}</p>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}

