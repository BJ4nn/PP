import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { companyOnboardingSchema } from "@/lib/validators/onboarding";
import { completeCompanyOnboarding } from "@/server/services/company";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

export async function POST(request: Request) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = await enforceRateLimit({
    key: `company:onboarding:${session.user.id}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json();
  const parsed = companyOnboardingSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 },
    );
  }

  await completeCompanyOnboarding(session.user.id, parsed.data);

  return NextResponse.json({ success: true });
}
