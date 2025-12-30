"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  message?: string;
  backHref?: string;
  onRetry?: () => void;
};

export function PageError({
  message = "Something went wrong while loading this page.",
  backHref,
  onRetry,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleRetry = () => {
    startTransition(() => {
      if (onRetry) {
        onRetry();
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card/70 p-6 text-center text-sm shadow-sm">
      <AlertTriangle className="size-6 text-amber-500" aria-hidden="true" />
      <p className="max-w-sm text-muted-foreground">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="sm" onClick={handleRetry} disabled={pending}>
          {pending ? "Retrying..." : "Try again"}
        </Button>
        {backHref ? (
          <Button size="sm" variant="outline" asChild>
            <Link href={backHref}>Go back</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
