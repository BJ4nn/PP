"use client";

import type { ReactNode } from "react";
import { PageError } from "@/components/layout/page-error";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: Props): ReactNode {
  return (
    <PageError
      message={
        error.message ||
        "Admin monitor failed to load. Please try again or check the deployment."
      }
      backHref="/"
      onRetry={reset}
    />
  );
}
