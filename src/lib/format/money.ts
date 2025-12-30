const eurFormatter = new Intl.NumberFormat("sk-SK", {
  style: "currency",
  currency: "EUR",
});

export function formatEur(value: number, options?: Intl.NumberFormatOptions) {
  if (!Number.isFinite(value)) return "—";
  if (!options) return eurFormatter.format(value);
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: "EUR",
    ...options,
  }).format(value);
}

export function formatHourlyRateEur(rate: number) {
  return `${formatEur(rate, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h`;
}

