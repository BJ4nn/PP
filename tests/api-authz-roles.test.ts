import { describe, it, expect, beforeAll } from "vitest";
import { authMock } from "./setup";
import { UserRole } from "@/types";

type RouteModule = Record<string, unknown>;

function withIdParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("API authorization (role bypass)", () => {
  let companyJobs: RouteModule;
  let companyJobById: RouteModule;
  let companyJobStatus: RouteModule;
  let companyJobPolicy: RouteModule;
  let companyJobSlots: RouteModule;
  let companyOnboarding: RouteModule;
  let companyApplicationById: RouteModule;
  let companyWorked: RouteModule;
  let exportsHours: RouteModule;
  let exportsBonuses: RouteModule;

  let workerJobs: RouteModule;
  let workerJobApply: RouteModule;
  let workerOnboarding: RouteModule;
  let workerReady: RouteModule;
  let workerApplications: RouteModule;
  let workerApplicationCancel: RouteModule;
  let workerPreferences: RouteModule;
  let workerPrefs: RouteModule;

  let notifications: RouteModule;
  let notificationsMarkRead: RouteModule;

  let adminCompanyApproval: RouteModule;
  let adminCompanyReject: RouteModule;
  let authRegister: RouteModule;

  beforeAll(async () => {
    companyJobs = await import("@/app/api/company/jobs/route");
    companyJobById = await import("@/app/api/company/jobs/[id]/route");
    companyJobStatus = await import("@/app/api/company/jobs/[id]/status/route");
    companyJobPolicy = await import("@/app/api/company/jobs/[id]/policy/route");
    companyJobSlots = await import("@/app/api/company/jobs/[id]/slots/route");
    companyOnboarding = await import("@/app/api/company/onboarding/route");
    companyApplicationById = await import("@/app/api/company/applications/[id]/route");
    companyWorked = await import("@/app/api/company/applications/worked/route");
    exportsHours = await import("@/app/api/company/exports/hours/route");
    exportsBonuses = await import("@/app/api/company/exports/bonuses/route");

    workerJobs = await import("@/app/api/worker/jobs/route");
    workerJobApply = await import("@/app/api/worker/jobs/[id]/apply/route");
    workerOnboarding = await import("@/app/api/worker/onboarding/route");
    workerReady = await import("@/app/api/worker/ready/route");
    workerApplications = await import("@/app/api/worker/applications/route");
    workerApplicationCancel = await import("@/app/api/worker/applications/[id]/cancel/route");
    workerPreferences = await import("@/app/api/worker/preferences/route");
    workerPrefs = await import("@/app/api/worker/prefs/route");

    notifications = await import("@/app/api/notifications/route");
    notificationsMarkRead = await import("@/app/api/notifications/mark-read/route");

    adminCompanyApproval = await import("@/app/api/admin/companies/[id]/approval/route");
    adminCompanyReject = await import("@/app/api/admin/companies/[id]/reject/route");
    authRegister = await import("@/app/api/auth/register/route");
  });

  it("blocks company routes for worker sessions", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    expect((await (companyJobs.GET as () => Promise<Response>)()).status).toBe(401);

    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    expect(
      (
        await (companyJobById.GET as (r: Request, p: unknown) => Promise<Response>)(
          new Request("https://example.test/api/company/jobs/j1"),
          withIdParams("j1"),
        )
      ).status,
    ).toBe(401);

    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    expect(
      (
        await (companyJobStatus.PATCH as (r: Request, p: unknown) => Promise<Response>)(
          new Request("https://example.test/api/company/jobs/j1/status", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status: "OPEN" }),
          }),
          withIdParams("j1"),
        )
      ).status,
    ).toBe(401);
  });

  it("blocks worker routes for company sessions", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.COMPANY } });
    expect(
      (
        await (workerJobs.GET as (r: Request) => Promise<Response>)(
          new Request("https://example.test/api/worker/jobs"),
        )
      ).status,
    ).toBe(401);

    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.COMPANY } });
    expect(
      (
        await (workerJobApply.POST as (r: Request, p: unknown) => Promise<Response>)(
          new Request("https://example.test/api/worker/jobs/j1/apply", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ note: "hi" }),
          }),
          withIdParams("j1"),
        )
      ).status,
    ).toBe(401);

    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.COMPANY } });
    expect(
      (
        await (workerApplications.GET as () => Promise<Response>)()
      ).status,
    ).toBe(401);
  });

  it("blocks admin-only routes for non-admin sessions", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.COMPANY } });
    expect(
      (
        await (adminCompanyApproval.PATCH as (r: Request, p: unknown) => Promise<Response>)(
          new Request("https://example.test/api/admin/companies/c1/approval", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ approved: true }),
          }),
          withIdParams("c1"),
        )
      ).status,
    ).toBe(401);

    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.COMPANY } });
    expect(
      (
        await (adminCompanyReject.POST as (r: Request, p: unknown) => Promise<Response>)(
          new Request("https://example.test/api/admin/companies/c1/reject", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ confirm: true }),
          }),
          withIdParams("c1"),
        )
      ).status,
    ).toBe(401);
  });

  it("requires auth for notifications routes", async () => {
    authMock.mockResolvedValueOnce(null);
    expect(
      (
        await (notifications.GET as (r: Request) => Promise<Response>)(
          new Request("https://example.test/api/notifications"),
        )
      ).status,
    ).toBe(401);

    authMock.mockResolvedValueOnce(null);
    expect(
      (
        await (notificationsMarkRead.POST as (r: Request) => Promise<Response>)(
          new Request("https://example.test/api/notifications/mark-read", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ids: ["ckl2u8f3p000001l0g3h4a1b2"] }),
          }),
        )
      ).status,
    ).toBe(401);
  });

  it("rejects admin registration via API", async () => {
    const res = await (authRegister.POST as (r: Request) => Promise<Response>)(
      new Request("https://example.test/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "evil@example.com",
          password: "password123",
          role: UserRole.ADMIN,
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("requires company role for exports endpoints", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    expect(
      (
        await (exportsHours.GET as (r: Request) => Promise<Response>)(
          new Request("https://example.test/api/company/exports/hours?range=7"),
        )
      ).status,
    ).toBe(401);

    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    expect(
      (
        await (exportsBonuses.GET as (r: Request) => Promise<Response>)(
          new Request("https://example.test/api/company/exports/bonuses?range=7"),
        )
      ).status,
    ).toBe(401);
  });

  it("enforces role-specific onboarding routes", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    expect(
      (
        await (companyOnboarding.POST as (r: Request) => Promise<Response>)(
          new Request("https://example.test/api/company/onboarding", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
          }),
        )
      ).status,
    ).toBe(403);

    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.COMPANY } });
    expect(
      (
        await (workerOnboarding.POST as (r: Request) => Promise<Response>)(
          new Request("https://example.test/api/worker/onboarding", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
          }),
        )
      ).status,
    ).toBe(403);
  });

  it("requires worker role for worker state/preferences routes", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.COMPANY } });
    expect(
      (
        await (workerReady.PATCH as (r: Request) => Promise<Response>)(
          new Request("https://example.test/api/worker/ready", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ isReady: true }),
          }),
        )
      ).status,
    ).toBe(401);

    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.COMPANY } });
    expect((await (workerPreferences.GET as () => Promise<Response>)()).status).toBe(401);

    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.COMPANY } });
    expect((await (workerPrefs.GET as () => Promise<Response>)()).status).toBe(401);
  });

  it("requires worker role for cancel endpoint", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.COMPANY } });
    expect(
      (
        await (workerApplicationCancel.POST as (r: Request, p: unknown) => Promise<Response>)(
          new Request("https://example.test/api/worker/applications/a1/cancel", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
          }),
          withIdParams("a1"),
        )
      ).status,
    ).toBe(401);
  });

  it("requires company role for application management endpoints", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    expect(
      (
        await (companyApplicationById.PATCH as (r: Request, p: unknown) => Promise<Response>)(
          new Request("https://example.test/api/company/applications/a1", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "cancel" }),
          }),
          withIdParams("a1"),
        )
      ).status,
    ).toBe(401);

    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    expect(
      (
        await (companyWorked.POST as (r: Request) => Promise<Response>)(
          new Request("https://example.test/api/company/applications/worked", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ applicationIds: ["ckl2u8f3p000001l0g3h4a1b2"] }),
          }),
        )
      ).status,
    ).toBe(401);
  });

  it("requires company role for job management endpoints", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    expect(
      (
        await (companyJobPolicy.POST as (r: Request, p: unknown) => Promise<Response>)(
          new Request("https://example.test/api/company/jobs/j1/policy", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ noticeWindow: "H24", cancellationCompensationPct: 0 }),
          }),
          withIdParams("j1"),
        )
      ).status,
    ).toBe(401);

    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    expect(
      (
        await (companyJobSlots.POST as (r: Request, p: unknown) => Promise<Response>)(
          new Request("https://example.test/api/company/jobs/j1/slots", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ neededWorkers: 5 }),
          }),
          withIdParams("j1"),
        )
      ).status,
    ).toBe(401);

  });
});
