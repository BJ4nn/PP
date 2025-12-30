import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { requireRole } from "@/lib/auth/session";
import { ContractStatus, UserRole } from "@/types";
import { getCompanyProfileByUserId } from "@/server/services/company";
import { getCompanyContract } from "@/server/services/contracts";
import { AppShell } from "@/components/layout/app-shell";
import { CompanyContractSignForm } from "@/components/company/company-contract-sign-form";
import { SignaturePreview } from "@/components/signature/signature-preview";
import type { SignaturePayloadV1 } from "@/types";

export const metadata: Metadata = {
  title: "Zmluva (Beta) · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CompanyContractDetailPage({ params }: Props) {
  const session = await requireRole(UserRole.COMPANY);
  const profile = await getCompanyProfileByUserId(session.user.id);
  if (!profile?.onboardingComplete) redirect("/company/onboarding");

  const { id } = await params;
  let doc;
  try {
    doc = await getCompanyContract(session.user.id, id);
  } catch {
    redirect("/company/contracts");
  }

  return (
    <AppShell
      title="Zmluva (Beta)"
      subtitle={`${doc.worker.name} · ${doc.job.title} · ${format(doc.job.startsAt, "d MMM yyyy HH:mm")}`}
      homeHref="/company/contracts"
    >
      <div className="space-y-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Stav</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {doc.status}
            {doc.companySignedAt
              ? ` · firma podpísala ${format(doc.companySignedAt, "d MMM yyyy HH:mm")}`
              : " · čaká na podpis firmy"}
            {doc.workerSignedAt
              ? ` · worker podpísal ${format(doc.workerSignedAt, "d MMM yyyy HH:mm")}`
              : doc.companySignedAt
                ? " · čaká na podpis workerom"
                : ""}
          </p>
        </div>

        {(doc.companySignatureJson || doc.workerSignatureJson) ? (
          <div className="grid gap-3 md:grid-cols-2">
            {doc.companySignatureJson ? (
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-semibold text-foreground">Podpis firmy</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {doc.companySignatureName ?? profile.companyName}
                </p>
                <div className="mt-3">
                  <SignaturePreview signature={doc.companySignatureJson as SignaturePayloadV1} />
                </div>
              </div>
            ) : null}
            {doc.workerSignatureJson ? (
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-semibold text-foreground">Podpis pracovníka</p>
                <p className="mt-1 text-xs text-muted-foreground">{doc.workerSignatureName ?? doc.worker.name}</p>
                <div className="mt-3">
                  <SignaturePreview signature={doc.workerSignatureJson as SignaturePayloadV1} />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            {doc.titleSnapshot}
          </h2>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-foreground">
            {doc.bodySnapshot}
          </pre>
        </div>

        {!doc.companySignedAt && doc.status !== ContractStatus.VOID ? (
          <CompanyContractSignForm
            contractId={doc.id}
            defaultSignatureName={profile.contactName}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
