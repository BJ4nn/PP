import { z } from "zod";

export const notificationMarkReadSchema = z.object({
  ids: z.array(z.string().cuid()).min(1),
});

export const notificationQuerySchema = z.object({
  onlyUnread: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});
