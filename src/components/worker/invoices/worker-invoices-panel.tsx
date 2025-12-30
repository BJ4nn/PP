"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import type { WorkerEligibleInvoicesByCompany } from "@/server/services/invoices/worker";

type ExistingInvoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  issuedAt: Date;
  dueAt: Date;
  totalEur: number;
  company: { companyName: string };
};

type Props = {
  eligible: WorkerEligibleInvoicesByCompany;
  invoices: ExistingInvoice[];
};

function labelStatus(status: string) {
  if (status === "DRAFT") return "Rozpracovaná";
  if (status === "SENT") return "Odoslaná";
  if (status === "PAID") return "Zaplatená";
  if (status === "VOID") return "Stornovaná";
  return status;
}

export function WorkerInvoicesPanel({ eligible, invoices }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedByCompany, setSelectedByCompany] = useState<Record<string, string[]>>({});

  const eligibleById = useMemo(() => {
    const map = new Map<string, { companyId: string }>();
    for (const group of eligible) {
      for (const item of group.items) {
        map.set(item.applicationId, { companyId: group.companyId });
      }
    }
    return map;
  }, [eligible]);

  const toggle = (companyId: string, applicationId: string) => {
    setSelectedByCompany((prev) => {
      const current = prev[companyId] ?? [];
      const next = current.includes(applicationId)
        ? current.filter((id) => id !== applicationId)
        : [...current, applicationId];
      return { ...prev, [companyId]: next };
    });
  };

  const createInvoice = (companyId: string) => {
    const ids = selectedByCompany[companyId] ?? [];
    if (ids.length === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/worker/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationIds: ids }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(data?.error ?? "Nepodarilo sa vytvoriť faktúru.");
          return;
        }
        const data = (await response.json().catch(() => null)) as { id?: string } | null;
        if (data?.id) {
          router.push(`/worker/invoices/${data.id}`);
          return;
        }
        router.refresh();
      } catch {
        setError("Nepodarilo sa vytvoriť faktúru.");
      }
    });
  };

  const sendInvoice = (invoiceId: string) => {
    const confirmed = window.confirm(
      "Naozaj chcete odoslať faktúru firme? Po odoslaní ju uvidí firma v prijatých faktúrach.",
    );
    if (!confirmed) return;
    setError(null);
    setSendingId(invoiceId);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/worker/invoices/${invoiceId}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: true }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(data?.error ?? "Nepodarilo sa odoslať faktúru.");
          return;
        }
        router.refresh();
      } catch {
        setError("Nepodarilo sa odoslať faktúru.");
      } finally {
        setSendingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Vytvoriť faktúru</h2>
            <p className="text-sm text-muted-foreground">
              Vyberte odpracované smeny (potvrdené firmou) a vytvorte faktúru pre konkrétnu firmu.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Pred odoslaním si skontrolujte{" "}
              <Link href="/worker/billing" className="font-semibold text-primary hover:underline">
                fakturačné údaje
              </Link>
              .
            </p>
          </div>
        </div>

        {eligible.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Momentálne nemáte žiadne smeny pripravené na fakturáciu.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {eligible.map((group) => {
              const selected = selectedByCompany[group.companyId] ?? [];
              const selectedTotal = group.items
                .filter((i) => selected.includes(i.applicationId))
                .reduce((sum, i) => sum + i.amountEur, 0);

              return (
                <div
                  key={group.companyId}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{group.companyName}</p>
                      <p className="text-xs text-muted-foreground">
                        K dispozícii: {group.items.length} · spolu €{group.totalEur}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={pending || selected.length === 0}
                      onClick={() => createInvoice(group.companyId)}
                    >
                      {pending ? "Vytváram..." : `Vytvoriť faktúru (€${selectedTotal})`}
                    </Button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {group.items.map((item) => {
                      const checked = selected.includes(item.applicationId);
                      const startsAt = new Date(item.startsAtIso);
                      const endsAt = new Date(item.endsAtIso);
                      return (
                        <label
                          key={item.applicationId}
                          className="flex items-start justify-between gap-3 rounded-xl border border-border px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {item.jobTitle}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(startsAt, "d MMM yyyy HH:mm", { locale: sk })} –{" "}
                              {format(endsAt, "HH:mm", { locale: sk })} · {item.hours}h
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-foreground">
                              €{item.amountEur}
                            </span>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!eligibleById.has(item.applicationId)}
                              onChange={() => toggle(group.companyId, item.applicationId)}
                            />
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Moje faktúry</h2>
            <p className="text-sm text-muted-foreground">Prehľad odoslaných a zaplatených faktúr.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Faktúry je možné odoslať najskôr 1. deň nasledujúceho mesiaca.
            </p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Zatiaľ nemáte žiadne faktúry.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {inv.invoiceNumber} · {inv.company.companyName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vystavené {format(inv.issuedAt, "d MMM yyyy", { locale: sk })} · splatnosť{" "}
                      {format(inv.dueAt, "d MMM yyyy", { locale: sk })}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    €{inv.totalEur} · {labelStatus(inv.status)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/worker/invoices/${inv.id}`}>Detail</Link>
                  </Button>
                  {inv.status === "DRAFT" ? (
                    <Button
                      size="sm"
                      disabled={pending || sendingId === inv.id}
                      onClick={() => sendInvoice(inv.id)}
                    >
                      {sendingId === inv.id ? "Odosielam..." : "Odoslať firme"}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
