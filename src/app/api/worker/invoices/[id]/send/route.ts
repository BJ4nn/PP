export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { sendWorkerInvoice } from "@/server/services/invoices/worker";

const sendSchema = z.object({
  confirm: z.literal(true),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await requireRole(UserRole.WORKER);

  const limit = await enforceRateLimit({
    key: `worker:send-invoice:${session.user.id}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json().catch(() => ({}));
  const parsed = sendSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id } = await params;
  try {
    await sendWorkerInvoice(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to send invoice" },
      { status: 400 },
    );
  }
}

