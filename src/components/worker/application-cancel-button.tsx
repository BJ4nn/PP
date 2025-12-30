"use client";

import { useTransition } from "react";
import { ApplicationStatus } from "@/types";
import { Button } from "@/components/ui/button";

type Props = {
  applicationId: string;
  status: ApplicationStatus;
};

export function WorkerApplicationCancelButton({
  applicationId,
  status,
}: Props) {
  const [pending, startTransition] = useTransition();

  if (
    status !== ApplicationStatus.PENDING &&
    status !== ApplicationStatus.CONFIRMED
  ) {
    return null;
  }

  const cancel = () => {
    startTransition(async () => {
      await fetch(`/api/worker/applications/${applicationId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "user_cancel" }),
      });
      window.location.reload();
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={cancel}
    >
      Zrušiť zmenu
    </Button>
  );
}
