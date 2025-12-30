import { z } from "zod";

export const workerBillingSchema = z.object({
  billingName: z.string().trim().min(2).max(120),
  billingStreet: z.string().trim().min(2).max(120),
  billingZip: z.string().trim().min(3).max(12),
  billingIban: z
    .string()
    .trim()
    .min(10)
    .max(34)
    .transform((value) => value.replace(/\s+/g, "").toUpperCase()),
  billingIco: z.string().trim().min(6).max(32).optional().nullable(),
});

export type WorkerBillingInput = z.infer<typeof workerBillingSchema>;

