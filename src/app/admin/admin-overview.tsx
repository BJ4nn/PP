import type { AdminDashboardData } from "@/app/admin/admin-types";

export function AdminOverview({
  counts,
  noDataYet,
}: {
  counts: AdminDashboardData["counts"];
  noDataYet: boolean;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Pracovníci", value: counts.workers },
          { label: "Firmy", value: counts.companies },
          { label: "Otvorené zmeny", value: counts.openJobs },
          { label: "Prihlášky", value: counts.applications },
          { label: "Neskoré zrušenia", value: counts.lateCancellations },
          {
            label: "Kompenzácie (€)",
            value: Number(counts.compensationTotalEur ?? 0).toFixed(0),
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-3xl font-semibold text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Slúži na overenie, či onboarding, párovanie a rušenie fungujú v reálnej
        prevádzke.
      </div>
      {noDataYet ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Zatiaľ tu nie sú žiadne dáta – keď začnú pracovníci a firmy portál
          používať, objavia sa tu.
        </div>
      ) : null}
    </section>
  );
}
