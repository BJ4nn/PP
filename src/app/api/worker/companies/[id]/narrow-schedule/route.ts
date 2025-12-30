import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { narrowCollaborationScheduleSchema } from "@/lib/validators/narrow-collaboration";
import { applyNarrowCollaborationSchedule } from "@/server/services/narrow-collaboration";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `worker:narrow-schedule:${session.user.id}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const body = await request.json().catch(() => null);
  const parsed = narrowCollaborationScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const resolvedParams = await params;
  try {
    const result = await applyNarrowCollaborationSchedule(
      session.user.id,
      resolvedParams.id,
      parsed.data,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
