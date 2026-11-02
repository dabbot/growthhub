import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dashboardQueryOptions } from "@/lib/dashboard-query";
import { saveActuals } from "@/lib/actuals.functions";
import { readSpreadsheet, pick, pickName } from "@/lib/parse-actuals";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload actual data — GrowthHub" },
      {
        name: "description",
        content:
          "Replace the modelled Acme figures with real ones: funnel, monthly actives and penetration by bank.",
      },
      { property: "og:title", content: "Upload actual data — GrowthHub" },
      {
        property: "og:description",
        content: "Put Acme's own numbers into the dashboard so every screen recalculates on facts.",
      },
    ],
  }),
  component: CompanyView,
  errorComponent: ({ error }) => <p role="alert">{(error as Error).message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

function UploadPage() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const qc = useQueryClient();

  const fv = (key: string) =>
    String(data.funnel.find((f) => f.key === key)?.value_m ?? "");

  const [installed, setInstalled] = useState(fv("installed"));
  const [gate, setGate] = useState(fv("gate"));
  const [active, setActive] = useState(fv("active"));
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [mau, setMau] = useState(fv("active"));
  const [source, setSource] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [pen, setPen] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      data.penetration.map((p) => [p.issuer_slug, String(p.brand_penetration_pct)]),
    ),
  );
  const [ppen, setPpen] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.personas.map((p) => [p.slug, String(p.penetration_pct)])),
  );

  const save = useMutation({
    mutationFn: () =>
      saveActuals({
        data: {
          source,
          funnel: { installed: Number(installed), gate: Number(gate), active: Number(active) },
          brandMau: mau ? { month: `${month}-01`, mau_m: Number(mau) } : null,
          penetration: Object.entries(pen).map(([issuer_slug, v]) => ({
            issuer_slug,
            pct: Number(v),
          })),
          personas: Object.entries(ppen).map(([slug, v]) => ({ slug, pct: Number(v) })),
        },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Saved. Every screen now uses these numbers.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onFile = async (file: File | null) => {
    if (!file) return;
    try {
      const rows = await readSpreadsheet(file);
      if (rows.length === 0) throw new Error("No numbers found in that file.");
      let filled = 0;
      const set = (v: number | null, fn: (s: string) => void) => {
        if (v === null) return;
        fn(String(v));
        filled++;
      };
      set(pick(rows, ["installs"], ["installed"], ["downloads"]), setInstalled);
      set(pick(rows, ["score", "gate"], ["qualified"], ["passed"]), setGate);
      set(
        pick(rows, ["monthly", "active"], ["mau"], ["active"]),
        (v) => {
          setActive(v);
          setMau(v);
        },
      );
      setPen((s) => {
        const next = { ...s };
        for (const i of data.issuers) {
          const v = pickName(rows, i.name);
          if (v !== null) {
            next[i.slug] = String(v);
            filled++;
          }
        }
        return next;
      });
      setPpen((s) => {
        const next = { ...s };
        for (const p of data.personas) {
          const v = pickName(rows, p.name);
          if (v !== null) {
            next[p.slug] = String(v);
            filled++;
          }
        }
        return next;
      });
      setSource((s) => s || `From ${file.name}`);
      setFileName(file.name);
      toast.success(
        filled > 0
          ? `Read ${file.name}. Filled ${filled} field${filled === 1 ? "" : "s"} — check them below, then save.`
          : `Read ${file.name}, but no matching labels were found. Fill the fields below.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read that file.");
    }
  };

  return (
    <div>
      <PageHeader
        step="15 · Upload actual data"
        title="Upload Acme's actual data"
        question="Until these are filled in from Acme's own reporting, the funnel, monthly actives and bank-by-bank penetration on this dashboard are estimates. Upload your MIS or fill the data below, and every screen recalculates."
      />

      <Panel
        eyebrow="Start here"
        title="Upload your MIS / data — or fill the data below"
        soWhat="Drop in an Excel or CSV export and we read the numbers straight off it. Anything we can't match, you can type in below."
      >
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-2 px-6 py-8 text-center transition-colors hover:border-primary/60">
          <span className="text-sm font-medium text-foreground">
            Choose an Excel or CSV file
          </span>
          <span className="text-xs text-muted-foreground">
            One row per figure: a label in the first column (e.g. “Installs”, “HDFC Bank”) and the
            number next to it. .xlsx, .xls or .csv
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(e) => {
              void onFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          {fileName ? (
            <span className="mt-1 text-xs text-primary">Read from {fileName}</span>
          ) : null}
        </label>
      </Panel>

      <Panel
        className="mt-4"
        eyebrow="Acme funnel"
        title="Installs, score gate, monthly actives"
        soWhat="These three drive the 10M opportunity screen and the headroom subtraction on screen 1."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <NumField label="People who installed (M)" value={installed} onChange={setInstalled} />
          <NumField label="Passed the score gate (M)" value={gate} onChange={setGate} />
          <NumField label="Active in the last month (M)" value={active} onChange={setActive} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <TextField label="Month for the actives figure" value={month} onChange={setMonth} type="month" />
          <NumField label="Monthly actives for that month (M)" value={mau} onChange={setMau} />
        </div>
      </Panel>

      <Panel
        className="mt-4"
        eyebrow="Penetration by bank"
        title="What share of each bank's cardholders are active on Acme"
        soWhat="This replaces the modelled penetration used on the issuer landscape and overlap screens."
        bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {data.issuers.map((i) => (
          <NumField
            key={i.slug}
            label={`${i.name} (%)`}
            value={pen[i.slug] ?? ""}
            onChange={(v) => setPen((s) => ({ ...s, [i.slug]: v }))}
          />
        ))}
      </Panel>

      <Panel
        className="mt-4"
        eyebrow="Penetration by persona"
        title="What share of each group is active on Acme"
        soWhat="This colours the treemap and the persona cards on the cardholder universe screen."
        bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {data.personas.map((p) => (
          <NumField
            key={p.slug}
            label={`${p.name} (%)`}
            value={ppen[p.slug] ?? ""}
            onChange={(v) => setPpen((s) => ({ ...s, [p.slug]: v }))}
          />
        ))}
      </Panel>

      <Panel className="mt-4" eyebrow="Provenance" title="Where these numbers came from" soWhat="Shown next to every figure you just changed, so nobody has to guess later.">
        <TextField
          label="Source note"
          value={source}
          onChange={setSource}
          placeholder="e.g. Cohort export, week ending 20 Sep 2026"
        />
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save actual data"}
        </button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Aggregates only. Never paste anything that identifies a member.
        </p>
      </Panel>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return <TextField label={label} value={value} onChange={onChange} type="number" />;
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <input
        type={type}
        step="any"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
      />
    </label>
  );
}

function CompanyView() {
  return <UploadPage />;
}
