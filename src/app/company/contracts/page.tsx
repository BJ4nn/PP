import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getCompanyProfileByUserId } from "@/server/services/company";
import { listCompanyContracts } from "@/server/services/contracts";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Zmluvy (Beta) · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

export default async function CompanyContractsPage() {
  const session = await requireRole(UserRole.COMPANY);
  const profile = await getCompanyProfileByUserId(session.user.id);
  if (!profile?.onboardingComplete) redirect("/company/onboarding");

  const contracts = await listCompanyContracts(session.user.id);

  return (
    <AppShell
      title="Zmluvy (Beta)"
      subtitle="Nástroj na šablóny, podpis a archiváciu zmlúv medzi firmou a pracovníkom."
      homeHref="/company/dashboard"
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/company/contracts/template">Upraviť šablónu</Link>
          </Button>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          <p className="font-semibold">Beta</p>
          <p className="mt-1">
            Toto je beta verzia. Portál poskytuje nástroj na tvorbu a archiváciu,
            zmluvné strany sú firma a pracovník.
          </p>
        </div>

        {contracts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
            Zatiaľ nemáte žiadne vygenerované zmluvy. Vzniknú po potvrdení
            pracovníka na smenu (následne ich treba podpísať firmou).
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((doc) => (
              <Link
                key={doc.id}
                href={`/company/contracts/${doc.id}`}
                className="block rounded-3xl border border-border bg-card p-4 shadow-sm hover:border-primary/60"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {doc.worker.name} · {doc.job.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(doc.job.startsAt, "d MMM yyyy HH:mm")} –{" "}
                      {format(doc.job.endsAt, "HH:mm")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stav: {doc.status}
                      {doc.companySignedAt
                        ? ` · firma podpísala: ${format(doc.companySignedAt, "d MMM HH:mm")}`
                        : " · čaká na podpis firmy"}
                      {doc.workerSignedAt
                        ? ` · worker podpísal: ${format(doc.workerSignedAt, "d MMM HH:mm")}`
                        : doc.companySignedAt
                          ? " · čaká na podpis workera"
                          : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    Otvoriť
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
