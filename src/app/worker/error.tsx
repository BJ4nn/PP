"use client";

import type { ReactNode } from "react";
import { PageError } from "@/components/layout/page-error";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WorkerSectionError({ error, reset }: Props): ReactNode {
  return (
    <PageError
      message={
        error.message ||
        "We could not load your worker dashboard. Please try again."
      }
      backHref="/"
      onRetry={reset}
    />
  );
}
