import * as XLSX from "xlsx";

export type ParsedRow = { label: string; value: number };

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Flatten every sheet into label/number pairs: first text cell in a row is the
 * label, the first numeric cell after it is the value. */
export async function readSpreadsheet(file: File): Promise<ParsedRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const out: ParsedRow[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
    });
    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      let label = "";
      for (const cell of row) {
        if (label === "") {
          if (typeof cell === "string" && norm(cell)) label = norm(cell);
          continue;
        }
        const n =
          typeof cell === "number"
            ? cell
            : typeof cell === "string" && cell.trim() !== "" && !Number.isNaN(Number(cell.replace(/[,%₹\s]/g, "")))
              ? Number(cell.replace(/[,%₹\s]/g, ""))
              : null;
        if (n !== null && Number.isFinite(n)) {
          out.push({ label, value: n });
          break;
        }
      }
    }
  }
  return out;
}

/** Find the first row whose label contains all of the given words. */
export function pick(rows: ParsedRow[], ...variants: string[][]): number | null {
  for (const words of variants) {
    const hit = rows.find((r) => words.every((w) => r.label.includes(norm(w))));
    if (hit) return hit.value;
  }
  return null;
}

/** Match a name (bank or persona) against the row labels. */
export function pickName(rows: ParsedRow[], name: string): number | null {
  const n = norm(name);
  const hit =
    rows.find((r) => r.label === n) ??
    rows.find((r) => r.label.includes(n) || n.includes(r.label));
  return hit ? hit.value : null;
}
