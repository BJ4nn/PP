import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { notificationMarkReadSchema } from "@/lib/validators/notifications";
import { markNotificationsAsRead } from "@/server/services/notifications";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";

export async function POST(request: Request) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit({
    key: `notifications:mark-read:${session.user.id}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (limit) return limit;

  const payload = await request.json();
  const parsed = notificationMarkReadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated = await markNotificationsAsRead(
    session.user.id,
    parsed.data.ids,
  );

  return NextResponse.json({ success: true, updated });
}
