import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { listWorkedConfirmationCandidatesForCompanyJob } from "@/server/services/applications";

type Params = {
  params: Promise<{ id: string }>;
};

const querySchema = z.object({
  // If true, return ended confirmed applications ready to be marked as worked.
  // Keeping shape extensible for future filters.
  readyOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value !== "false"),
});

export async function GET(request: NextRequest, { params }: Params) {
  const { id: jobId } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `company:jobs:worked-candidates:${session.user.id}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    readyOnly: searchParams.get("readyOnly") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const rows = await listWorkedConfirmationCandidatesForCompanyJob(
    session.user.id,
    jobId,
  );

  return NextResponse.json(
    rows.map((row) => ({
      applicationId: row.applicationId,
      worker: row.worker,
      job: { id: row.job.id, title: row.job.title, endsAtIso: row.job.endsAt.toISOString() },
    })),
  );
}

