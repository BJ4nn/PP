import { format } from "date-fns";
import type { ContractTemplate, CompanyProfile, Job, WorkerProfile } from "@prisma/client";
import { formatHourlyRateEur } from "@/lib/format/money";

type RenderInput = {
  company: Pick<
    CompanyProfile,
    "companyName" | "addressStreet" | "addressCity" | "addressZip" | "region" | "ico"
  >;
  worker: Pick<WorkerProfile, "name" | "phone" | "city" | "region">;
  job: Pick<
    Job,
    | "title"
    | "startsAt"
    | "endsAt"
    | "durationHours"
    | "hourlyRate"
    | "locationCity"
    | "locationAddress"
    | "region"
    | "positionTypes"
  >;
  template: Pick<ContractTemplate, "title" | "intro" | "workplaceRules" | "customTerms">;
};

function section(title: string, body: string | null | undefined) {
  const text = (body ?? "").trim();
  if (!text) return "";
  return `\n\n${title}\n${"-".repeat(title.length)}\n${text}`;
}

function listPositionTypes(positionTypes: unknown) {
  if (!Array.isArray(positionTypes)) return null;
  const cleaned = positionTypes.filter((v) => typeof v === "string").map((v) => v.trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(", ") : null;
}

export function renderContractText(input: RenderInput) {
  const starts = format(input.job.startsAt, "d MMM yyyy HH:mm");
  const ends = format(input.job.endsAt, "d MMM yyyy HH:mm");
  const companyAddress = `${input.company.addressStreet}, ${input.company.addressZip} ${input.company.addressCity}`;
  const workerCity = `${input.worker.city}, ${input.worker.region}`;
  const positionTypes = listPositionTypes(input.job.positionTypes);

  const header = `${input.template.title}\n\n` +
    `Zmluvné strany\n` +
    `- Firma: ${input.company.companyName} (${companyAddress})${input.company.ico ? `, IČO: ${input.company.ico}` : ""}\n` +
    `- Pracovník: ${input.worker.name} (${workerCity}), tel: ${input.worker.phone}\n\n` +
    `Predmet\n` +
    `- Smena: ${input.job.title}\n` +
    `- Miesto: ${input.job.locationAddress}, ${input.job.locationCity}, ${input.job.region}\n` +
    `- Čas: ${starts} – ${ends} (${input.job.durationHours}h)\n` +
    `- Odmena: ${formatHourlyRateEur(Number(input.job.hourlyRate))}\n` +
    (positionTypes ? `- Pozície: ${positionTypes}\n` : "");

  const body =
    header +
    section("Úvod", input.template.intro) +
    section("Pravidlá pracoviska", input.template.workplaceRules) +
    section("Dohodnuté podmienky", input.template.customTerms) +
    `\n\nPodpis\n` +
    `- Firma podpisuje elektronicky v portáli (Beta).\n` +
    `- Pracovník podpisuje elektronicky v portáli (Beta) po podpise firmy.\n`;

  return body.trim() + "\n";
}
