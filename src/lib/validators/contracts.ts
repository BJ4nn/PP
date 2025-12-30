import { z } from "zod";

export const upsertContractTemplateSchema = z.object({
  title: z.string().min(3, "Názov je povinný"),
  intro: z.string().trim().max(10_000).optional(),
  workplaceRules: z.string().trim().max(10_000).optional(),
  customTerms: z.string().trim().max(20_000).optional(),
  isActive: z.boolean().optional(),
});

export type UpsertContractTemplateInput = z.infer<
  typeof upsertContractTemplateSchema
>;

export const signatureSchema = z
  .object({
    version: z.literal(1),
    strokes: z
      .array(
        z
          .array(
            z.tuple([
              z.number().min(0).max(1),
              z.number().min(0).max(1),
            ]),
          )
          .min(2),
      )
      .min(1),
  })
  .refine(
    (value) => value.strokes.reduce((sum, stroke) => sum + stroke.length, 0) <= 5000,
    { message: "Podpis je príliš veľký" },
  );

export const signContractSchema = z.object({
  signatureName: z.string().trim().min(3, "Zadajte meno a priezvisko"),
  signature: signatureSchema,
  confirm: z.literal(true, {
    errorMap: () => ({ message: "Potvrďte súhlas s podmienkami" }),
  }),
});

export type SignContractInput = z.infer<typeof signContractSchema>;

export const workerWorkedConfirmSchema = z.object({
  applicationId: z.string().min(1),
  note: z.string().trim().max(1000).optional(),
});

export type WorkerWorkedConfirmInput = z.infer<typeof workerWorkedConfirmSchema>;
