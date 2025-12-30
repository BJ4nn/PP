import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { updateCompanyNarrowCollaborationCutoff } from "@/server/services/company";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

const schema = z.object({
  cutoffHour: z.number().int().min(0).max(12),
});

export async function PATCH(request: Request) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await requireRole(UserRole.COMPANY);

  const limit = await enforceRateLimit({
    key: `company:narrow-collaboration:${session.user.id}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const updated = await updateCompanyNarrowCollaborationCutoff(
      session.user.id,
      parsed.data.cutoffHour,
    );
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
