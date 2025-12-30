"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

type Props = {
  companyId: string;
  companyName: string;
  city: string;
  region: string;
  lastWorkedAtIso: string;
  isPriority: boolean;
  isNarrowCollaboration: boolean;
};

export function WorkerCompanyCard({
  companyId,
  companyName,
  city,
  region,
  lastWorkedAtIso,
  isPriority,
  isNarrowCollaboration,
}: Props) {
  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Moja firma</p>
          <h2 className="text-lg font-semibold text-foreground">{companyName}</h2>
          <p className="text-sm text-muted-foreground">
            {city}, {region}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Posledna zmena: {format(new Date(lastWorkedAtIso), "d MMM yyyy")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
        {isPriority ? (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-900">
            Prioritna skupina
          </span>
        ) : null}
        {isNarrowCollaboration ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">
            Uzsia spolupraca aktivna
          </span>
        ) : (
          <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
            Uzsia spolupraca zatial nie je povolena
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isNarrowCollaboration ? (
          <Button asChild size="sm">
            <Link href={`/worker/companies/${companyId}`}>Smeny len pre tuto firmu</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
