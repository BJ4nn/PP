export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { workerBillingSchema } from "@/lib/validators/worker-billing";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { updateWorkerBilling } from "@/server/services/worker-billing";

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await requireRole(UserRole.WORKER);

  const limit = await enforceRateLimit({
    key: `worker:billing:${session.user.id}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json().catch(() => ({}));
  const parsed = workerBillingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await updateWorkerBilling(session.user.id, parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to update billing" },
      { status: 500 },
    );
  }
}

