import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { setWorkerReadyState } from "@/server/services/worker";
import { workerReadyToggleSchema } from "@/lib/validators/applications";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

export async function PATCH(request: Request) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `worker:ready:${session.user.id}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json();
  const parsed = workerReadyToggleSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    await setWorkerReadyState(session.user.id, parsed.data.isReady);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
