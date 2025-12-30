import { format } from "date-fns";
import { JobStatus } from "@/types";

export function parseMonthKey(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function addMonths(monthKey: string, delta: number) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return monthKey;
  const d = new Date(Date.UTC(parsed.year, parsed.month - 1 + delta, 1, 0, 0, 0));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function buildHref(
  basePath: string,
  monthKey: string,
  extraQuery?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  params.set("month", monthKey);
  for (const [key, value] of Object.entries(extraQuery ?? {})) {
    if (value === undefined) continue;
    params.set(key, value);
  }
  return `${basePath}?${params.toString()}`;
}

export function monthShortLabel(monthKey: string) {
  return format(new Date(`${monthKey}-01T00:00:00Z`), "MMM");
}

export function getMonthStartOffset(monthKey: string) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return 0;
  const first = new Date(Date.UTC(parsed.year, parsed.month - 1, 1, 0, 0, 0));
  const weekday = first.getUTCDay(); // 0=Sun..6=Sat
  const mondayFirst = (weekday + 6) % 7; // 0=Mon..6=Sun
  return mondayFirst;
}

export const statusBadge: Record<JobStatus, string> = {
  [JobStatus.OPEN]: "bg-emerald-50 text-emerald-800",
  [JobStatus.FULL]: "bg-blue-50 text-blue-800",
  [JobStatus.CLOSED]: "bg-muted text-muted-foreground",
  [JobStatus.CANCELLED]: "bg-rose-50 text-rose-800",
};

