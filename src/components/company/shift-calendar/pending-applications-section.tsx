"use client";

import { JobStatus } from "@/types";
import type { CompanyJobApplicationClient } from "./types";
import { cn } from "@/lib/utils";

type Props = {
  pending: CompanyJobApplicationClient[];
  jobStatus: string;
  actingId: string | null;
  actionErrorById: Record<string, string>;
  onConfirm: (applicationId: string, openContractAfterConfirm: boolean) => void;
  onReject: (applicationId: string) => void;
};

export function PendingApplicationsSection({
  pending,
  jobStatus,
  actingId,
  actionErrorById,
  onConfirm,
  onReject,
}: Props) {
  return (
    <div>
      <p className="text-xs font-semibold text-foreground">Prihlásení ({pending.length})</p>
      {pending.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Zatiaľ nikto.</p>
      ) : (
        <div className="mt-2 space-y-2">
          {pending.map((app) => (
            <div key={app.id} className="rounded-xl border border-border bg-background p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {app.worker.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {app.worker.city ?? "—"}
                    {app.worker.reliabilityScore !== undefined &&
                    app.worker.reliabilityScore !== null
                      ? ` · spoľahlivosť ${app.worker.reliabilityScore}`
                      : null}
                  </p>
                  {app.hasCompletedContractWithCompany ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      Zmluva podpísaná oboma stranami (v minulosti).
                    </p>
                  ) : null}
                  {app.note ? (
                    <p className="mt-2 text-xs text-muted-foreground">{app.note}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actingId === app.id || jobStatus !== JobStatus.OPEN}
                    className={cn(
                      "rounded-full px-3 py-2 text-xs font-semibold",
                      jobStatus === JobStatus.OPEN
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "cursor-not-allowed bg-muted text-muted-foreground",
                    )}
                    onClick={() => onConfirm(app.id, !app.hasCompletedContractWithCompany)}
                  >
                    {app.hasCompletedContractWithCompany
                      ? "Potvrdiť (zmluva podpísaná)"
                      : "Potvrdiť + podpísať zmluvu"}
                  </button>

                  <details className="relative">
                    <summary className="cursor-pointer list-none rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/60">
                      ⋯
                    </summary>
                    <div className="absolute right-0 z-10 mt-2 w-52 rounded-2xl border border-border bg-background p-2 shadow-sm">
                      <button
                        type="button"
                        disabled={actingId === app.id}
                        className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                          const confirmed = window.confirm("Naozaj chcete odmietnuť túto prihlášku?");
                          if (!confirmed) return;
                          onReject(app.id);
                        }}
                      >
                        Odmietnuť prihlášku
                      </button>
                    </div>
                  </details>
                </div>
              </div>

              {!app.hasCompletedContractWithCompany ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Po potvrdení sa otvorí podpis zmluvy zo strany firmy.
                </p>
              ) : null}

              {actionErrorById[app.id] ? (
                <p className="mt-2 text-xs text-destructive">{actionErrorById[app.id]}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
