"use client";

import type { CompanyJobApplicationClient } from "./types";
import { cn } from "@/lib/utils";

type Props = {
  confirmed: CompanyJobApplicationClient[];
  ended: boolean;
  workedEligibleIds: string[];
  workedSelectedIds: string[];
  workedSubmitting: boolean;
  workedError: string | null;
  onToggleWorked: (applicationId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onConfirmWorked: () => void;
};

export function ConfirmedApplicationsSection({
  confirmed,
  ended,
  workedEligibleIds,
  workedSelectedIds,
  workedSubmitting,
  workedError,
  onToggleWorked,
  onSelectAll,
  onConfirmWorked,
}: Props) {
  return (
    <div>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-xs font-semibold text-foreground">Potvrdení ({confirmed.length})</p>
        {ended ? (
          <p className="text-xs text-muted-foreground">Zmena skončila · potvrďte odpracované.</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Odpracované sa dá potvrdiť až po skončení zmeny.
          </p>
        )}
      </div>

      {confirmed.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Zatiaľ nikto.</p>
      ) : (
        <div className="mt-2 space-y-2">
          {confirmed.map((app) => {
            const canConfirmWorked = ended && !app.workedConfirmedAt;
            const checked = workedSelectedIds.includes(app.id);
            return (
              <div
                key={app.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {app.worker.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {app.worker.city ?? "—"}
                    {app.workedConfirmedAt ? " · odpracované potvrdené" : null}
                  </p>
                </div>
                {ended ? (
                  <input
                    type="checkbox"
                    disabled={!canConfirmWorked}
                    checked={checked}
                    onChange={(event) => onToggleWorked(app.id, event.target.checked)}
                  />
                ) : null}
              </div>
            );
          })}

          {ended ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/60"
                  onClick={onSelectAll}
                >
                  Označiť všetko
                </button>
                <button
                  type="button"
                  disabled={workedSelectedIds.length === 0 || workedSubmitting}
                  className={cn(
                    "rounded-full px-3 py-2 text-xs font-semibold",
                    workedSelectedIds.length > 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "cursor-not-allowed bg-muted text-muted-foreground",
                  )}
                  onClick={onConfirmWorked}
                >
                  {workedSubmitting
                    ? "Potvrdzujem…"
                    : `Potvrdiť odpracované (${workedSelectedIds.length}/${workedEligibleIds.length})`}
                </button>
              </div>
              {workedError ? (
                <p className="text-xs text-destructive">{workedError}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
