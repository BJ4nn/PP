import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import { UserRole } from "@/types";

describe("auth validators", () => {
  it("normalizes login email to lowercase", () => {
    const parsed = loginSchema.parse({ email: "TEST@EXAMPLE.COM", password: "password123" });
    expect(parsed.email).toBe("test@example.com");
  });

  it("rejects admin registration via portal", () => {
    const parsed = registerSchema.safeParse({
      email: "a@b.com",
      password: "password123",
      role: UserRole.ADMIN,
    });
    expect(parsed.success).toBe(false);
  });
});

