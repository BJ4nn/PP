import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { narrowCollaborationSchemeSchema } from "@/lib/validators/narrow-collaboration";
import {
  createCompanyNarrowCollaborationScheme,
  getCompanyNarrowCollaborationSettings,
} from "@/server/services/narrow-collaboration";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getCompanyNarrowCollaborationSettings(session.user.id);
    return NextResponse.json(settings.schemes);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `company:narrow-collaboration-schemes:${session.user.id}`,
    limit: 15,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const body = await request.json().catch(() => null);
  const parsed = narrowCollaborationSchemeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const scheme = await createCompanyNarrowCollaborationScheme(
      session.user.id,
      parsed.data,
    );
    return NextResponse.json(scheme, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
