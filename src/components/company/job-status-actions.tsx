"use client";

import { useTransition } from "react";
import { JobStatus } from "@/types";
import { Button } from "@/components/ui/button";

type Props = {
  jobId: string;
  status: JobStatus;
};

const STATUS_ACTIONS: Array<{
  label: string;
  nextStatus: JobStatus;
  visible: (status: JobStatus) => boolean;
  variant?: "outline" | "primary";
}> = [
  {
    label: "Označiť ako obsadenú",
    nextStatus: JobStatus.FULL,
    visible: (status) => status === JobStatus.OPEN,
  },
  {
    label: "Uzavrieť zmenu",
    nextStatus: JobStatus.CLOSED,
    visible: (status) => status === JobStatus.OPEN || status === JobStatus.FULL,
    variant: "outline",
  },
  {
    label: "Zrušiť zmenu",
    nextStatus: JobStatus.CANCELLED,
    visible: (status) => status === JobStatus.OPEN || status === JobStatus.FULL,
    variant: "outline",
  },
];

export function JobStatusActions({ jobId, status }: Props) {
  const [pending, startTransition] = useTransition();

  const updateStatus = (nextStatus: JobStatus) => {
    startTransition(async () => {
      await fetch(`/api/company/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      window.location.reload();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_ACTIONS.filter((action) => action.visible(status)).map(
        (action) => (
          <Button
            key={action.nextStatus}
            variant={action.variant ?? "primary"}
            size="sm"
            disabled={pending}
            onClick={() => updateStatus(action.nextStatus)}
          >
            {action.label}
          </Button>
        ),
      )}
    </div>
  );
}
