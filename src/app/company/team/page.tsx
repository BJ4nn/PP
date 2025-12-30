import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tím firmy (Beta) · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

export default async function CompanyTeamPage() {
  await requireRole(UserRole.COMPANY);

  return (
    <AppShell
      title="Tím firmy (Beta)"
      subtitle="Viac používateľov pod jednou firmou (owner/manager)."
      homeHref="/company/dashboard"
    >
      <div className="rounded-3xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        Beta: bude tu pozývanie členov (email), role a odoberanie prístupu.
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Navrhované roly</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Owner: platby, nastavenia, členovia tímu.</li>
          <li>Manager: tvorba zmien, potvrdenia, exporty.</li>
          <li>Viewer: iba prehľad (read-only).</li>
        </ul>
        <div className="mt-4">
          <Button asChild variant="ghost">
            <Link href="/company/settings">Späť na nastavenia</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

