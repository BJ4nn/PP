import { describe, it, expect } from "vitest";
import {
  createNotificationForUser,
  getNotificationsForUser,
  markNotificationsAsRead,
} from "@/server/services/notifications";
import { NotificationType } from "@/types";
import { prismaMock } from "./setup";

describe("notifications service", () => {
  it("builds copy for notification type and stores it", async () => {
    prismaMock.notification.create.mockResolvedValue({ id: "notif-1" } as never);

    await createNotificationForUser("user-1", NotificationType.WORKER_APPLICATION_CONFIRMED, {
      jobTitle: "Night shift",
      shiftWindow: "10 Mar 08:00 - 16:00",
    });

    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        type: NotificationType.WORKER_APPLICATION_CONFIRMED,
        title: "Zmena potvrdená",
        body: expect.stringContaining("Night shift"),
      }),
    });
  });

  it("lists notifications with optional unread filter", async () => {
    await getNotificationsForUser("user-1");
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    await getNotificationsForUser("user-1", { onlyUnread: true, take: 10 });
    expect(prismaMock.notification.findMany).toHaveBeenLastCalledWith({
      where: { userId: "user-1", isRead: false },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  });

  it("marks notifications as read and returns updated rows", async () => {
    prismaMock.notification.findMany.mockResolvedValue([{ id: "n1" }] as never);

    const result = await markNotificationsAsRead("user-1", ["n1", "n2"]);

    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["n1", "n2"] }, userId: "user-1" },
      data: { isRead: true, readAt: expect.any(Date) },
    });
    expect(result).toEqual([{ id: "n1" }]);
  });
});
