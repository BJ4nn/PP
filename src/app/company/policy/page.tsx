import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pravidlá storna/no-show (Beta) · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

export default async function CompanyPolicyPage() {
  await requireRole(UserRole.COMPANY);

  return (
    <AppShell
      title="Pravidlá storna/no-show (Beta)"
      subtitle="Defaultné pravidlá, ktoré sa použijú na nové zmeny."
      homeHref="/company/dashboard"
    >
      <div className="rounded-3xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        Beta: dnes sa politika nastavuje na úrovni smeny. Tu bude firmou preferovaný default.
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Odporúčaný základ</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Storno bez penalizácie: do 24h pred začiatkom.</li>
            <li>Late cancel: po 24h → flag + možná kompenzácia.</li>
            <li>No-show: tvrdý flag + dočasný ban z priority.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Konzistentný flow</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cieľ: rovnaké pravidlá v UI aj v API (žiadne “sivé zóny”), aby sa minimalizovali spory.
          </p>
          <div className="mt-4">
            <Button asChild variant="ghost">
              <Link href="/company/settings">Späť na nastavenia</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

