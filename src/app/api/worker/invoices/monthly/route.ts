export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { createMonthlyInvoicesForWorker } from "@/server/services/invoices/worker";
import { createMonthlyInvoicesSchema } from "@/lib/validators/invoices";

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await requireRole(UserRole.WORKER);

  const limit = await enforceRateLimit({
    key: `worker:create-monthly-invoices:${session.user.id}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json().catch(() => ({}));
  const parsed = createMonthlyInvoicesSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const selection =
      parsed.data.month && parsed.data.year
        ? { month: parsed.data.month, year: parsed.data.year }
        : undefined;
    const result = await createMonthlyInvoicesForWorker(session.user.id, selection);
    return NextResponse.json({
      created: result.created,
      month: result.month,
      year: result.year,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to create invoices" },
      { status: 400 },
    );
  }
}
