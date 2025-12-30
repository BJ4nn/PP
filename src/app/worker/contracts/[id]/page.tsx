import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { requireRole } from "@/lib/auth/session";
import { ContractStatus, UserRole } from "@/types";
import { getWorkerProfileByUserId } from "@/server/services/worker";
import { getWorkerContract } from "@/server/services/contracts";
import { AppShell } from "@/components/layout/app-shell";
import { WorkerContractSignForm } from "@/components/worker/worker-contract-sign-form";
import { Button } from "@/components/ui/button";
import { SignaturePreview } from "@/components/signature/signature-preview";
import type { SignaturePayloadV1 } from "@/types";

export const metadata: Metadata = {
  title: "Zmluva (Beta) · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WorkerContractPage({ params }: Props) {
  const session = await requireRole(UserRole.WORKER);
  const profile = await getWorkerProfileByUserId(session.user.id);
  if (!profile?.onboardingComplete) redirect("/worker/onboarding");

  const { id } = await params;
  let doc;
  try {
    doc = await getWorkerContract(session.user.id, id);
  } catch {
    redirect("/worker/assigned");
  }

  return (
    <AppShell
      title="Zmluva (Beta)"
      subtitle={`${doc.job.company.companyName} · ${doc.job.title} · ${format(doc.job.startsAt, "d MMM yyyy HH:mm")}`}
      homeHref="/worker/assigned"
      actions={
        <Button asChild variant="outline">
          <Link href="/worker/assigned">Nahodené smeny</Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          <p className="font-semibold">Beta</p>
          <p className="mt-1">
            Zmluvné strany sú firma a pracovník. Portál poskytuje nástroj na podpis a archiváciu.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Stav</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {doc.workerSignedAt
              ? `Podpísané: ${format(doc.workerSignedAt, "d MMM yyyy HH:mm")}`
              : "Čaká na podpis"}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            {doc.titleSnapshot}
          </h2>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-foreground">
            {doc.bodySnapshot}
          </pre>
        </div>

        {(doc.companySignatureJson || doc.workerSignatureJson) ? (
          <div className="grid gap-3 md:grid-cols-2">
            {doc.companySignatureJson ? (
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-semibold text-foreground">Podpis firmy</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {doc.companySignatureName ?? doc.job.company.companyName}
                </p>
                <div className="mt-3">
                  <SignaturePreview signature={doc.companySignatureJson as SignaturePayloadV1} />
                </div>
              </div>
            ) : null}
            {doc.workerSignatureJson ? (
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-semibold text-foreground">Tvoj podpis</p>
                <p className="mt-1 text-xs text-muted-foreground">{doc.workerSignatureName ?? profile.name}</p>
                <div className="mt-3">
                  <SignaturePreview signature={doc.workerSignatureJson as SignaturePayloadV1} />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {!doc.workerSignedAt ? (
          doc.companySignedAt ? (
            <WorkerContractSignForm
              contractId={doc.id}
              defaultSignatureName={profile.name}
            />
          ) : (
            <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
              Zmluva čaká na podpis firmy. Podpis bude dostupný po potvrdení zo strany firmy.
              {doc.status === ContractStatus.PENDING_COMPANY
                ? " (Čaká na firmu.)"
                : null}
            </div>
          )
        ) : null}
      </div>
    </AppShell>
  );
}
