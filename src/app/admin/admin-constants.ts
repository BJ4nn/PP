import { ApplicationStatus, JobStatus } from "@/types";

export const tabs = [
  { label: "Prehľad", value: "overview" },
  { label: "Používatelia", value: "users" },
  { label: "Zmeny", value: "jobs" },
  { label: "Prihlášky", value: "applications" },
] as const;

export type TabValue = (typeof tabs)[number]["value"];

export const jobStatusStyles: Record<JobStatus, string> = {
  [JobStatus.OPEN]: "bg-emerald-100 text-emerald-900",
  [JobStatus.FULL]: "bg-blue-100 text-blue-900",
  [JobStatus.CLOSED]: "bg-gray-200 text-gray-700",
  [JobStatus.CANCELLED]: "bg-rose-100 text-rose-900",
};

export const jobStatusLabels: Record<JobStatus, string> = {
  [JobStatus.OPEN]: "Otvorená",
  [JobStatus.FULL]: "Obsadená",
  [JobStatus.CLOSED]: "Uzavretá",
  [JobStatus.CANCELLED]: "Zrušená",
};

export const applicationStatusStyles: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING]: "bg-amber-100 text-amber-900",
  [ApplicationStatus.CONFIRMED]: "bg-emerald-100 text-emerald-900",
  [ApplicationStatus.REJECTED]: "bg-gray-200 text-gray-700",
  [ApplicationStatus.CANCELLED_BY_WORKER]: "bg-gray-200 text-gray-700",
  [ApplicationStatus.CANCELLED_BY_COMPANY]: "bg-rose-100 text-rose-900",
  [ApplicationStatus.WORKER_CANCELED_LATE]: "bg-rose-100 text-rose-900",
  [ApplicationStatus.COMPANY_CANCELED_LATE]: "bg-rose-100 text-rose-900",
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING]: "Čaká na potvrdenie",
  [ApplicationStatus.CONFIRMED]: "Potvrdené",
  [ApplicationStatus.REJECTED]: "Zamietnuté",
  [ApplicationStatus.CANCELLED_BY_WORKER]: "Zrušené pracovníkom",
  [ApplicationStatus.CANCELLED_BY_COMPANY]: "Zrušené firmou",
  [ApplicationStatus.WORKER_CANCELED_LATE]: "Neskoré zrušenie (worker)",
  [ApplicationStatus.COMPANY_CANCELED_LATE]: "Neskoré zrušenie (firma)",
};
