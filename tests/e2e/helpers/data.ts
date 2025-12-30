export function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function toInputDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function futureDate(hoursFromNow: number) {
  return toInputDateTime(new Date(Date.now() + hoursFromNow * 60 * 60 * 1000));
}

export function pastDate(hoursAgo: number) {
  return toInputDateTime(new Date(Date.now() - hoursAgo * 60 * 60 * 1000));
}
