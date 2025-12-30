import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import {
  ContractType,
  JobWaveStage,
  NoticeWindow,
  Region,
  UserRole,
  WarehouseType,
} from "@/types";
import { getCompanyProfileByUserId } from "@/server/services/company";
import { AppShell } from "@/components/layout/app-shell";
import { JobForm } from "@/components/company/job-form";

export const metadata: Metadata = {
  title: "Nová ponuka · Warehouse Flex Portal",
};

type Props = {
  searchParams: Promise<{
    date?: string;
    startsAt?: string;
    title?: string;
    description?: string;
    durationHours?: string;
    neededWorkers?: string;
    hourlyRate?: string;
    locationCity?: string;
    locationAddress?: string;
    region?: string;
    warehouseType?: string;
    requiredVzv?: string;
    noticeWindow?: string;
    contractType?: string;
    waveStage?: string;
  }>;
};

function normalizeStartsAtFromParams(params: { date?: string; startsAt?: string }) {
  const startsAtRaw = (params.startsAt ?? "").trim();
  if (startsAtRaw && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAtRaw)) {
    return startsAtRaw;
  }

  const dateRaw = (params.date ?? "").trim();
  if (dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    return `${dateRaw}T08:00`;
  }

  return undefined;
}

function parsePositiveInt(value: string | undefined, min: number, max: number) {
  const raw = (value ?? "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n)) return undefined;
  if (n < min || n > max) return undefined;
  return n;
}

function parsePositiveNumber(value: string | undefined, min: number, max: number) {
  const raw = (value ?? "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  if (n < min || n > max) return undefined;
  return n;
}

function parseEnumValue<T extends Record<string, string>>(
  value: string | undefined,
  options: T,
) {
  const raw = (value ?? "").trim();
  if (!raw) return undefined;
  const values = Object.values(options) as string[];
  return values.includes(raw) ? (raw as T[keyof T]) : undefined;
}

function parseBoolean(value: string | undefined) {
  const raw = (value ?? "").trim().toLowerCase();
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

export default async function NewJobPage({ searchParams }: Props) {
  const session = await requireRole(UserRole.COMPANY);
  const resolvedParams = await searchParams;
  const profile = await getCompanyProfileByUserId(session.user.id);
  if (!profile?.onboardingComplete) {
    redirect("/company/onboarding");
  }
  if (!profile.isApproved) {
    return (
      <AppShell
        title="Zverejniť zmenu"
        subtitle="Profil ešte nie je schválený administrátorom. Počkajte prosím na potvrdenie."
        homeHref="/company/dashboard"
      >
        <div className="rounded-3xl border border-border bg-card p-6 text-center text-muted-foreground">
          Vaša firma je momentálne v schvaľovaní. Zmeny bude možné zverejniť hneď po potvrdení.
        </div>
      </AppShell>
    );
  }

  const startsAt = normalizeStartsAtFromParams(resolvedParams ?? {});
  const title = (resolvedParams?.title ?? "").trim() || undefined;
  const description = (resolvedParams?.description ?? "").trim() || undefined;
  const durationHours = parsePositiveInt(resolvedParams?.durationHours, 1, 24);
  const neededWorkers = parsePositiveInt(resolvedParams?.neededWorkers, 1, 999);
  const hourlyRate = parsePositiveNumber(resolvedParams?.hourlyRate, 0.01, 999);
  const locationCity = (resolvedParams?.locationCity ?? "").trim() || undefined;
  const locationAddress = (resolvedParams?.locationAddress ?? "").trim() || undefined;
  const region = parseEnumValue(resolvedParams?.region, Region);
  const warehouseType = parseEnumValue(resolvedParams?.warehouseType, WarehouseType);
  const requiredVzv = parseBoolean(resolvedParams?.requiredVzv);
  const noticeWindow = parseEnumValue(resolvedParams?.noticeWindow, NoticeWindow);
  const contractType = parseEnumValue(resolvedParams?.contractType, ContractType);
  const waveStage = parseEnumValue(resolvedParams?.waveStage, JobWaveStage);

  const fallbackCity = profile?.addressCity?.trim() || undefined;
  const fallbackAddress = profile?.addressStreet
    ? `${profile.addressStreet}${profile.addressZip ? `, ${profile.addressZip}` : ""}`
    : undefined;
  const fallbackRegion = profile?.region ?? undefined;
  const fallbackWarehouse = profile?.warehouseType ?? undefined;

  const defaultValues =
    startsAt ||
    title ||
    description ||
    durationHours ||
    neededWorkers ||
    hourlyRate ||
    locationCity ||
    locationAddress ||
    region ||
    warehouseType ||
    requiredVzv !== undefined ||
    noticeWindow ||
    contractType ||
    waveStage ||
    fallbackCity ||
    fallbackAddress ||
    fallbackRegion ||
    fallbackWarehouse
      ? {
          ...(startsAt ? { startsAt } : {}),
          ...(title ? { title } : {}),
          ...(description ? { description } : {}),
          ...(durationHours ? { durationHours } : {}),
          ...(neededWorkers ? { neededWorkers } : {}),
          ...(hourlyRate ? { hourlyRate } : {}),
          ...(locationCity ? { locationCity } : fallbackCity ? { locationCity: fallbackCity } : {}),
          ...(locationAddress
            ? { locationAddress }
            : fallbackAddress
              ? { locationAddress: fallbackAddress }
              : {}),
          ...(region ? { region } : fallbackRegion ? { region: fallbackRegion } : {}),
          ...(warehouseType
            ? { warehouseType }
            : fallbackWarehouse
              ? { warehouseType: fallbackWarehouse }
              : {}),
          ...(requiredVzv !== undefined ? { requiredVzv } : {}),
          ...(noticeWindow ? { noticeWindow } : {}),
          ...(contractType ? { contractType } : {}),
          ...(waveStage ? { waveStage } : {}),
        }
      : undefined;

  return (
    <AppShell
      title="Zverejniť zmenu"
      subtitle="Uveďte presné detaily, aby pracovníci vedeli, čo ich čaká."
      homeHref="/company/dashboard"
    >
      <JobForm mode="create" {...(defaultValues ? { defaultValues } : {})} />
    </AppShell>
  );
}
