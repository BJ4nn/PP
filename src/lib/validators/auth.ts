import { z } from "zod";
import { UserRole } from "@/types";

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole).refine(
    (role) => role === UserRole.WORKER || role === UserRole.COMPANY,
    { message: "Only worker or company accounts can register via the portal." },
  ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
