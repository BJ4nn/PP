import { format } from "date-fns";
import type { AdminDashboardData } from "@/app/admin/admin-types";

export function AdminUsers({
  latestWorkers,
  latestCompanies,
}: {
  latestWorkers: AdminDashboardData["latestWorkers"];
  latestCompanies: AdminDashboardData["latestCompanies"];
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          Poslední pracovníci
        </h2>
        {latestWorkers.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Ešte neboli vytvorené profily pracovníkov.
          </p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {latestWorkers.map((worker) => (
              <li
                key={worker.id}
                className="rounded-2xl border border-border/70 p-3"
              >
                <p className="font-semibold text-foreground">{worker.name}</p>
                <p className="text-muted-foreground">
                  {worker.city}, {worker.region}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vytvorené {format(worker.createdAt, "d MMM yyyy HH:mm")} ·{" "}
                  {worker.onboardingComplete ? "Dokončené" : "Rozpracované"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Posledné firmy</h2>
        {latestCompanies.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Zatiaľ bez firemných profilov.
          </p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {latestCompanies.map((company) => (
              <li
                key={company.id}
                className="rounded-2xl border border-border/70 p-3"
              >
                <p className="font-semibold text-foreground">
                  {company.companyName}
                </p>
                <p className="text-muted-foreground">
                  {company.addressCity}, {company.region}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vytvorené {format(company.createdAt, "d MMM yyyy HH:mm")} ·{" "}
                  {company.isApproved
                    ? "Schválené"
                    : company.onboardingComplete
                      ? "Čaká na schválenie"
                      : "Rozpracované"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

