export const UserRole = {
  WORKER: "WORKER",
  COMPANY: "COMPANY",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ExperienceLevel = {
  NONE: "NONE",
  BASIC: "BASIC",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
} as const;
export type ExperienceLevel = (typeof ExperienceLevel)[keyof typeof ExperienceLevel];

export const Region = {
  BA: "BA",
  SENEC: "SENEC",
  TRNAVA: "TRNAVA",
  GALANTA: "GALANTA",
} as const;
export type Region = (typeof Region)[keyof typeof Region];

export const WarehouseType = {
  WAREHOUSE: "WAREHOUSE",
  FULFILLMENT: "FULFILLMENT",
  RETAIL_DISTRIBUTION: "RETAIL_DISTRIBUTION",
  PRODUCTION_SUPPORT: "PRODUCTION_SUPPORT",
  OTHER: "OTHER",
} as const;
export type WarehouseType = (typeof WarehouseType)[keyof typeof WarehouseType];

export const JobPositionType = {
  PACKING: "PACKING",
  PICKING: "PICKING",
  EXPEDITION: "EXPEDITION",
  VZV: "VZV",
  GOODS_RECEIPT: "GOODS_RECEIPT",
  QUALITY_CONTROL: "QUALITY_CONTROL",
} as const;
export type JobPositionType =
  (typeof JobPositionType)[keyof typeof JobPositionType];

export const JobStatus = {
  OPEN: "OPEN",
  FULL: "FULL",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const JobWaveStage = {
  WAVE1: "WAVE1",
  WAVE2: "WAVE2",
  PUBLIC: "PUBLIC",
} as const;
export type JobWaveStage = (typeof JobWaveStage)[keyof typeof JobWaveStage];

export const ApplicationStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  CANCELLED_BY_WORKER: "CANCELLED_BY_WORKER",
  CANCELLED_BY_COMPANY: "CANCELLED_BY_COMPANY",
  WORKER_CANCELED_LATE: "WORKER_CANCELED_LATE",
  COMPANY_CANCELED_LATE: "COMPANY_CANCELED_LATE",
} as const;
export type ApplicationStatus =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const PhysicalLevel = {
  LIGHT: "LIGHT",
  MEDIUM: "MEDIUM",
  HEAVY: "HEAVY",
} as const;
export type PhysicalLevel = (typeof PhysicalLevel)[keyof typeof PhysicalLevel];

export const ApplicationPriority = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
} as const;
export type ApplicationPriority =
  (typeof ApplicationPriority)[keyof typeof ApplicationPriority];

export const NotificationType = {
  WORKER_APPLICATION_CONFIRMED: "WORKER_APPLICATION_CONFIRMED",
  WORKER_APPLICATION_REJECTED: "WORKER_APPLICATION_REJECTED",
  WORKER_APPLICATION_CANCELED_BY_COMPANY:
    "WORKER_APPLICATION_CANCELED_BY_COMPANY",
  WORKER_APPLICATION_CANCELED_LATE_BY_COMPANY:
    "WORKER_APPLICATION_CANCELED_LATE_BY_COMPANY",
  WORKER_JOB_CANCELED: "WORKER_JOB_CANCELED",
  COMPANY_NEW_APPLICATION: "COMPANY_NEW_APPLICATION",
  COMPANY_APPLICATION_CANCELED_BY_WORKER:
    "COMPANY_APPLICATION_CANCELED_BY_WORKER",
  COMPANY_APPLICATION_CANCELED_LATE_BY_WORKER:
    "COMPANY_APPLICATION_CANCELED_LATE_BY_WORKER",
  WORKER_CONTRACT_READY: "WORKER_CONTRACT_READY",
  COMPANY_CONTRACT_READY: "COMPANY_CONTRACT_READY",
  COMPANY_CONTRACT_COMPLETED: "COMPANY_CONTRACT_COMPLETED",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const ContractStatus = {
  PENDING_WORKER: "PENDING_WORKER",
  PENDING_COMPANY: "PENDING_COMPANY",
  SIGNED_BY_WORKER: "SIGNED_BY_WORKER",
  SIGNED_BY_COMPANY: "SIGNED_BY_COMPANY",
  COMPLETED: "COMPLETED",
  VOID: "VOID",
} as const;
export type ContractStatus =
  (typeof ContractStatus)[keyof typeof ContractStatus];

export const ContractType = {
  EMPLOYMENT: "EMPLOYMENT",
  TRADE_LICENSE: "TRADE_LICENSE",
} as const;
export type ContractType = (typeof ContractType)[keyof typeof ContractType];

export const NoticeWindow = {
  H12: "H12",
  H24: "H24",
  H48: "H48",
} as const;
export type NoticeWindow = (typeof NoticeWindow)[keyof typeof NoticeWindow];

export const CanceledBy = {
  WORKER: "WORKER",
  COMPANY: "COMPANY",
  SYSTEM: "SYSTEM",
} as const;
export type CanceledBy = (typeof CanceledBy)[keyof typeof CanceledBy];

export type SignaturePayloadV1 = {
  version: 1;
  strokes: Array<Array<[number, number]>>;
};

export const ShiftType = {
  MORNING: "MORNING",
  AFTERNOON: "AFTERNOON",
  NIGHT: "NIGHT",
} as const;
export type ShiftType = (typeof ShiftType)[keyof typeof ShiftType];

export const DayOfWeek = {
  MON: "MON",
  TUE: "TUE",
  WED: "WED",
  THU: "THU",
  FRI: "FRI",
  SAT: "SAT",
  SUN: "SUN",
} as const;
export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];

export type AvailabilityPreference = {
  daysOfWeek: DayOfWeek[];
  shiftTypes: ShiftType[];
};

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  meta?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
};

export type JobUrgencyLabel = "NORMAL" | "URGENT";

export type BundleSummary = {
  isBundle: boolean;
  minHours?: number | null;
  minDays?: number | null;
  bonusEur?: number | null;
  bundleHourlyRateEur?: number | null;
};

export type EarningsEstimate = {
  baseEur: number;
  bonusEur?: number;
  totalEur: number;
  note?: string;
};

export type WorkerFlexPrefs = {
  preferredContractType?: ContractType | null;
  minHourlyRate?: number | null;
  minHourlyRateEmployment?: number | null;
};

export type JobFlexConditions = {
  contractType?: ContractType | null;
  noticeWindow: NoticeWindow;
};
