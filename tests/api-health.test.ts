import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "./setup";

describe("API /health", () => {
  it("returns 200 when DB ping succeeds", async () => {
    prismaMock.$queryRaw.mockImplementationOnce(async () => 1 as never);
    const { GET } = await import("@/app/api/health/route");

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(expect.objectContaining({ status: "ok", db: "ok" }));
  });

  it("returns 503 when DB ping fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.$queryRaw.mockImplementationOnce(async () => {
      throw new Error("db down");
    });
    const { GET } = await import("@/app/api/health/route");

    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual(expect.objectContaining({ status: "error", db: "error" }));
    errorSpy.mockRestore();
  });
});
