function escapeCell(value: unknown) {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (typeof value === "string") {
    const trimmed = s.trimStart();
    if (trimmed && /^[=+\-@]/.test(trimmed)) {
      s = `'${s}`;
    }
  }
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: Array<Array<unknown>>) {
  const lines: string[] = [];
  lines.push(headers.map(escapeCell).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }
  return lines.join("\n") + "\n";
}
