export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { createInvoiceSchema } from "@/lib/validators/invoices";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { createInvoiceForWorker } from "@/server/services/invoices/worker";

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await requireRole(UserRole.WORKER);

  const limit = await enforceRateLimit({
    key: `worker:create-invoice:${session.user.id}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json().catch(() => ({}));
  const parsed = createInvoiceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const invoice = await createInvoiceForWorker(session.user.id, parsed.data);
    return NextResponse.json({ id: invoice.id });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to create invoice" },
      { status: 400 },
    );
  }
}

