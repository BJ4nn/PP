import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { applyToJob } from "@/server/services/applications";
import { createApplicationSchema } from "@/lib/validators/applications";
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
  if (!session?.user || session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `worker:apply:${session.user.id}`,
    limit: 15,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json();
  const parsed = createApplicationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const application = await applyToJob(
      session.user.id,
      id,
      parsed.data,
    );
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
