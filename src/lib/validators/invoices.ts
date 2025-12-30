import { z } from "zod";

export const createInvoiceSchema = z.object({
  applicationIds: z.array(z.string().min(1)).min(1),
  dueDays: z.number().int().min(1).max(60).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const createMonthlyInvoicesSchema = z
  .object({
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).max(2100).optional(),
  })
  .refine((data) => (data.month === undefined) === (data.year === undefined), {
    message: "Month and year must be provided together.",
  });

export type CreateMonthlyInvoicesInput = z.infer<typeof createMonthlyInvoicesSchema>;
