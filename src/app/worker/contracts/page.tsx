import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { listWorkerContracts } from "@/server/services/contracts";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Zmluvy (Beta) · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

type ContractRow = {
  id: string;
  status: string;
  titleSnapshot: string;
  createdAt: Date;
  workerSignedAt: Date | null;
  companySignedAt: Date | null;
  job: {
    id: string;
    title: string;
    startsAt: Date;
    company: {
      companyName: string;
    };
  };
};

export default async function WorkerContractsPage() {
  const session = await requireRole(UserRole.WORKER);
  const contracts = (await listWorkerContracts(session.user.id)) as ContractRow[];

  return (
    <AppShell
      title="Zmluvy (Beta)"
      subtitle="Portál je nástroj na tvorbu/podpis/archiváciu. Zmluva je medzi firmou a pracovníkom."
      homeHref="/worker/dashboard"
    >
      <div className="rounded-3xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        Beta: toto je prvá verzia. Neskôr pribudne PDF export, verzovanie a podpisové pravidlá.
      </div>

      <div className="mt-6 space-y-3">
        {contracts.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
            Zatiaľ nemáš žiadne zmluvy. Zmluva sa vygeneruje po potvrdení prihlášky firmou.
          </div>
        ) : (
          contracts.map((doc) => (
            <div
              key={doc.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {doc.job.company.companyName}
                  </p>
                  <h2 className="text-lg font-semibold text-foreground">{doc.titleSnapshot}</h2>
                  <p className="text-sm text-muted-foreground">
                    {doc.job.title} · {format(doc.job.startsAt, "d MMM yyyy HH:mm")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Stav:{" "}
                    {doc.workerSignedAt
                      ? "podpísané"
                      : doc.companySignedAt
                        ? "čaká na tvoj podpis"
                        : "čaká na podpis firmy"}{" "}
                    · Vytvorené:{" "}
                    {format(doc.createdAt, "d MMM yyyy HH:mm")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/worker/jobs/${doc.job.id}`}>Smena</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/worker/contracts/${doc.id}`}>
                      {doc.workerSignedAt ? "Otvoriť" : "Podpísať"}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
