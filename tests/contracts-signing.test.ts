import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "./setup";
import { ContractStatus, NotificationType } from "@/types";
import {
  companySignContract,
  getOrCreateContractForApplication,
  workerSignContract,
} from "@/server/services/contracts";
import { createNotificationForUser } from "@/server/services/notifications";

vi.mock("@/server/services/notifications", () => ({
  createNotificationForUser: vi.fn(),
}));

const baseCompany = {
  id: "company-1",
  userId: "user-company",
  companyName: "Warehouse X",
  contactName: "Boss",
  contactPhone: "0900",
  addressStreet: "A",
  addressCity: "B",
  addressZip: "C",
  region: "BA",
  warehouseType: "WAREHOUSE",
  onboardingComplete: true,
  isApproved: true,
};

const baseWorker = {
  id: "worker-1",
  userId: "user-worker",
  name: "Worker One",
  phone: "0900",
  city: "Bratislava",
  region: "BA",
  onboardingComplete: true,
};

describe("contracts signing (company-first)", () => {
  const signature = { version: 1 as const, strokes: [[[0.1, 0.1], [0.2, 0.2]]] };

  it("creates contract for application as PENDING_COMPANY and notifies company", async () => {
    prismaMock.contractDocument.findUnique.mockResolvedValueOnce(null as never);
    prismaMock.jobApplication.findUnique.mockResolvedValueOnce({
      id: "app-1",
      workerId: baseWorker.id,
      jobId: "job-1",
      worker: baseWorker,
      job: {
        id: "job-1",
        title: "Packing shift",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 28 * 60 * 60 * 1000),
        durationHours: 4,
        hourlyRate: 12,
        locationCity: "Bratislava",
        region: "BA",
        positionTypes: [],
        companyId: baseCompany.id,
        company: baseCompany,
      },
    } as never);
    prismaMock.contractTemplate.findUnique.mockResolvedValueOnce(null as never);
    prismaMock.contractDocument.create.mockResolvedValueOnce({
      id: "contract-1",
      status: ContractStatus.PENDING_COMPANY,
      applicationId: "app-1",
    } as never);

    const doc = await getOrCreateContractForApplication("app-1");

    expect(prismaMock.contractDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ContractStatus.PENDING_COMPANY,
        }),
      }),
    );
    expect(createNotificationForUser).toHaveBeenCalledWith(
      baseCompany.userId,
      NotificationType.COMPANY_CONTRACT_READY,
      expect.objectContaining({ contractId: "contract-1", jobId: "job-1" }),
    );
    expect(doc).toMatchObject({ id: "contract-1" });
  });

  it("blocks worker signing until company signs", async () => {
    prismaMock.workerProfile.findUnique.mockResolvedValueOnce(baseWorker as never);
    prismaMock.contractDocument.findFirst.mockResolvedValueOnce({
      id: "contract-1",
      workerId: baseWorker.id,
      companySignedAt: null,
      workerSignedAt: null,
      status: ContractStatus.PENDING_COMPANY,
      worker: baseWorker,
      job: {
        id: "job-1",
        title: "Packing shift",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        company: baseCompany,
      },
    } as never);

    await expect(
      workerSignContract("user-worker", "contract-1", "Worker One", signature, {
        ip: "127.0.0.1",
        userAgent: "test",
      }),
    ).rejects.toThrow("Contract must be signed by the company first");
  });

  it("company signs first, then worker completes and notifies both sides", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce(baseCompany as never);
    prismaMock.contractDocument.findFirst.mockResolvedValueOnce({
      id: "contract-1",
      companyId: baseCompany.id,
      workerId: baseWorker.id,
      jobId: "job-1",
      applicationId: "app-1",
      status: ContractStatus.PENDING_COMPANY,
      companySignedAt: null,
      workerSignedAt: null,
      worker: baseWorker,
      job: {
        id: "job-1",
        title: "Packing shift",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        company: baseCompany,
      },
    } as never);
    prismaMock.contractDocument.update.mockResolvedValueOnce({
      id: "contract-1",
      status: ContractStatus.SIGNED_BY_COMPANY,
      companySignedAt: new Date(),
    } as never);

    await companySignContract("user-company", "contract-1", "Boss", signature, {
      ip: "127.0.0.1",
      userAgent: "test",
    });

    expect(prismaMock.contractDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ContractStatus.SIGNED_BY_COMPANY,
          companySignatureName: "Boss",
        }),
      }),
    );
    expect(createNotificationForUser).not.toHaveBeenCalledWith(
      baseWorker.userId,
      NotificationType.WORKER_CONTRACT_READY,
      expect.anything(),
    );

    prismaMock.workerProfile.findUnique.mockResolvedValueOnce(baseWorker as never);
    prismaMock.contractDocument.findFirst.mockResolvedValueOnce({
      id: "contract-1",
      workerId: baseWorker.id,
      jobId: "job-1",
      applicationId: "app-1",
      status: ContractStatus.SIGNED_BY_COMPANY,
      companySignedAt: new Date(),
      workerSignedAt: null,
      worker: baseWorker,
      job: {
        id: "job-1",
        title: "Packing shift",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        company: baseCompany,
      },
    } as never);
    prismaMock.contractDocument.update.mockResolvedValueOnce({
      id: "contract-1",
      status: ContractStatus.COMPLETED,
      workerSignedAt: new Date(),
    } as never);

    await workerSignContract("user-worker", "contract-1", "Worker One", signature, {
      ip: "127.0.0.1",
      userAgent: "test",
    });

    expect(createNotificationForUser).toHaveBeenCalledWith(
      baseCompany.userId,
      NotificationType.COMPANY_CONTRACT_COMPLETED,
      expect.objectContaining({ contractId: "contract-1" }),
    );
  });
});
