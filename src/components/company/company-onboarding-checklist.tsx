import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChecklistStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  done: boolean;
  disabled?: boolean;
  disabledHint?: string;
};

type Tip = {
  title: string;
  description: string;
};

type Props = {
  steps: ChecklistStep[];
  tips: Tip[];
};

export function CompanyOnboardingChecklist({ steps, tips }: Props) {
  const completed = steps.filter((step) => step.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Rýchly štart</p>
          <h2 className="text-lg font-semibold text-foreground">
            Mini kurz pre firmy
          </h2>
          <p className="text-sm text-muted-foreground">
            Krátky checklist, ktorý vás prevedie prvými krokmi.
          </p>
        </div>
        <div className="rounded-full border border-border bg-muted/40 px-4 py-2 text-xs font-semibold text-foreground">
          Hotovo {completed}/{steps.length}
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted/50">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="grid gap-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "rounded-2xl border border-border bg-background p-4",
              step.done ? "border-emerald-200 bg-emerald-50/50" : null,
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                      step.done
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {step.done ? <CheckCircle2 className="size-4" /> : index + 1}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                {step.disabledHint ? (
                  <p className="text-xs text-amber-700">{step.disabledHint}</p>
                ) : null}
              </div>
              {step.done ? (
                <span className="text-xs font-semibold text-emerald-700">Hotovo</span>
              ) : step.disabled ? (
                <Button size="sm" variant="outline" disabled>
                  {step.ctaLabel}
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href={step.href}>{step.ctaLabel}</Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-muted/20 p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Vysvetlivky funkcií
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {tips.map((tip) => (
            <div key={tip.title} className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-foreground">{tip.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
