export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { getCompanyProfileById, rejectCompanyProfile } from "@/server/services/company";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

const rejectSchema = z.object({
  confirm: z.literal(true),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `admin:company-reject:${session.user.id}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json().catch(() => ({}));
  const parsed = rejectSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const company = await getCompanyProfileById(resolvedParams.id);
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  try {
    await rejectCompanyProfile({ companyId: company.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to reject company" },
      { status: 500 },
    );
  }
}

