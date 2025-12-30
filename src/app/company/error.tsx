"use client";

import type { ReactNode } from "react";
import { PageError } from "@/components/layout/page-error";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CompanySectionError({ error, reset }: Props): ReactNode {
  return (
    <PageError
      message={
        error.message ||
        "Something went wrong while loading company tools. Please try again."
      }
      backHref="/"
      onRetry={reset}
    />
  );
}
