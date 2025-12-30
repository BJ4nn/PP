import { format } from "date-fns";
import { sk } from "date-fns/locale";

type InvoiceMeta = {
  supplier?: {
    name?: string | null;
    street?: string | null;
    city?: string | null;
    zip?: string | null;
    region?: string | null;
    email?: string | null;
    phone?: string | null;
    iban?: string | null;
    ico?: string | null;
    note?: string | null;
  } | null;
  buyer?: {
    name?: string | null;
    street?: string | null;
    city?: string | null;
    zip?: string | null;
    region?: string | null;
    ico?: string | null;
  } | null;
  payment?: {
    method?: string | null;
    variableSymbol?: string | null;
  } | null;
};

type InvoiceLine = {
  id: string;
  jobTitle: string;
  startsAt: Date;
  endsAt: Date;
  hours: number;
  amountEur: number;
};

type InvoiceData = {
  invoiceNumber: string;
  status: string;
  issuedAt: Date;
  dueAt: Date;
  currency: string;
  totalEur: number;
  meta?: unknown;
  lines: InvoiceLine[];
};

function asMeta(meta: unknown): InvoiceMeta | null {
  if (!meta || typeof meta !== "object") return null;
  return meta as InvoiceMeta;
}

function formatMoneyEur(valueEur: number) {
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(valueEur);
}

function labelStatus(status: string) {
  if (status === "DRAFT") return "Rozpracovaná";
  if (status === "SENT") return "Odoslaná";
  if (status === "PAID") return "Zaplatená";
  if (status === "VOID") return "Stornovaná";
  return status;
}

function renderSupplier(meta: InvoiceMeta | null) {
  const data = meta?.supplier ?? null;
  const address = [
    data?.street ?? null,
    [data?.zip ?? null, data?.city ?? null].filter(Boolean).join(" "),
  ].filter(Boolean);
  return (
    <div className="space-y-1 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Dodávateľ
      </p>
      <p className="font-semibold text-foreground">{data?.name ?? "—"}</p>
      {address.length > 0 ? (
        <p className="text-muted-foreground">{address.join(", ")}</p>
      ) : (
        <p className="text-muted-foreground">—</p>
      )}
      {data?.ico ? <p className="text-muted-foreground">IČO: {data.ico}</p> : null}
      {data?.iban ? <p className="text-muted-foreground">IBAN: {data.iban}</p> : null}
      {data?.email ? <p className="text-muted-foreground">Email: {data.email}</p> : null}
      {data?.phone ? <p className="text-muted-foreground">Tel.: {data.phone}</p> : null}
      {data?.note ? <p className="text-muted-foreground">{data.note}</p> : null}
    </div>
  );
}

function renderBuyer(meta: InvoiceMeta | null) {
  const data = meta?.buyer ?? null;
  const address = [
    data?.street ?? null,
    [data?.zip ?? null, data?.city ?? null].filter(Boolean).join(" "),
  ].filter(Boolean);
  return (
    <div className="space-y-1 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Odberateľ
      </p>
      <p className="font-semibold text-foreground">{data?.name ?? "—"}</p>
      {address.length > 0 ? (
        <p className="text-muted-foreground">{address.join(", ")}</p>
      ) : (
        <p className="text-muted-foreground">—</p>
      )}
      {data?.ico ? <p className="text-muted-foreground">IČO: {data.ico}</p> : null}
    </div>
  );
}

export function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  const meta = asMeta(invoice.meta);
  const vs = meta?.payment?.variableSymbol ?? "—";
  const deliveryDate =
    invoice.lines.length > 0
      ? invoice.lines.reduce(
          (latest, line) => (line.endsAt.getTime() > latest.getTime() ? line.endsAt : latest),
          invoice.lines[0]!.endsAt,
        )
      : null;

  const subtotal = invoice.lines.reduce((sum, l) => sum + l.amountEur, 0);
  const total = invoice.totalEur ?? subtotal;

  return (
    <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Faktúra
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            {invoice.invoiceNumber}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stav: <span className="font-semibold">{labelStatus(invoice.status)}</span>
          </p>
        </div>
        <div className="grid gap-2 text-sm md:text-right">
          <div>
            <p className="text-xs text-muted-foreground">Dátum vystavenia</p>
            <p className="font-semibold text-foreground">
              {format(invoice.issuedAt, "d MMM yyyy", { locale: sk })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dátum splatnosti</p>
            <p className="font-semibold text-foreground">
              {format(invoice.dueAt, "d MMM yyyy", { locale: sk })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dátum dodania</p>
            <p className="font-semibold text-foreground">
              {deliveryDate ? format(deliveryDate, "d MMM yyyy", { locale: sk }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Variabilný symbol</p>
            <p className="font-semibold text-foreground">{vs}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {renderSupplier(meta)}
        {renderBuyer(meta)}
      </div>

      <div className="mt-6 rounded-2xl border border-border">
        <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/10 px-4 py-3 text-xs font-semibold text-muted-foreground">
          <div className="col-span-6">Položka</div>
          <div className="col-span-3 text-right">Hodiny</div>
          <div className="col-span-3 text-right">Suma</div>
        </div>
        <div className="divide-y divide-border">
          {invoice.lines.map((line) => (
            <div key={line.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
              <div className="col-span-6">
                <p className="font-semibold text-foreground">{line.jobTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {format(line.startsAt, "d MMM yyyy HH:mm", { locale: sk })} –{" "}
                  {format(line.endsAt, "HH:mm", { locale: sk })}
                </p>
              </div>
              <div className="col-span-3 text-right text-foreground">{line.hours} h</div>
              <div className="col-span-3 text-right font-semibold text-foreground">
                {formatMoneyEur(line.amountEur)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Platobné údaje
          </p>
          <p className="mt-2">
            Spôsob úhrady:{" "}
            <span className="font-semibold text-foreground">
              {meta?.payment?.method === "BANK_TRANSFER" ? "Bankový prevod" : "—"}
            </span>
          </p>
          <p className="mt-1">
            Variabilný symbol: <span className="font-semibold text-foreground">{vs}</span>
          </p>
          <p className="mt-1">
            Konštantný symbol:{" "}
            <span className="font-semibold text-foreground">0308</span>
          </p>
          {meta?.supplier?.iban ? (
            <p className="mt-1">
              IBAN: <span className="font-semibold text-foreground">{meta.supplier.iban}</span>
            </p>
          ) : (
            <p className="mt-1 text-destructive">
              Chýba IBAN dodávateľa – doplňte ho v nastaveniach fakturácie.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-muted/5 p-4 text-sm">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Medzisúčet</p>
            <p className="font-semibold text-foreground">{formatMoneyEur(subtotal)}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-muted-foreground">DPH</p>
            <p className="font-semibold text-foreground">{formatMoneyEur(0)}</p>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2">
            <p className="font-semibold text-foreground">Spolu na úhradu</p>
            <p className="text-lg font-semibold text-foreground">{formatMoneyEur(total)}</p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Faktúra je generovaná v systéme Warehouse Flex Portal. V prípade otázok kontaktujte dodávateľa.
      </p>
    </div>
  );
}
