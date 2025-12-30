"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ApplicationStatus } from "@/types";
import type { CalendarJobClientItem, CompanyJobDetailsClient } from "./types";
import { translateCompanyApplicationError } from "./application-errors";
import { statusBadgeForClient } from "./job-status-badge";
import { PendingApplicationsSection } from "./pending-applications-section";
import { ConfirmedApplicationsSection } from "./confirmed-applications-section";

type Props = {
  job: CalendarJobClientItem;
  highlighted?: boolean;
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CompanyJobDetailsClient };

export function JobApplicationsCard({ job, highlighted }: Props) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionErrorById, setActionErrorById] = useState<Record<string, string>>(
    {},
  );
  const [workedSelectedIds, setWorkedSelectedIds] = useState<string[]>([]);
  const [workedSubmitting, setWorkedSubmitting] = useState(false);
  const [workedError, setWorkedError] = useState<string | null>(null);

  const startsAt = useMemo(() => new Date(job.startsAtIso), [job.startsAtIso]);
  const endsAt = useMemo(() => new Date(job.endsAtIso), [job.endsAtIso]);
  const ended = endsAt.getTime() < Date.now();

  async function load() {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/company/jobs/${job.id}`, { method: "GET" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Nepodarilo sa načítať prihlášky");
      }
      const data = (await res.json()) as CompanyJobDetailsClient;
      setState({ status: "ready", data });
    } catch (error) {
      setState({
        status: "error",
        message: (error as Error).message ?? "Nepodarilo sa načítať prihlášky",
      });
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  const applications = state.status === "ready" ? state.data.applications : [];
  const pending = applications.filter((a) => a.status === ApplicationStatus.PENDING);
  const confirmed = applications.filter((a) => a.status === ApplicationStatus.CONFIRMED);
  const workedEligible = ended
    ? confirmed.filter((a) => !a.workedConfirmedAt)
    : [];

  async function updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    options?: { openContractAfterConfirm?: boolean },
  ) {
    setActingId(applicationId);
    try {
      setActionErrorById((prev) => ({ ...prev, [applicationId]: "" }));
      const res = await fetch(`/api/company/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setActionErrorById((prev) => ({
          ...prev,
          [applicationId]: translateCompanyApplicationError(data?.error ?? ""),
        }));
        return;
      }
      const data = (await res.json().catch(() => null)) as
        | { contractId?: string | null }
        | null;
      await load();
      router.refresh();
      if (
        status === ApplicationStatus.CONFIRMED &&
        data?.contractId &&
        (options?.openContractAfterConfirm ?? false)
      ) {
        router.push(`/company/contracts/${data.contractId}`);
      }
    } finally {
      setActingId(null);
    }
  }

  async function confirmWorked() {
    if (workedSelectedIds.length === 0) return;
    setWorkedSubmitting(true);
    try {
      setWorkedError(null);
      const res = await fetch("/api/company/applications/worked", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationIds: workedSelectedIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setWorkedError(data?.error ?? "Nepodarilo sa potvrdiť odpracované");
        return;
      }
      setWorkedSelectedIds([]);
      await load();
      router.refresh();
    } finally {
      setWorkedSubmitting(false);
    }
  }

  return (
    <div
      id={`company-cal-job-${job.id}`}
      className={cn(
        "rounded-2xl border border-border bg-card p-4",
        highlighted ? "border-primary ring-2 ring-primary/20" : null,
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Link href={`/company/jobs/${job.id}`} className="block">
            <p className="truncate text-sm font-semibold text-foreground">{job.title}</p>
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {format(startsAt, "HH:mm")}–{format(endsAt, "HH:mm")} · potvrdení {job.confirmedCount}/
            {job.neededWorkers} · prihlášky {job.applicantsCount}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold",
            statusBadgeForClient(job.status),
          )}
        >
          {job.status}
        </span>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <p className="mt-3 text-xs text-muted-foreground">Načítavam prihlášky…</p>
      ) : state.status === "error" ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-destructive">{state.message}</p>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/60"
            onClick={() => void load()}
          >
            Skúsiť znova
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <PendingApplicationsSection
            pending={pending}
            jobStatus={job.status}
            actingId={actingId}
            actionErrorById={actionErrorById}
            onConfirm={(applicationId, openContractAfterConfirm) =>
              void updateApplicationStatus(applicationId, ApplicationStatus.CONFIRMED, {
                openContractAfterConfirm,
              })}
            onReject={(applicationId) =>
              void updateApplicationStatus(applicationId, ApplicationStatus.REJECTED)}
          />

          <ConfirmedApplicationsSection
            confirmed={confirmed}
            ended={ended}
            workedEligibleIds={workedEligible.map((a) => a.id)}
            workedSelectedIds={workedSelectedIds}
            workedSubmitting={workedSubmitting}
            workedError={workedError}
            onToggleWorked={(applicationId, checked) => {
              setWorkedSelectedIds((prev) =>
                checked
                  ? Array.from(new Set([...prev, applicationId]))
                  : prev.filter((id) => id !== applicationId),
              );
            }}
            onSelectAll={() => setWorkedSelectedIds(workedEligible.map((a) => a.id))}
            onConfirmWorked={() => void confirmWorked()}
          />
        </div>
      )}
    </div>
  );
}
