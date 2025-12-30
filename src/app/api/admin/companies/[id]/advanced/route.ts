export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { getCompanyProfileById, setCompanyAdvancedMode } from "@/server/services/company";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

const schema = z.object({
  enabled: z.boolean(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `admin:company-advanced:${session.user.id}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const resolvedParams = await params;
  const payload = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const company = await getCompanyProfileById(resolvedParams.id);
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  try {
    await setCompanyAdvancedMode({
      companyId: company.id,
      enabled: parsed.data.enabled,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to update advanced mode" },
      { status: 500 },
    );
  }
}
