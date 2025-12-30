import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getCompanyProfileByUserId } from "@/server/services/company";
import { getCompanyContractTemplate } from "@/server/services/contracts";
import { getCompanyKpis } from "@/server/services/company-kpis";
import { getCompanyDashboardData } from "@/server/services/company-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { CompanyOnboardingChecklist } from "@/components/company/company-onboarding-checklist";
import { CompanyKpiCards } from "@/components/company/company-kpi-cards";
import { CompanyWorkerHistoryLists } from "@/components/company/company-worker-history-lists";
import { WorkedConfirmationsPanel, type WorkedConfirmationClientItem } from "@/components/company/worked-confirmations-panel";
import { formatShiftWindow } from "@/server/utils/shift-window";

export const metadata: Metadata = {
  title: "Panel firmy · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ range?: string }>;
};

export default async function CompanyDashboardPage({ searchParams }: Props) {
  const session = await requireRole(UserRole.COMPANY);
  const resolvedParams = await searchParams;
  const profile = await getCompanyProfileByUserId(session.user.id);

  if (!profile || !profile.onboardingComplete) {
    redirect("/company/onboarding");
  }
  const awaitingApproval = !profile.isApproved;
  const rangeRaw = resolvedParams?.range ? Number(resolvedParams.range) : 30;
  const kpis = await getCompanyKpis(profile.id, rangeRaw);
  const [dashboard, contractTemplate] = await Promise.all([
    getCompanyDashboardData(session.user.id),
    getCompanyContractTemplate(session.user.id),
  ]);

  const pendingClientItems: WorkedConfirmationClientItem[] =
    dashboard.pendingWorkedConfirmations.map((item) => ({
      applicationId: item.applicationId,
      workerName: item.worker.name,
      workerCity: item.worker.city,
      jobTitle: item.job.title,
      shiftWindow: formatShiftWindow(item.job.startsAt, item.job.endsAt),
      endedAtIso: item.job.endsAt.toISOString(),
    }));
  const jobCount = dashboard.days.reduce((sum, day) => sum + day.jobs.length, 0);
  const confirmedCount = dashboard.days.reduce(
    (sum, day) => sum + day.confirmedCount,
    0,
  );
  const hasJobs = jobCount > 0;
  const hasConfirmed = confirmedCount > 0;
  const hasWorkedConfirmed = dashboard.verifiedWorkers.length > 0;
  const hasContractTemplate = Boolean(contractTemplate?.id);
  const steps = [
    {
      id: "profile",
      title: "Dokončite profil firmy",
      description: "Vyplňte prevádzku, adresu a kontaktné údaje firmy.",
      href: "/company/onboarding",
      ctaLabel: "Upraviť profil",
      done: Boolean(profile.onboardingComplete),
    },
    {
      id: "contracts",
      title: "Nastavte zmluvnú šablónu",
      description: "Zmluva sa automaticky generuje pri potvrdení pracovníka.",
      href: "/company/contracts/template",
      ctaLabel: "Nastaviť šablónu",
      done: hasContractTemplate,
    },
    {
      id: "create-job",
      title: "Vytvorte prvú zmenu",
      description: "Definujte sadzbu, počet ľudí a vlnu rozoslania.",
      href: "/company/jobs/new",
      ctaLabel: "Vytvoriť zmenu",
      done: hasJobs,
      ...(awaitingApproval
        ? {
            disabled: true,
            disabledHint:
              "Po schválení profilu budete môcť zverejniť zmeny.",
          }
        : {}),
    },
    {
      id: "confirm",
      title: "Potvrďte pracovníkov",
      description: "Z prihlášok vyberte ľudí, ktorí majú nastúpiť.",
      href: "/company/jobs",
      ctaLabel: "Pozrieť prihlášky",
      done: hasConfirmed,
    },
    {
      id: "worked",
      title: "Potvrďte odpracované",
      description: "Po skončení zmeny potvrďte odpracované smeny.",
      href: "/company/calendar",
      ctaLabel: "Otvoriť kalendár",
      done: hasWorkedConfirmed,
    },
  ];
  const tips = [
    {
      title: "Vlny ponúk",
      description: "1. vlna = priorita, 2. vlna = overení, 3. vlna = všetci.",
    },
    {
      title: "Notice okno",
      description: "Určuje, dokedy je možné zrušiť zmenu bez kompenzácie.",
    },
    {
      title: "Prihlásení vs. potvrdení",
      description: "Prihlásení sú kandidáti; potvrdení sú záväzne vybraní.",
    },
    {
      title: "Užšia spolupráca",
      description: "Pre stálych ľudí, ktorí plánujú smeny dopredu.",
    },
  ];
  const showChecklist = steps.some((step) => !step.done);

  return (
    <AppShell
      title={`Vitajte, ${profile.companyName}`}
      subtitle={
        awaitingApproval
          ? "Profil čaká na schválenie administrátorom. Po schválení budete môcť zverejniť zmeny."
          : "Vytvárajte zmeny a sledujte prihlášky pracovníkov."
      }
      homeHref="/company/dashboard"
      variant="hero"
    >
      <div className="space-y-6">
        {showChecklist ? (
          <CompanyOnboardingChecklist steps={steps} tips={tips} />
        ) : null}
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Prevádzka</p>
              <p className="text-lg font-semibold text-foreground">
                {profile.siteName ?? "Hlavná adresa"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Región</p>
              <p className="text-lg font-semibold text-foreground">
                {profile.region}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/70 p-6 text-center">
            <p className="text-base font-medium text-muted-foreground">
              {awaitingApproval
                ? "Profil čaká na schválenie. Môžete si pozrieť štatistiky a históriu, zverejnenie nových zmien bude dostupné po schválení."
                : "Prehľad prihlášok, potvrdení a histórie pracovníkov."}
            </p>
          </div>
        </section>

        <CompanyKpiCards kpis={kpis} basePath="/company/dashboard" />

        <WorkedConfirmationsPanel items={pendingClientItems} />

        <CompanyWorkerHistoryLists
          workersWorked={dashboard.workersWorked}
          verifiedWorkers={dashboard.verifiedWorkers}
        />
      </div>
    </AppShell>
  );
}
