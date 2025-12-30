import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getWorkerProfileByUserId } from "@/server/services/worker";
import { AppShell } from "@/components/layout/app-shell";
import { WorkerShiftCalendar } from "@/components/worker/shift-calendar/worker-shift-calendar";
import { getWorkerCalendarData } from "@/server/services/worker-calendar";

export const metadata: Metadata = {
  title: "Môj kalendár · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ month?: string; day?: string }>;
};

function currentMonthKeyUtc() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default async function WorkerCalendarPage({ searchParams }: Props) {
  const session = await requireRole(UserRole.WORKER);
  const profile = await getWorkerProfileByUserId(session.user.id);
  if (!profile || !profile.onboardingComplete) redirect("/worker/onboarding");

  const resolvedParams = await searchParams;
  const dayKeyRaw = (resolvedParams?.day ?? "").trim();
  const dayKey = /^\d{4}-\d{2}-\d{2}$/.test(dayKeyRaw) ? dayKeyRaw : undefined;
  const monthFromDay = dayKey ? dayKey.slice(0, 7) : undefined;
  const requestedMonthKey = (resolvedParams?.month ?? monthFromDay ?? "").trim();
  const monthKey = /^\d{4}-\d{2}$/.test(requestedMonthKey)
    ? requestedMonthKey
    : currentMonthKeyUtc();

  const calendar = await getWorkerCalendarData(session.user.id, monthKey);

  return (
    <AppShell
      title="Môj kalendár"
      subtitle="Prehľad mojich zmien a dostupných ponúk podľa dní."
      homeHref="/worker/dashboard"
    >
      <WorkerShiftCalendar
        monthKey={calendar.monthKey}
        monthLabel={calendar.monthLabel}
        days={calendar.days}
        basePath="/worker/calendar"
        {...(dayKey ? { initialSelectedDateKey: dayKey } : {})}
      />
    </AppShell>
  );
}

