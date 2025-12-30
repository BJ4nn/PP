"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  isReady: boolean;
};

export function WorkerDashboardWarnings({
  isReady,
}: Props) {
  if (isReady) return null;

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900">
      <p className="text-sm font-semibold">Nie ste označený ako pripravený</p>
      <p className="mt-1 text-sm">
        Keď je režim vypnutý, firmy vás uvidia nižšie a ponúk môže byť menej.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="#ready">Zapnúť Ready</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href="/worker/jobs">Pozrieť zmeny</Link>
        </Button>
      </div>
    </div>
  );
}
