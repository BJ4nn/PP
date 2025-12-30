import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { deleteCompanyNarrowCollaborationScheme } from "@/server/services/narrow-collaboration";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, { params }: Params) {
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

  const resolvedParams = await params;
  try {
    const scheme = await deleteCompanyNarrowCollaborationScheme(
      session.user.id,
      resolvedParams.id,
    );
    return NextResponse.json(scheme);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
