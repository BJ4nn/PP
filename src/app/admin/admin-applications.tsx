import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { AdminDashboardData } from "@/app/admin/admin-types";
import {
  applicationStatusLabels,
  applicationStatusStyles,
} from "@/app/admin/admin-constants";
import { ApplicationStatus } from "@/types";

export function AdminApplications({
  recentApplications,
}: {
  recentApplications: AdminDashboardData["recentApplications"];
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">
        Najnovšie prihlášky
      </h2>
      {recentApplications.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Zatiaľ neboli odoslané žiadne prihlášky.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {recentApplications.map((application) => (
            <div
              key={application.id}
              className="rounded-2xl border border-border/70 p-4 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">
                  {application.worker.name}
                </p>
                <span className="text-muted-foreground">
                  → {application.job.title}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    applicationStatusStyles[
                      application.status as ApplicationStatus
                    ],
                  )}
                >
                  {applicationStatusLabels[
                    application.status as ApplicationStatus
                  ]}
                </span>
              </div>
              <p className="text-muted-foreground">
                {application.job.company.companyName} ·{" "}
                {format(application.createdAt, "d MMM yyyy HH:mm")}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

