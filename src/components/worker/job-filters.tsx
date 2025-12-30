"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NoticeWindow } from "@/types";
import { noticeLabels } from "@/lib/labels/jobs";
import { cn } from "@/lib/utils";

export type WorkerJobFilters = {
  noticeWindow: NoticeWindow | null;
  isUrgent: boolean | null;
  isBundle: boolean | null;
  hasBonus: boolean | null;
  favoritesOnly: boolean | null;
};

const isNoticeWindow = (value: string | null): value is NoticeWindow =>
  Boolean(value) &&
  (Object.values(NoticeWindow) as string[]).includes(value as string);

function parseTriBool(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function useWorkerJobFilters(): WorkerJobFilters {
  const searchParams = useSearchParams();
  return useMemo(() => {
    const noticeRaw = searchParams.get("noticeWindow") ?? searchParams.get("minNoticeWindow");
    const noticeWindow = isNoticeWindow(noticeRaw) ? noticeRaw : null;
    const isUrgent = parseTriBool(searchParams.get("isUrgent"));
    const isBundle = parseTriBool(searchParams.get("isBundle"));
    const hasBonus = parseTriBool(searchParams.get("hasBonus"));
    const favoritesOnly = parseTriBool(searchParams.get("favoritesOnly"));

    return { noticeWindow, isUrgent, isBundle, hasBonus, favoritesOnly };
  }, [searchParams]);
}

export function WorkerJobFiltersBar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filters = useWorkerJobFilters();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    const nextQuery = next.toString();
    router.replace(nextQuery ? `?${nextQuery}` : "/worker/jobs");
  };

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs font-semibold transition",
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border text-muted-foreground hover:border-primary/60",
    );

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-semibold text-foreground">Filtre</p>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
          Viac filtrov
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={chip(filters.isUrgent === true)}
            onClick={() => setParam("isUrgent", filters.isUrgent === true ? null : "true")}
          >
            Urgent
          </button>
          <button
            type="button"
            className={chip(filters.isBundle === true)}
            onClick={() => setParam("isBundle", filters.isBundle === true ? null : "true")}
          >
            Balík
          </button>
          <button
            type="button"
            className={chip(filters.hasBonus === true)}
            onClick={() => setParam("hasBonus", filters.hasBonus === true ? null : "true")}
          >
            Bonus
          </button>
          <button
            type="button"
            className={chip(filters.favoritesOnly === true)}
            onClick={() =>
              setParam("favoritesOnly", filters.favoritesOnly === true ? null : "true")
            }
          >
            Obľúbené firmy
          </button>

          {[null, NoticeWindow.H12, NoticeWindow.H24, NoticeWindow.H48].map((nw) => {
            const selected = (nw === null && !filters.noticeWindow) || filters.noticeWindow === nw;
            return (
              <button
                key={nw ?? "any"}
                type="button"
                className={chip(selected)}
                onClick={() => setParam("noticeWindow", nw)}
              >
                {nw ? noticeLabels[nw] : "Storno: všetko"}
              </button>
            );
          })}
        </div>
      </details>
      <p className="mt-2 text-xs text-muted-foreground">
        Tip: základný feed už zohľadňuje vaše preferencie a kompatibilitu. Filtre sú iba na rýchle
        zúženie.
      </p>
    </div>
  );
}
