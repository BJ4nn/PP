import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import {
  cancelApplicationByCompany,
  updateApplicationStatus,
} from "@/server/services/applications";
import { companyApplicationStatusSchema } from "@/lib/validators/applications";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Application id is missing" },
      { status: 400 },
    );
  }
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `company:applications:manage:${session.user.id}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json();

  if (payload?.action === "cancel") {
    try {
      await cancelApplicationByCompany(session.user.id, id);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 },
      );
    }
  }

  const parsed = companyApplicationStatusSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 },
    );
  }

  try {
    const application = await updateApplicationStatus(
      session.user.id,
      id,
      parsed.data,
    );
    return NextResponse.json(application);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
