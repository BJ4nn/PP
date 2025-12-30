import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { workerWorkedConfirmSchema } from "@/lib/validators/contracts";
import { confirmWorkedByWorker } from "@/server/services/applications/worked-worker";

export async function POST(request: Request) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `worker:worked:confirm:${session.user.id}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json().catch(() => ({}));
  const parsed = workerWorkedConfirmSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await confirmWorkedByWorker(
      session.user.id,
      parsed.data.applicationId,
      parsed.data.note,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

