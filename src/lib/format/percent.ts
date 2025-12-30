export function formatPercent(value: number | null, options?: { digits?: number }) {
  if (value === null) return "—";
  const digits = options?.digits ?? 0;
  const pct = value * 100;
  return `${pct.toFixed(digits)}%`;
}

