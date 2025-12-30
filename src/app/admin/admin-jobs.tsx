import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { AdminDashboardData } from "@/app/admin/admin-types";
import { jobStatusLabels, jobStatusStyles } from "@/app/admin/admin-constants";
import { JobStatus } from "@/types";

export function AdminJobs({ recentJobs }: { recentJobs: AdminDashboardData["recentJobs"] }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Najnovšie zmeny</h2>
      {recentJobs.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Zatiaľ neboli vytvorené žiadne zmeny.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {recentJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-border/70 p-4 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{job.title}</p>
                <span className="text-muted-foreground">od {job.company.companyName}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    jobStatusStyles[job.status as JobStatus],
                  )}
                >
                  {jobStatusLabels[job.status as JobStatus]}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {job.locationCity}, {job.region} · {format(job.startsAt, "d MMM yyyy HH:mm")}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

