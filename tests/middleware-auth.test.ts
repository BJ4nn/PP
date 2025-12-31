import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import middleware from "@/middleware";
import { UserRole } from "@/types";

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

const { getToken } = await import("next-auth/jwt");

const makeRequest = (path: string) =>
  ({
    nextUrl: new URL(`https://example.com${path}`),
    url: `https://example.com${path}`,
    headers: new Headers(),
  }) as unknown as NextRequest;

describe("middleware auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not pass secret when missing", async () => {
    const originalSecret = process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    (getToken as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      null,
    );

    await middleware(makeRequest("/worker/dashboard"));

    const callArg = (getToken as unknown as { mock: { calls: Array<[unknown]> } }).mock
      .calls[0]?.[0] as { secret?: string };
    expect(callArg).toBeTruthy();
    expect(callArg).not.toHaveProperty("secret");

    if (originalSecret) {
      process.env.NEXTAUTH_SECRET = originalSecret;
    }
  });

  it("redirects unauthenticated users to login", async () => {
    (getToken as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      null,
    );

    const response = await middleware(makeRequest("/worker/dashboard"));

    expect(getToken).toHaveBeenCalled();
    expect(response?.headers.get("location")).toContain("/auth/login");
  });

  it("uses secure authjs cookie name for https", async () => {
    (getToken as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      null,
    );

    await middleware(makeRequest("/worker/dashboard"));

    const callArg = (getToken as unknown as { mock: { calls: Array<[unknown]> } }).mock
      .calls[0]?.[0] as { cookieName?: string };
    expect(callArg?.cookieName).toBe("__Secure-authjs.session-token");
  });

  it("redirects users to their role dashboard when route role mismatches", async () => {
    (getToken as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue(
      { role: UserRole.WORKER },
    );

    const response = await middleware(makeRequest("/company/jobs"));

    expect(getToken).toHaveBeenCalled();
    expect(response?.headers.get("location")).toBe("https://example.com/worker/dashboard");
  });
});
