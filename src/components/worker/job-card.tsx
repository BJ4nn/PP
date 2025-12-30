"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { formatEur, formatHourlyRateEur } from "@/lib/format/money";
import { noticeLabels, warehouseLabels } from "@/lib/labels/jobs";
import type { JobDto } from "@/components/worker/job-feed-model";
import { JobApplyForm } from "@/components/worker/job-apply-form";
import { JobWaveStage } from "@/types";

function matchLabel(score: number) {
  if (score >= 65) return { label: "Great match", cls: "bg-emerald-100 text-emerald-900" };
  if (score >= 50) return { label: "OK match", cls: "bg-blue-100 text-blue-900" };
  return { label: "Low match", cls: "bg-gray-200 text-gray-700" };
}

function bonusSummary(job: JobDto) {
  const urgent = job.isUrgent ? job.urgentBonusEur ?? 0 : 0;
  const bundle = job.isBundle ? job.bundleBonusEur ?? 0 : 0;
  const fixed = urgent + bundle;
  return { urgent, bundle, fixed };
}

const waveLabels: Record<JobWaveStage, string> = {
  [JobWaveStage.WAVE1]: "1. vlna",
  [JobWaveStage.WAVE2]: "2. vlna",
  [JobWaveStage.PUBLIC]: "3. vlna",
};

export function WorkerJobCard({ job }: { job: JobDto }) {
  const hourly = Number(job.effectiveHourlyRate ?? job.hourlyRate);
  const bonus = bonusSummary(job);
  const estimatedTotal = hourly * job.durationHours + bonus.fixed;
  const match = matchLabel(job.relevanceScore);

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-primary">{job.company.companyName}</div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${match.cls}`}>
            {match.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
          {job.isFavoriteCompany ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
              Obľúbená firma
            </span>
          ) : null}
          {job.isVerifiedCompany ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">
              Overená firma
            </span>
          ) : null}
          {job.isPriorityCompany ? (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-900">
              Prioritná skupina
            </span>
          ) : null}
          <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
            {waveLabels[job.inviteStage]}
          </span>
        </div>

        <Link href={`/worker/jobs/${job.id}`} className="group">
          <h2 className="text-xl font-semibold text-foreground group-hover:underline">
            {job.title}
          </h2>
        </Link>

        <div className="flex flex-wrap gap-2 text-xs">
          {job.isUrgent ? (
            <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-900">
              URGENT
            </span>
          ) : null}
          {bonus.urgent > 0 ? (
            <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">
              Bonus +{formatEur(bonus.urgent, { maximumFractionDigits: 0 })}
            </span>
          ) : null}
          {job.confirmBy ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">
              Potvrdiť do {format(new Date(job.confirmBy), "d MMM HH:mm")} (
              {formatDistanceToNow(new Date(job.confirmBy), { addSuffix: true })})
            </span>
          ) : null}
          {job.isBundle ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
              BALÍK {job.bundleMinDays ? `${job.bundleMinDays} dni` : ""}{" "}
              {job.bundleMinHours ? `${job.bundleMinHours}h` : ""}
            </span>
          ) : null}
          {bonus.bundle > 0 ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
              Bonus +{formatEur(bonus.bundle, { maximumFractionDigits: 0 })}
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
          {job.locationAddress}, {job.locationCity}, {job.region} ·{" "}
          {format(new Date(job.startsAt), "d MMM yyyy HH:mm")} · {job.durationHours}h
        </p>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
            {formatHourlyRateEur(hourly)}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
            Odhad {formatEur(estimatedTotal, { maximumFractionDigits: 0 })}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
            {warehouseLabels[job.warehouseType]}
          </span>
          {job.requiredVzv ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
              Potrebné VZV
            </span>
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
      </div>

      <JobApplyForm jobId={job.id} requiresBundleConsent={job.isBundle} />
    </div>
  );
}
