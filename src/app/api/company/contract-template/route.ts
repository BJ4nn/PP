import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { upsertContractTemplateSchema } from "@/lib/validators/contracts";
import { getCompanyContractTemplate, upsertCompanyContractTemplate } from "@/server/services/contracts";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const template = await getCompanyContractTemplate(session.user.id);
  return NextResponse.json(template);
}

export async function PUT(request: Request) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `company:contract-template:${session.user.id}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json().catch(() => ({}));
  const parsed = upsertContractTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid template payload" }, { status: 400 });
  }

  const saved = await upsertCompanyContractTemplate(session.user.id, parsed.data);
  return NextResponse.json(saved);
}

