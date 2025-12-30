import Link from "next/link";
import { format } from "date-fns";
import { CompanyApprovalToggle } from "@/components/admin/company-approval-toggle";
import { CompanyRejectButton } from "@/components/admin/company-reject-button";
import { Button } from "@/components/ui/button";
import type { AdminDashboardData } from "@/app/admin/admin-types";

export function CompanyApprovals({
  pendingCompanies,
}: {
  pendingCompanies: AdminDashboardData["pendingCompanies"];
}) {
  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Schvaľovanie firiem
        </h2>
        <p className="text-sm text-muted-foreground">
          Firmy po vyplnení profilu sa musia potvrdiť tu.
        </p>
      </div>
      {pendingCompanies.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Žiadne firmy momentálne nečakajú na schválenie.
        </p>
      ) : (
        <div className="space-y-3">
          {pendingCompanies.map((company) => (
            <div
              key={company.id}
              className="flex flex-col gap-2 rounded-2xl border border-border/70 p-3 text-sm md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {company.companyName}
                </p>
                <p className="text-muted-foreground">
                  {company.addressCity}, {company.region}
                </p>
                <p className="text-xs text-muted-foreground">
                  {company.isApproved ? "Schválené" : "Čaká na schválenie"} ·{" "}
                  {format(company.createdAt, "d MMM yyyy HH:mm")}
                </p>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                <CompanyApprovalToggle
                  companyId={company.id}
                  isApproved={company.isApproved}
                />
                <CompanyRejectButton companyId={company.id} />
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/companies/${company.id}`}>Detail profilu</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
