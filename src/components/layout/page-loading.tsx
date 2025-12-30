import { Loader2 } from "lucide-react";

type Props = {
  label?: string;
};

export function PageLoading({ label = "Loading your data..." }: Props) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
