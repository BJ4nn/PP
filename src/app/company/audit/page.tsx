import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Audit log (Beta) · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

export default async function CompanyAuditPage() {
  await requireRole(UserRole.COMPANY);

  return (
    <AppShell
      title="Audit log (Beta)"
      subtitle="Záznamy o akciách v systéme (kto, čo, kedy)."
      homeHref="/company/dashboard"
    >
      <div className="rounded-3xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        Beta: audit log je dôležitý pre firmy (dôvera), riešenie sporov a bezpečnosť.
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        Pripravuje sa: záznamy o zmene kapacity, potvrdení/odmietnutí pracovníka, storne smeny,
        úpravách profilu a exportoch.
        <div className="mt-4">
          <Button asChild variant="ghost">
            <Link href="/company/settings">Späť na nastavenia</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

