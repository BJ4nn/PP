import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { signContractSchema } from "@/lib/validators/contracts";
import { companySignContract } from "@/server/services/contracts";
import { getClientIp } from "@/server/security/request";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `company:contracts:sign:${session.user.id}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const { id } = await params;
  const payload = await request.json().catch(() => ({}));
  const parsed = signContractSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signature payload" }, { status: 400 });
  }

  try {
    const updated = await companySignContract(session.user.id, id, parsed.data.signatureName, parsed.data.signature, {
      ip: getClientIp(request.headers),
      userAgent: request.headers.get("user-agent"),
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
