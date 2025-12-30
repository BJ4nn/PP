import type { Metadata } from "next";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { ApplicationStatus, JobWaveStage, UserRole } from "@/types";
import { getOpenJobForWorker } from "@/server/services/jobs";
import { AppShell } from "@/components/layout/app-shell";
import { JobApplyForm } from "@/components/worker/job-apply-form";
import { noticeLabels, warehouseLabels } from "@/lib/labels/jobs";
import { formatEur, formatHourlyRateEur } from "@/lib/format/money";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Detail zmeny · Warehouse Flex Portal",
};

const waveLabels: Record<JobWaveStage, string> = {
  [JobWaveStage.WAVE1]: "1. vlna",
  [JobWaveStage.WAVE2]: "2. vlna",
  [JobWaveStage.PUBLIC]: "3. vlna",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WorkerJobDetailPage({ params }: Props) {
  const session = await requireRole(UserRole.WORKER);
  const { id } = await params;

  let job;
  try {
    job = await getOpenJobForWorker(session.user.id, id);
  } catch {
    redirect("/worker/jobs");
  }

  const hourly = Number(job.effectiveHourlyRate ?? job.hourlyRate);
  const baseEur = hourly * job.durationHours;
  const urgentBonus = job.isUrgent ? job.urgentBonusEur ?? 0 : 0;
  const bundleBonus = job.isBundle ? job.bundleBonusEur ?? 0 : 0;
  const bonusesTotal = urgentBonus + bundleBonus;
  const totalEur = baseEur + bonusesTotal;

  const myApplication = (job as unknown as {
    myApplication?:
      | {
          id: string;
          status: ApplicationStatus;
          workedConfirmedAt?: Date | null;
          invoiceLine?: { invoiceId: string } | null;
          contractDocument?:
            | { id: string; workerSignedAt: Date | null; companySignedAt: Date | null }
            | null;
        }
      | null;
  }).myApplication ?? null;

  const invoiceId = myApplication?.invoiceLine?.invoiceId ?? null;

  return (
    <AppShell
      title={job.title}
      subtitle={`${job.company.companyName} · ${job.locationAddress}, ${job.locationCity}, ${job.region}`}
      homeHref="/worker/dashboard"
    >
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs">
            {job.isFavoriteCompany ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">
                Obľúbená firma
              </span>
            ) : null}
            {job.isVerifiedCompany ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-900">
                Overená firma
              </span>
            ) : null}
            {job.isPriorityCompany ? (
              <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-900">
                Prioritná skupina
              </span>
            ) : null}
            {job.inviteStage ? (
              <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                {waveLabels[job.inviteStage as JobWaveStage]}
              </span>
            ) : null}
            {job.isUrgent ? (
              <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-900">
                URGENT
              </span>
            ) : null}
            {job.isUrgent && job.urgentBonusEur ? (
              <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">
                Bonus +€{job.urgentBonusEur}
              </span>
            ) : null}
            {job.confirmBy ? (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">
                Potvrdiť do {format(job.confirmBy, "d MMM HH:mm")} (
                {formatDistanceToNow(job.confirmBy, { addSuffix: true })})
              </span>
            ) : null}
            <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
              {noticeLabels[job.noticeWindow]}
            </span>
            {job.cancellationCompensationPct > 0 ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                Kompenzácia {job.cancellationCompensationPct}%
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(job.startsAt, "d MMM yyyy HH:mm")} · {job.durationHours}h ·{" "}
            {formatHourlyRateEur(hourly)}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">
              {warehouseLabels[job.warehouseType]}
            </span>
            {job.requiredVzv ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                Potrebné VZV
              </span>
            ) : null}
            {job.isBundle ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">
                Balík · {job.bundleMinDays ? `${job.bundleMinDays} dni` : ""}{" "}
                {job.bundleMinHours ? `${job.bundleMinHours}h` : ""}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {job.description}
          </p>
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground">Čo dostanete</p>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Sadzba</dt>
                <dd className="font-semibold text-foreground">{formatHourlyRateEur(hourly)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Odhad zárobku</dt>
                <dd className="font-semibold text-foreground">
                  {formatEur(totalEur, { maximumFractionDigits: 0 })}
                </dd>
              </div>
              {bonusesTotal > 0 ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Bonusy</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {urgentBonus > 0 ? (
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700">
                        Urgent +€{urgentBonus}
                      </span>
                    ) : null}
                    {bundleBonus > 0 ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
                        Balík +€{bundleBonus}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Politika storna</dt>
                <dd className="font-medium text-foreground">
                  {noticeLabels[job.noticeWindow]}
                  {job.cancellationCompensationPct > 0
                    ? ` · kompenzácia ${job.cancellationCompensationPct}%`
                    : " · bez kompenzácie"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-sm">
          {myApplication ? (
            <>
              <h2 className="text-lg font-semibold text-foreground">Priebeh</h2>
              <ol className="space-y-3 text-sm">
                <Step
                  done
                  title="Prihláška odoslaná"
                  body="Ste prihlásený/á na túto smenu."
                />
                <Step
                  done={myApplication.status === ApplicationStatus.CONFIRMED}
                  title="Potvrdenie firmou"
                  body={
                    myApplication.status === ApplicationStatus.CONFIRMED
                      ? "Smena je potvrdená."
                      : "Čaká sa na rozhodnutie firmy."
                  }
                />
                <Step
                  done={Boolean(myApplication.contractDocument?.companySignedAt)}
                  title="Zmluva: podpis firmy"
                  body={
                    myApplication.status !== ApplicationStatus.CONFIRMED
                      ? "Zmluva sa generuje po potvrdení."
                      : myApplication.contractDocument?.companySignedAt
                        ? "Firma podpísala zmluvu."
                        : "Čaká na podpis firmy."
                  }
                />
                <Step
                  done={Boolean(myApplication.contractDocument?.workerSignedAt)}
                  title="Zmluva: váš podpis"
                  body={
                    myApplication.status !== ApplicationStatus.CONFIRMED
                      ? "Po potvrdení budete môcť zmluvu podpísať."
                      : myApplication.contractDocument?.companySignedAt
                        ? myApplication.contractDocument?.workerSignedAt
                          ? "Zmluva je podpísaná."
                          : "Podpíšte zmluvu v portáli."
                        : "Najprv musí podpísať firma."
                  }
                />
                <Step
                  done={Boolean(myApplication.workedConfirmedAt)}
                  title="Odpracované"
                  body={
                    myApplication.workedConfirmedAt
                      ? "Firma potvrdila odpracované."
                      : "Po skončení smeny firma potvrdí odpracované."
                  }
                />
                <Step
                  done={Boolean(invoiceId)}
                  title="Faktúra"
                  body={
                    invoiceId
                      ? "Faktúra je vytvorená."
                      : myApplication.workedConfirmedAt
                        ? "Môžete vytvoriť faktúru za odpracované."
                        : "Faktúru vytvoríte po potvrdení odpracovaného."
                  }
                />
              </ol>

              <div className="mt-4 flex flex-wrap gap-2">
                {myApplication.status === ApplicationStatus.CONFIRMED &&
                myApplication.contractDocument &&
                myApplication.contractDocument.companySignedAt &&
                !myApplication.contractDocument.workerSignedAt ? (
                  <Button asChild>
                    <Link href={`/worker/contracts/${myApplication.contractDocument.id}`}>
                      Podpísať zmluvu
                    </Link>
                  </Button>
                ) : null}
                {invoiceId ? (
                  <Button asChild variant="outline">
                    <Link href={`/worker/invoices/${invoiceId}`}>Otvoriť faktúru</Link>
                  </Button>
                ) : myApplication.workedConfirmedAt ? (
                  <Button asChild variant="outline">
                    <Link href="/worker/invoices">Vytvoriť faktúru</Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link href="/worker/assigned">Nahodené smeny</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-foreground">
                Reagovať na ponuku
              </h2>
              <p className="text-sm text-muted-foreground">
                Pridajte krátku poznámku pre firmu (napr. dostupnosť, skúsenosti).
              </p>
              <JobApplyForm jobId={job.id} requiresBundleConsent={job.isBundle} />
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Step({ done, title, body }: { done: boolean; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <div
        className={[
          "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
          done ? "bg-emerald-100 text-emerald-900" : "bg-muted text-muted-foreground",
        ].join(" ")}
      >
        {done ? "✓" : "•"}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}
