import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth";
import { UserRole } from "@/types";

describe("auth validators", () => {
  it("normalizes login email to lowercase", () => {
    const parsed = loginSchema.parse({ email: "TEST@EXAMPLE.COM", password: "Abcdef" });
    expect(parsed.email).toBe("test@example.com");
  });

  it("rejects admin registration via portal", () => {
    const parsed = registerSchema.safeParse({
      email: "a@b.com",
      password: "Abcdef",
      role: UserRole.ADMIN,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts minimum password with uppercase", () => {
    const parsed = registerSchema.safeParse({
      email: "test@example.com",
      password: "Abcdef",
      role: UserRole.WORKER,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects password without uppercase", () => {
    const parsed = registerSchema.safeParse({
      email: "test@example.com",
      password: "abcdef",
      role: UserRole.WORKER,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects password shorter than 6 characters", () => {
    const parsed = registerSchema.safeParse({
      email: "test@example.com",
      password: "Abcde",
      role: UserRole.WORKER,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts forgot password email", () => {
    const parsed = forgotPasswordSchema.safeParse({ email: "test@example.com" });
    expect(parsed.success).toBe(true);
  });

  it("accepts reset password input", () => {
    const parsed = resetPasswordSchema.safeParse({
      token: "a".repeat(64),
      password: "Abcdef",
    });
    expect(parsed.success).toBe(true);
  });
});
