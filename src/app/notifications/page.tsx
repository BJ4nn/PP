import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { NotificationList } from "@/components/notifications/notification-list";
import { requireSession } from "@/lib/auth/session";
import { UserRole } from "@/types";

export const metadata: Metadata = {
  title: "Oznámenia · Warehouse Flex Portal",
};

export default async function NotificationsPage() {
  const session = await requireSession();
  const homeHref =
    session.user.role === UserRole.WORKER
      ? "/worker/dashboard"
      : session.user.role === UserRole.COMPANY
        ? "/company/dashboard"
        : session.user.role === UserRole.ADMIN
          ? "/admin"
          : "/";

  return (
    <AppShell
      title="Oznámenia"
      subtitle="Aktualizácie o prihláškach a zmenách."
      homeHref={homeHref}
    >
      <NotificationList />
    </AppShell>
  );
}
