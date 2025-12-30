import type { JobStatus } from "@/types";

export type CalendarJobClientItem = {
  id: string;
  title: string;
  status: JobStatus;
  startsAtIso: string;
  endsAtIso: string;
  neededWorkers: number;
  applicantsCount: number;
  confirmedCount: number;
  missingCount: number;
};

export type CalendarDayClient = {
  dateKey: string; // YYYY-MM-DD (UTC)
  jobs: CalendarJobClientItem[];
  applicantsCount: number;
  confirmedCount: number;
  neededWorkers: number;
  missingCount: number;
};

export type CompanyJobApplicationClient = {
  id: string;
  status: string;
  note?: string | null;
  workedConfirmedAt?: string | null;
  hasCompletedContractWithCompany?: boolean;
  contractDocument?: {
    id: string;
    status: string;
    companySignedAt?: string | null;
    workerSignedAt?: string | null;
  } | null;
  worker: {
    id: string;
    name: string;
    city?: string | null;
    reliabilityScore?: number | null;
  };
};

export type CompanyJobDetailsClient = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  neededWorkers: number;
  status: string;
  applications: CompanyJobApplicationClient[];
};
