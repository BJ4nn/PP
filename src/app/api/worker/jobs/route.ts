import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { ContractType, NoticeWindow, UserRole } from "@/types";
import { listOpenJobsForWorker } from "@/server/services/jobs";
import type { WorkerJobFeedFilters } from "@/server/services/jobs/worker-feed";

const isContractType = (value: string): value is ContractType =>
  (Object.values(ContractType) as string[]).includes(value);

const isNoticeWindow = (value: string): value is NoticeWindow =>
  (Object.values(NoticeWindow) as string[]).includes(value);

const isBoolString = (value: string): value is "true" | "false" =>
  value === "true" || value === "false";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const contractTypeRaw = url.searchParams.get("contractType");
  const noticeWindowRaw =
    url.searchParams.get("noticeWindow") ?? url.searchParams.get("minNoticeWindow");
  const isUrgentRaw = url.searchParams.get("isUrgent");
  const isBundleRaw = url.searchParams.get("isBundle");
  const hasBonusRaw = url.searchParams.get("hasBonus");
  const favoritesOnlyRaw = url.searchParams.get("favoritesOnly");
  const cityRaw = url.searchParams.get("city");

  const contractType =
    contractTypeRaw && isContractType(contractTypeRaw)
      ? contractTypeRaw
      : undefined;
  const noticeWindow =
    noticeWindowRaw && isNoticeWindow(noticeWindowRaw)
      ? noticeWindowRaw
      : undefined;

  try {
    const filters: WorkerJobFeedFilters = {};
    if (contractType) filters.contractType = contractType;
    if (noticeWindow) filters.noticeWindow = noticeWindow;
    if (isUrgentRaw && isBoolString(isUrgentRaw)) filters.isUrgent = isUrgentRaw === "true";
    if (isBundleRaw && isBoolString(isBundleRaw)) filters.isBundle = isBundleRaw === "true";
    if (hasBonusRaw && isBoolString(hasBonusRaw)) filters.hasBonus = hasBonusRaw === "true";
    if (favoritesOnlyRaw && isBoolString(favoritesOnlyRaw) && favoritesOnlyRaw === "true") {
      filters.favoritesOnly = true;
    }
    if (cityRaw && cityRaw.trim().length > 0) {
      filters.city = cityRaw.trim();
    }

    const jobs = await listOpenJobsForWorker(session.user.id, filters);
    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
