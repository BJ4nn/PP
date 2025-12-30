import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import {
  getWorkerPreferences,
  updateWorkerPreferences,
} from "@/server/services/worker";
import { workerPreferencesSchema } from "@/lib/validators/worker-preferences";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prefs = await getWorkerPreferences(session.user.id);
    return NextResponse.json(prefs);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `worker:prefs:update:${session.user.id}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const body = await request.json();
  const parsed = workerPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid worker preferences payload" },
      { status: 400 },
    );
  }

  try {
    const prefs = await updateWorkerPreferences(session.user.id, parsed.data);
    return NextResponse.json(prefs);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export const POST = PATCH;
