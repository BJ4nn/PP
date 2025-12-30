"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  type JobDto,
} from "@/components/worker/job-feed-model";
import { WorkerJobFiltersBar, useWorkerJobFilters } from "@/components/worker/job-filters";
import { WorkerJobCard } from "@/components/worker/job-card";
import { WorkerJobLocationFilter } from "@/components/worker/job-location-filter";

export function JobFeedClient() {
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const filters = useWorkerJobFilters();
  const city = (searchParams.get("city") ?? "").trim();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL("/api/worker/jobs", window.location.origin);
        if (filters.noticeWindow) url.searchParams.set("noticeWindow", filters.noticeWindow);
        if (filters.isUrgent !== null) url.searchParams.set("isUrgent", String(filters.isUrgent));
        if (filters.isBundle !== null) url.searchParams.set("isBundle", String(filters.isBundle));
        if (filters.hasBonus !== null) url.searchParams.set("hasBonus", String(filters.hasBonus));
        if (filters.favoritesOnly !== null)
          url.searchParams.set("favoritesOnly", String(filters.favoritesOnly));
        if (city) url.searchParams.set("city", city);

        const response = await fetch(url.toString());
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error ?? "Nepodarilo sa načítať ponuky");
        }
        if (!cancelled) setJobs(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [filters, city]);

  return (
    <div className="space-y-4">
      <WorkerJobLocationFilter />
      <WorkerJobFiltersBar />

      {loading ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Načítavam ponuky...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-destructive">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Momentálne tu nie sú žiadne vhodné ponuky.
        </div>
      ) : (
        jobs.map((job) => <WorkerJobCard key={job.id} job={job} />)
      )}
    </div>
  );
}
