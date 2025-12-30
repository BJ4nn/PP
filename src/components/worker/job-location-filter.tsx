"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type LocationApiResponse = { cities?: unknown };

export function WorkerJobLocationFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedCity = (searchParams.get("city") ?? "").trim();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    const nextQuery = next.toString();
    router.replace(nextQuery ? `?${nextQuery}` : "/worker/jobs");
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/worker/jobs/locations");
        if (!response.ok) {
          if (!cancelled) setCities([]);
          return;
        }
        const data = (await response.json().catch(() => ({}))) as LocationApiResponse;
        const nextCities = Array.isArray(data.cities)
          ? data.cities.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
          : [];
        if (!cancelled) setCities(nextCities);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => {
    const unique = Array.from(new Set(cities.map((c) => c.trim()))).filter(Boolean);
    unique.sort((a, b) => a.localeCompare(b, "sk"));
    return unique;
  }, [cities]);

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Lokalita</p>
          <p className="text-xs text-muted-foreground">
            Default: celé Slovensko. Vyberte mesto pre zúženie ponúk.
          </p>
        </div>
        {loading ? (
          <span className="text-xs font-semibold text-muted-foreground">Načítavam mestá…</span>
        ) : null}
      </div>

      <div className="mt-3">
        <select
          className={cn(
            "h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          )}
          value={selectedCity || "ALL"}
          onChange={(event) => {
            const next = event.target.value;
            setParam("city", next === "ALL" ? null : next);
          }}
        >
          <option value="ALL">Celé Slovensko</option>
          {options.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

