"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { ApplicationStatus, ExperienceLevel } from "@/types";
import { Button } from "@/components/ui/button";

type Applicant = {
  id: string;
  status: ApplicationStatus;
  note: string | null;
  matchScore: number;
  compensationAmount?: number;
  worker: {
    id: string;
    name: string;
    experienceLevel: string;
    hasVZV: boolean;
    hasBOZP: boolean;
    hasFoodCard: boolean;
    reliabilityScore: number;
  };
};

type Props = {
  applicants: Applicant[];
};

const statusMeta: Record<
  ApplicationStatus,
  { label: string; badge: string; hint: string }
> = {
  [ApplicationStatus.PENDING]: {
    label: "Čaká na potvrdenie",
    badge: "bg-amber-100 text-amber-900",
    hint: "Skontrolujte profil a potvrďte alebo zamietnite, aby sa uvoľnilo miesto.",
  },
  [ApplicationStatus.CONFIRMED]: {
    label: "Potvrdené",
    badge: "bg-emerald-100 text-emerald-900",
    hint: "Pracovník je potvrdený. Rušte len pri skutočnej zmene plánu.",
  },
  [ApplicationStatus.REJECTED]: {
    label: "Zamietnuté",
    badge: "bg-gray-200 text-gray-600",
    hint: "Pracovník nebol vybraný pre túto zmenu.",
  },
  [ApplicationStatus.CANCELLED_BY_WORKER]: {
    label: "Zrušené pracovníkom",
    badge: "bg-gray-200 text-gray-600",
    hint: "Pracovník sa odhlásil. Zvážte znovuotvorenie alebo pozvánku inému.",
  },
  [ApplicationStatus.CANCELLED_BY_COMPANY]: {
    label: "Zrušené firmou",
    badge: "bg-rose-100 text-rose-900",
    hint: "Prihláška bola zrušená zo strany firmy.",
  },
  [ApplicationStatus.WORKER_CANCELED_LATE]: {
    label: "Neskoré zrušenie (worker)",
    badge: "bg-rose-100 text-rose-900",
    hint: "Pracovník zrušil potvrdenú zmenu v rámci notice okna.",
  },
  [ApplicationStatus.COMPANY_CANCELED_LATE]: {
    label: "Neskoré zrušenie (firma)",
    badge: "bg-rose-100 text-rose-900",
    hint: "Firma zrušila potvrdenú zmenu v rámci notice okna.",
  },
};

const experienceLabels: Record<ExperienceLevel, string> = {
  [ExperienceLevel.NONE]: "Bez požiadavky",
  [ExperienceLevel.BASIC]: "Základná prax",
  [ExperienceLevel.INTERMEDIATE]: "Skúsený",
  [ExperienceLevel.ADVANCED]: "Senior / vedúci",
};

export function JobApplicantList({ applicants }: Props) {
  const [pending, startTransition] = useTransition();
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  const updateStatus = (id: string, status: ApplicationStatus) => {
    startTransition(async () => {
      setErrorById((prev) => ({ ...prev, [id]: "" }));
      const res = await fetch(`/api/company/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorById((prev) => ({
          ...prev,
          [id]: data?.error ?? "Nepodarilo sa zmeniť stav",
        }));
        return;
      }
      window.location.reload();
    });
  };

  const cancelApplication = (id: string) => {
    startTransition(async () => {
      setErrorById((prev) => ({ ...prev, [id]: "" }));
      const res = await fetch(`/api/company/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorById((prev) => ({
          ...prev,
          [id]: data?.error ?? "Nepodarilo sa zrušiť prihlášku",
        }));
        return;
      }
      window.location.reload();
    });
  };

  if (applicants.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
        Zatiaľ tu nie sú žiadne prihlášky. Keď sa objavia vhodní pracovníci,
        zobrazia sa na tomto mieste.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applicants.map((app, index) => {
        const isRecommended =
          index < 2 && app.status === ApplicationStatus.PENDING;
        return (
          <div
            key={app.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {app.worker.name}
                </p>
                {isRecommended ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">
                    Recommended
                  </span>
                ) : null}
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  Match: {Math.round(app.matchScore)}/100
                </span>
                <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                  Reliability {app.worker.reliabilityScore}
                </span>
                <Link
                  href={`/company/workers/${app.worker.id}`}
                  className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Zobraziť profil
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                Skúsenosť:{" "}
                {experienceLabels[app.worker.experienceLevel as ExperienceLevel] ??
                  app.worker.experienceLevel}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {app.worker.hasVZV ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                    VZV
                  </span>
                ) : null}
                {app.worker.hasBOZP ? (
                  <span className="rounded-full bg-muted px-2 py-1">BOZP</span>
                ) : null}
                {app.worker.hasFoodCard ? (
                  <span className="rounded-full bg-muted px-2 py-1">
                    Hygienický preukaz
                  </span>
                ) : null}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Stav:
              <span
                className={`ml-2 inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${statusMeta[app.status].badge}`}
              >
                {statusMeta[app.status].label}
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {statusMeta[app.status].hint}
          </p>
          {app.status === ApplicationStatus.COMPANY_CANCELED_LATE &&
          (app.compensationAmount ?? 0) > 0 ? (
            <p className="mt-2 text-sm font-semibold text-foreground">
              Kompenzácia: €{Number(app.compensationAmount).toFixed(2)}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Vyššia spoľahlivosť = nižšie riziko, že pracovník nedorazí.
          </p>
          {errorById[app.id] ? (
            <p className="text-xs text-destructive">{errorById[app.id]}</p>
          ) : null}
          {app.note ? (
            <p className="mt-3 rounded-2xl bg-muted/60 p-3 text-sm text-muted-foreground">
              Poznámka pracovníka: {app.note}
            </p>
          ) : null}
          {app.status === ApplicationStatus.PENDING ||
          app.status === ApplicationStatus.CONFIRMED ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {app.status === ApplicationStatus.PENDING ? (
                <>
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      updateStatus(app.id, ApplicationStatus.CONFIRMED)
                    }
                  >
                    Potvrdiť
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      updateStatus(app.id, ApplicationStatus.REJECTED)
                    }
                  >
                    Zamietnuť
                  </Button>
                </>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => cancelApplication(app.id)}
              >
                Zrušiť
              </Button>
            </div>
          ) : null}
          </div>
        );
      })}
    </div>
  );
}
