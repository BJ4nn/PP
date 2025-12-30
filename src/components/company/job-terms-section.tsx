import { ContractType, ExperienceLevel, NoticeWindow } from "@/types";
import { noticeLabels } from "@/lib/labels/jobs";
import { formatEur } from "@/lib/format/money";

type JobTerms = {
  isUrgent: boolean;
  urgentBonusEur: number | null;
  confirmBy: Date | null;
  isBundle: boolean;
  bundleMinHours: number | null;
  bundleMinDays: number | null;
  bundleBonusEur: number | null;
  bundleHourlyRateEur: unknown;
  contractType: ContractType | null;
  noticeWindow: NoticeWindow;
  cancellationCompensationPct: number;
  requiredVzv: boolean;
  minExperience: ExperienceLevel | null;
};

const experienceLabels: Record<ExperienceLevel, string> = {
  [ExperienceLevel.NONE]: "Bez požiadavky",
  [ExperienceLevel.BASIC]: "Základná prax",
  [ExperienceLevel.INTERMEDIATE]: "Skúsený",
  [ExperienceLevel.ADVANCED]: "Senior / vedúci",
};

function formatMaybeEur(value: unknown) {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n)
    ? formatEur(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;
}

export function JobTermsSection({ job }: { job: JobTerms }) {
  const bundleRate = job.isBundle ? formatMaybeEur(job.bundleHourlyRateEur) : null;

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Podmienky zmeny</h2>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
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
        {job.isBundle ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
            BALÍK {job.bundleMinDays ? `${job.bundleMinDays} dni` : ""}{" "}
            {job.bundleMinHours ? `${job.bundleMinHours}h` : ""}
          </span>
        ) : null}
        {job.isBundle && job.bundleBonusEur ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
            Bonus +€{job.bundleBonusEur}
          </span>
        ) : null}
        {bundleRate ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
            Balík sadzba {bundleRate}/h
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

      <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Vyžaduje sa VZV?</dt>
          <dd className="font-medium">{job.requiredVzv ? "Áno" : "Nie"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Minimálna skúsenosť</dt>
          <dd className="font-medium">
            {job.minExperience ? experienceLabels[job.minExperience] : "Bez požiadavky"}
          </dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-muted-foreground">Politika storna</dt>
          <dd className="font-medium">
            {noticeLabels[job.noticeWindow]}
            {job.cancellationCompensationPct > 0
              ? ` · kompenzácia ${job.cancellationCompensationPct}%`
              : " · bez kompenzácie"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
