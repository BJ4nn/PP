import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getCompanyDetailsForAdmin } from "@/server/services/admin-company";
import { Button } from "@/components/ui/button";
import { CompanyAdvancedToggle } from "@/components/admin/company-advanced-toggle";

export const metadata: Metadata = {
  title: "Detail firmy · Admin · Warehouse Flex Portal",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminCompanyDetailPage({ params }: Props) {
  await requireRole(UserRole.ADMIN);
  const { id } = await params;

  const result = await getCompanyDetailsForAdmin(id);
  if (!result) redirect("/admin");

  const { company, stats } = result;

  return (
    <AppShell
      title="Detail profilu firmy"
      subtitle="Náhľad údajov vyplnených firmou."
      homeHref="/admin"
      actions={
        <Button asChild variant="outline">
          <Link href="/admin">Späť do adminu</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {company.companyName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {company.addressCity}, {company.region}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {company.isApproved ? "Schválené" : "Neschválené"} ·{" "}
                {company.onboardingComplete
                  ? "Onboarding dokončený"
                  : "Onboarding nedokončený"}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Jobs: {stats.jobsCount}</p>
              <p>Open: {stats.openJobsCount}</p>
              <p>Prihlášky: {stats.applicationsCount}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm">
            <p className="font-semibold text-foreground">Advanced mode</p>
            <p className="text-xs text-muted-foreground">
              Umoznuje pokrocile nastavenia uzsej spoluprace (cutoff cas).
            </p>
            <div className="mt-3">
              <CompanyAdvancedToggle
                companyId={company.id}
                advancedModeEnabled={company.advancedModeEnabled ?? false}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Kontakt</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Kontaktná osoba</dt>
                <dd className="text-right font-medium">{company.contactName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Telefón</dt>
                <dd className="text-right font-medium">{company.contactPhone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Email (login)</dt>
                <dd className="text-right font-medium">{company.user.email}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">IČO</dt>
                <dd className="text-right font-medium">{company.ico ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Adresa</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Prevádzka</dt>
                <dd className="text-right font-medium">
                  {company.siteName ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Ulica</dt>
                <dd className="text-right font-medium">{company.addressStreet}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Mesto</dt>
                <dd className="text-right font-medium">{company.addressCity}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">PSČ</dt>
                <dd className="text-right font-medium">{company.addressZip}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Región</dt>
                <dd className="text-right font-medium">{company.region}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Typ</dt>
                <dd className="text-right font-medium">{company.warehouseType}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
