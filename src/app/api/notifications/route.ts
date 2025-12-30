import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { getNotificationsForUser } from "@/server/services/notifications";
import { notificationQuerySchema } from "@/lib/validators/notifications";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = notificationQuerySchema.safeParse({
    onlyUnread: searchParams.get("onlyUnread") ?? undefined,
  });

  const onlyUnread = parsed.success ? parsed.data.onlyUnread : false;

  const notifications = await getNotificationsForUser(session.user.id, {
    onlyUnread,
  });

  return NextResponse.json(notifications);
}
