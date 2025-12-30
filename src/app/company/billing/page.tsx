import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Free trial a platby (Beta) · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

export default async function CompanyBillingPage() {
  await requireRole(UserRole.COMPANY);

  return (
    <AppShell
      title="Free trial a platby (Beta)"
      subtitle="Návrh logiky: 3 inzeráty zdarma (trial), potom upgrade na plán."
      homeHref="/company/dashboard"
    >
      <div className="rounded-3xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        Beta: zatiaľ len UI skeleton. Implementácia limitov a platieb príde neskôr.
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Trial</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Limit: 3 publikované zmeny (inzeráty) zdarma.</li>
            <li>Po vyčerpaní: vytváranie novej zmeny vyžaduje upgrade.</li>
            <li>História/dochádzka/export zostávajú dostupné aj po triale.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Plány</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Návrh: mesačný/štvrťročný/ročný prístup + voliteľné premium doplnky.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" disabled>
              Upgrade (pripravuje sa)
            </Button>
            <Button asChild variant="ghost">
              <Link href="/company/settings">Späť na nastavenia</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

