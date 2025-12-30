import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Nastavenia (Beta) · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

const items = [
  {
    title: "Free trial a platby (Beta)",
    description:
      "Nastavenie trialu (3 inzeráty) + prehľad využitia a upgrade na platený plán.",
    href: "/company/billing",
    action: "Otvoriť",
  },
  {
    title: "Tím firmy (Beta)",
    description: "Viac používateľov pod jednou firmou (manager/owner) + pozvánky.",
    href: "/company/team",
    action: "Otvoriť",
  },
  {
    title: "Audit log (Beta)",
    description: "Záznamy o tom, kto čo zmenil (smeny, kapacita, potvrdenia, storna).",
    href: "/company/audit",
    action: "Otvoriť",
  },
  {
    title: "Pravidlá storna/no-show (Beta)",
    description:
      "Defaultné pravidlá (časové okná, penalizácie, kompenzácie) + konzistentný flow.",
    href: "/company/policy",
    action: "Otvoriť",
  },
] as const;

export default async function CompanySettingsPage() {
  await requireRole(UserRole.COMPANY);

  return (
    <AppShell
      title="Nastavenia (Beta)"
      subtitle="Toto sú plánované časti MVP. Sú označené ako Beta a budú sa dopĺňať postupne."
      homeHref="/company/dashboard"
    >
      <div className="rounded-3xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        Beta: stránky sú pripravené, aby sme mali prehľad o rozsahu MVP a kam čo patrí.
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        {items.map((item) => (
          <div
            key={item.href}
            className="rounded-3xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Button asChild size="sm">
                <Link href={item.href}>{item.action}</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

