import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getWorkerProfileByUserId } from "@/server/services/worker";
import { listWorkerCompanies } from "@/server/services/worker-companies";
import { AppShell } from "@/components/layout/app-shell";
import { WorkerCompanyCard } from "@/components/worker/worker-company-card";

export const metadata: Metadata = {
  title: "Moje firmy - Warehouse Flex Portal",
};

type Props = {
  searchParams?: { error?: string };
};

export default async function WorkerCompaniesPage({ searchParams }: Props) {
  const session = await requireRole(UserRole.WORKER);
  const profile = await getWorkerProfileByUserId(session.user.id);
  if (!profile || !profile.onboardingComplete) redirect("/worker/onboarding");

  const companies = await listWorkerCompanies(session.user.id);

  return (
    <AppShell
      title="Moje firmy"
      subtitle="Firmy, kde ste uz pracovali. Tu spravujete uzsiu spolupracu."
      homeHref="/worker/dashboard"
    >
      {searchParams?.error === "narrow" ? (
        <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          Uzsia spolupraca pre tuto firmu este nie je povolena.
        </div>
      ) : null}

      {companies.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Zatial nemate firmy s potvrdenou odpracovanou zmenou.
        </div>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <WorkerCompanyCard
              key={company.companyId}
              companyId={company.companyId}
              companyName={company.companyName}
              city={company.city}
              region={company.region}
              lastWorkedAtIso={company.lastWorkedAt.toISOString()}
              isPriority={company.isPriority}
              isNarrowCollaboration={company.isNarrowCollaboration}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
