import { JobStatus } from "@/types";

export function statusBadgeForClient(status: string) {
  if (status === JobStatus.OPEN) return "bg-emerald-50 text-emerald-800";
  if (status === JobStatus.FULL) return "bg-blue-50 text-blue-800";
  if (status === JobStatus.CLOSED) return "bg-muted text-muted-foreground";
  if (status === JobStatus.CANCELLED) return "bg-rose-50 text-rose-800";
  return "bg-muted text-muted-foreground";
}

