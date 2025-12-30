import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { updateJobPolicy } from "@/server/services/jobs";
import { updateJobPolicySchema } from "@/lib/validators/job-management";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `company:jobs:policy:${session.user.id}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json().catch(() => ({}));
  const parsed = updateJobPolicySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid policy payload" }, { status: 400 });
  }

  try {
    const job = await updateJobPolicy(session.user.id, id, parsed.data);
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
