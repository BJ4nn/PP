import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { updateJobStatusForCompany } from "@/server/services/jobs";
import { jobStatusUpdateSchema } from "@/lib/validators/applications";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `company:jobs:status:${session.user.id}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json();
  const parsed = jobStatusUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const job = await updateJobStatusForCompany({
      jobId: id,
      companyUserId: session.user.id,
      nextStatus: parsed.data.status,
    });
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
