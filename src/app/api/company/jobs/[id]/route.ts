import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import {
  getJobForCompany,
  updateJob,
} from "@/server/services/jobs";
import { updateJobSchema } from "@/lib/validators/jobs";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const job = await getJobForCompany(session.user.id, id);
    if (!job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `company:jobs:update:${session.user.id}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const body = await request.json();
  const parsed = updateJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid job update payload" },
      { status: 400 },
    );
  }

  try {
    const job = await updateJob(session.user.id, id, parsed.data);
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
