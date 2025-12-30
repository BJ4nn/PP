import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { getCompanyBonusesCsv } from "@/server/services/exports";

function parseRangeDays(value: string | null) {
  const n = Number(value);
  return [7, 30, 90].includes(n) ? n : 30;
}

function safeFilenamePart(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  return cleaned || "unknown";
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const csv = await getCompanyBonusesCsv(session.user.id, request.url);
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  const rangeDays = parseRangeDays(url.searchParams.get("range"));
  const filename = jobId
    ? `bonuses_job-${safeFilenamePart(jobId)}.csv`
    : `bonuses_last-${rangeDays}d.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
