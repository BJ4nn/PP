import { z } from "zod";
import { UserRole } from "@/types";

const passwordSchema = z
  .string()
  .min(6)
  .regex(/[A-Z]/, "Heslo musí obsahovať veľké písmeno.");

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: passwordSchema,
  role: z.nativeEnum(UserRole).refine(
    (role) => role === UserRole.WORKER || role === UserRole.COMPANY,
    { message: "Only worker or company accounts can register via the portal." },
  ),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
