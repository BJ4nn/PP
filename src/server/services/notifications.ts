import { prisma } from "@/server/db/client";
import type { Prisma } from "@prisma/client";
import { NotificationType } from "@/types";

type NotificationMeta = Prisma.JsonObject;

function getStr(meta: NotificationMeta, key: string) {
  const value = meta[key];
  return typeof value === "string" ? value : undefined;
}

function getNum(meta: NotificationMeta, key: string) {
  const value = meta[key];
  return typeof value === "number" ? value : undefined;
}

const notificationCopy: Record<
  NotificationType,
  (meta: NotificationMeta) => { title: string; body: string }
> = {
  [NotificationType.WORKER_APPLICATION_CONFIRMED]: (meta) => ({
    title: "Zmena potvrdená",
    body: `Vaša prihláška na ${getStr(meta, "jobTitle") ?? "zmenu"} bola potvrdená. Dostavte sa ${getStr(meta, "shiftWindow") ?? "v dohodnutom čase"}.`,
  }),
  [NotificationType.WORKER_APPLICATION_REJECTED]: (meta) => ({
    title: "Aktualizácia prihlášky",
    body: `Sklad si pre ${getStr(meta, "jobTitle") ?? "túto zmenu"} vybral iného pracovníka. Ak chcete vidieť nové ponuky, nechajte režim „Som pripravený“.`,
  }),
  [NotificationType.WORKER_APPLICATION_CANCELED_BY_COMPANY]: (meta) => ({
    title: "Prihláška zrušená firmou",
    body: `${getStr(meta, "companyName") ?? "Firma"} zrušila vašu prihlášku na ${getStr(meta, "jobTitle") ?? "zmenu"}.`,
  }),
  [NotificationType.WORKER_APPLICATION_CANCELED_LATE_BY_COMPANY]: (meta) => ({
    title: "Zmena zrušená na poslednú chvíľu",
    body: `${getStr(meta, "companyName") ?? "Firma"} zrušila potvrdenú zmenu ${getStr(meta, "jobTitle") ?? ""} (${getStr(meta, "shiftWindow") ?? "uvedený čas"}). Kompenzácia: €${Number(getNum(meta, "compensationAmount") ?? 0).toFixed(2)}.`,
  }),
  [NotificationType.WORKER_JOB_CANCELED]: (meta) => ({
    title: "Zmena zrušená",
    body: `${getStr(meta, "companyName") ?? "Firma"} zrušila zmenu ${getStr(meta, "jobTitle") ?? ""} naplánovanú na ${getStr(meta, "shiftWindow") ?? "uvedený čas"}.`,
  }),
  [NotificationType.COMPANY_NEW_APPLICATION]: (meta) => ({
    title: "Nová prihláška",
    body: `${getStr(meta, "workerName") ?? "Pracovník"} sa prihlásil na ${getStr(meta, "jobTitle") ?? "vašu zmenu"} (${getStr(meta, "shiftWindow") ?? "čoskoro"}). Po potvrdení nezabudnite podpísať zmluvu.`,
  }),
  [NotificationType.COMPANY_APPLICATION_CANCELED_BY_WORKER]: (meta) => ({
    title: "Pracovník zrušil prihlášku",
    body: `${getStr(meta, "workerName") ?? "Pracovník"} zrušil prihlášku na ${getStr(meta, "jobTitle") ?? "vašu zmenu"}.`,
  }),
  [NotificationType.COMPANY_APPLICATION_CANCELED_LATE_BY_WORKER]: (meta) => ({
    title: "Neskoré odhlásenie pracovníka",
    body: `${getStr(meta, "workerName") ?? "Pracovník"} zrušil potvrdenú zmenu ${getStr(meta, "jobTitle") ?? "vašu zmenu"} na poslednú chvíľu (${getStr(meta, "shiftWindow") ?? "čoskoro"}).`,
  }),
  [NotificationType.WORKER_CONTRACT_READY]: (meta) => ({
    title: "Zmluva na podpis",
    body: `${getStr(meta, "companyName") ?? "Firma"} sprístupnila zmluvu k ${getStr(meta, "jobTitle") ?? "smene"}. Podpíšte ju v portáli.`,
  }),
  [NotificationType.COMPANY_CONTRACT_READY]: (meta) => ({
    title: "Zmluva čaká na podpis",
    body: `Podpíšte zmluvu k ${getStr(meta, "jobTitle") ?? "smene"} (${getStr(meta, "workerName") ?? "pracovník"}).`,
  }),
  [NotificationType.COMPANY_CONTRACT_COMPLETED]: (meta) => ({
    title: "Zmluva dokončená",
    body: `${getStr(meta, "workerName") ?? "Pracovník"} podpísal zmluvu k ${getStr(meta, "jobTitle") ?? "smene"}.`,
  }),
};

export async function createNotificationForUser(
  userId: string,
  type: NotificationType,
  meta: NotificationMeta = {},
) {
  const builder = notificationCopy[type];
  const { title, body } = builder(meta);

  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      meta,
    },
  });
}

export async function getNotificationsForUser(
  userId: string,
  options?: { onlyUnread?: boolean; take?: number },
) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(options?.onlyUnread ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.take ?? 50,
  });
}

export async function markNotificationsAsRead(
  userId: string,
  notificationIds: string[],
) {
  if (notificationIds.length === 0) return [];

  await prisma.notification.updateMany({
    where: { id: { in: notificationIds }, userId },
    data: { isRead: true, readAt: new Date() },
  });

  return prisma.notification.findMany({
    where: { id: { in: notificationIds }, userId },
  });
}
