import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { createJob, listCompanyJobs } from "@/server/services/jobs";
import { createJobSchema } from "@/lib/validators/jobs";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await listCompanyJobs(session.user.id);
    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `company:jobs:create:${session.user.id}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json();
  const parsed = createJobSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid job payload" },
      { status: 400 },
    );
  }

  try {
    const job = await createJob(session.user.id, parsed.data);
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
