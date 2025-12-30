import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { ContractType, NoticeWindow, UserRole } from "@/types";
import { getCompanyProfileByUserId } from "@/server/services/company";
import { getCompanyDashboardData } from "@/server/services/company-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { CompanyShiftCalendar } from "@/components/company/company-shift-calendar";

export const metadata: Metadata = {
  title: "Môj kalendár · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ month?: string; range?: string; day?: string; jobId?: string }>;
};

export default async function CompanyCalendarPage({ searchParams }: Props) {
  const session = await requireRole(UserRole.COMPANY);
  const resolvedParams = await searchParams;
  const profile = await getCompanyProfileByUserId(session.user.id);

  if (!profile || !profile.onboardingComplete) {
    redirect("/company/onboarding");
  }
  const awaitingApproval = !profile.isApproved;

  const dayKeyRaw = (resolvedParams?.day ?? "").trim();
  const dayKey = /^\d{4}-\d{2}-\d{2}$/.test(dayKeyRaw) ? dayKeyRaw : undefined;
  const monthFromDay = dayKey ? dayKey.slice(0, 7) : undefined;
  const requestedMonthKey = resolvedParams?.month ?? monthFromDay;

  const dashboard = await getCompanyDashboardData(
    session.user.id,
    requestedMonthKey ? { monthKey: requestedMonthKey } : undefined,
  );

  const calendarDays = dashboard.days.map((day) => ({
    ...day,
    jobs: day.jobs.map((job) => ({
      ...job,
      startsAtIso: job.startsAt.toISOString(),
      endsAtIso: job.endsAt.toISOString(),
    })),
  }));

  const templateDefaults = {
    locationCity: profile.addressCity,
    locationAddress: `${profile.addressStreet}${profile.addressZip ? `, ${profile.addressZip}` : ""}`,
    region: profile.region,
    warehouseType: profile.warehouseType,
    description: `Standardna smena pre ${profile.companyName}.`,
    hourlyRate: 9,
    neededWorkers: 4,
    requiredVzv: false,
    noticeWindow: NoticeWindow.H24,
    contractType: ContractType.TRADE_LICENSE,
  };

  return (
    <AppShell
      title="Môj kalendár"
      subtitle={
        awaitingApproval
          ? "Profil čaká na schválenie administrátorom."
          : "Sledujte prihlášky a obsadenosť zmien."
      }
      homeHref="/company/dashboard"
    >
      <CompanyShiftCalendar
        monthKey={dashboard.monthKey}
        monthLabel={dashboard.monthLabel}
        days={calendarDays}
        basePath="/company/calendar"
        extraQuery={{ range: resolvedParams?.range }}
        canCreate={!awaitingApproval}
        templateDefaults={templateDefaults}
        {...(dayKey ? { initialSelectedDateKey: dayKey } : {})}
        {...(resolvedParams?.jobId ? { initialSelectedJobId: resolvedParams.jobId } : {})}
      />
    </AppShell>
  );
}
