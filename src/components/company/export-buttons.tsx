"use client";

import { Button } from "@/components/ui/button";

type Props = {
  jobId?: string;
  rangeDays?: number;
};

export function ExportButtons({ jobId, rangeDays }: Props) {
  const range = rangeDays ?? 30;
  const hoursHref = jobId
    ? `/api/company/exports/hours?jobId=${encodeURIComponent(jobId)}`
    : `/api/company/exports/hours?range=${encodeURIComponent(String(range))}`;
  const bonusesHref = jobId
    ? `/api/company/exports/bonuses?jobId=${encodeURIComponent(jobId)}`
    : `/api/company/exports/bonuses?range=${encodeURIComponent(String(range))}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline">
        <a href={hoursHref}>Export hodiny (CSV)</a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a href={bonusesHref}>Export bonusy (CSV)</a>
      </Button>
    </div>
  );
}

