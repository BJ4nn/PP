import { z } from "zod";
import { NoticeWindow } from "@/types";

export const updateJobSlotsSchema = z.object({
  neededWorkers: z.coerce
    .number({
      required_error: "Počet pracovníkov je povinný",
      invalid_type_error: "Počet pracovníkov musí byť číslo",
    })
    .int("Počet pracovníkov musí byť celé číslo")
    .min(1, "Počet pracovníkov musí byť aspoň 1"),
});

export type UpdateJobSlotsInput = z.infer<typeof updateJobSlotsSchema>;

export const updateJobPolicySchema = z.object({
  noticeWindow: z.nativeEnum(NoticeWindow),
  cancellationCompensationPct: z.coerce
    .number({
      required_error: "Kompenzácia je povinná",
      invalid_type_error: "Kompenzácia musí byť číslo",
    })
    .min(0)
    .max(100),
});

export type UpdateJobPolicyInput = z.infer<typeof updateJobPolicySchema>;
