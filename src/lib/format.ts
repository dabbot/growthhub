export function fmtM(value: number, digits = 1) {
  return `${value.toFixed(digits)}M`;
}

export function fmtPct(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

export function fmtSigned(value: number, digits = 1) {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function fmtCr(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")} cr`;
}

export function fmtRupees(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function monthLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
