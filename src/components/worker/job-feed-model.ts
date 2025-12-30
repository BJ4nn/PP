import { ContractType, JobWaveStage, NoticeWindow, WarehouseType } from "@/types";
import { noticeLabels, warehouseLabels } from "@/lib/labels/jobs";

export type CompanyDto = {
  companyName: string;
};

export type JobDto = {
  id: string;
  title: string;
  description: string;
  locationCity: string;
  locationAddress: string;
  region: string;
  warehouseType: WarehouseType;
  startsAt: string;
  durationHours: number;
  hourlyRate: string | number;
  effectiveHourlyRate?: number;
  requiredVzv: boolean;
  isUrgent: boolean;
  urgentBonusEur: number | null;
  confirmBy: string | null;
  isBundle: boolean;
  bundleMinHours: number | null;
  bundleMinDays: number | null;
  bundleBonusEur: number | null;
  bundleHourlyRateEur: string | number | null;
  contractType: ContractType | null;
  noticeWindow: NoticeWindow;
  cancellationCompensationPct: number;
  relevanceScore: number;
  inviteStage: JobWaveStage;
  isFavoriteCompany: boolean;
  isVerifiedCompany: boolean;
  isPriorityCompany: boolean;
  company: CompanyDto;
};

export { noticeLabels, warehouseLabels };

export function parseContractType(value: string | null): ContractType | null {
  if (!value) return null;
  return (Object.values(ContractType) as string[]).includes(value)
    ? (value as ContractType)
    : null;
}

export function parseNoticeWindow(value: string | null): NoticeWindow | null {
  if (!value) return null;
  return (Object.values(NoticeWindow) as string[]).includes(value)
    ? (value as NoticeWindow)
    : null;
}
