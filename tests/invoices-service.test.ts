import { describe, it, expect } from "vitest";
import { prismaMock } from "./setup";
import {
  createInvoiceForWorker,
  getEligibleInvoiceItemsForWorker,
} from "@/server/services/invoices/worker";

describe("invoices service", () => {
  it("lists eligible worked applications grouped by company", async () => {
    prismaMock.workerProfile.findUnique.mockResolvedValue({
      id: "w1",
      userId: "u1",
      onboardingComplete: true,
    } as never);
    prismaMock.jobApplication.findMany.mockResolvedValue([
      {
        id: "a1",
        workerId: "w1",
        status: "CONFIRMED",
        workedConfirmedAt: new Date(),
        estimatedEarningsEur: 80,
        jobId: "j1",
        job: {
          title: "Ranná zmena",
          startsAt: new Date("2025-12-20T08:00:00.000Z"),
          endsAt: new Date("2025-12-20T16:00:00.000Z"),
          durationHours: 8,
          hourlyRate: "10.00",
          company: { id: "c1", companyName: "Sklad A" },
        },
      },
      {
        id: "a2",
        workerId: "w1",
        status: "CONFIRMED",
        workedConfirmedAt: new Date(),
        estimatedEarningsEur: 90,
        jobId: "j2",
        job: {
          title: "Poobedná zmena",
          startsAt: new Date("2025-12-21T12:00:00.000Z"),
          endsAt: new Date("2025-12-21T20:00:00.000Z"),
          durationHours: 8,
          hourlyRate: "11.00",
          company: { id: "c1", companyName: "Sklad A" },
        },
      },
    ] as never);

    const result = await getEligibleInvoiceItemsForWorker("u1");

    expect(prismaMock.jobApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workerId: "w1",
          status: "CONFIRMED",
          workedConfirmedAt: { not: null },
          invoiceLine: null,
        }),
      }),
    );
    expect(result).toEqual([
      {
        companyId: "c1",
        companyName: "Sklad A",
        items: expect.any(Array),
        totalEur: 170,
      },
    ]);
  });

  it("creates invoice for one company only", async () => {
    prismaMock.workerProfile.findUnique.mockResolvedValue({
      id: "w1",
      userId: "u1",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findMany.mockResolvedValue([
      {
        id: "a1",
        jobId: "j1",
        workerId: "w1",
        status: "CONFIRMED",
        workedConfirmedAt: new Date(),
        estimatedEarningsEur: 80,
        job: {
          title: "Ranná zmena",
          startsAt: new Date("2025-12-20T08:00:00.000Z"),
          endsAt: new Date("2025-12-20T16:00:00.000Z"),
          durationHours: 8,
          hourlyRate: "10.00",
          company: { id: "c1" },
        },
      },
    ] as never);

    prismaMock.$transaction.mockImplementation(async (fn) => {
      const callback = fn as unknown as (tx: typeof prismaMock) => Promise<unknown>;
      return callback(prismaMock);
    });
    prismaMock.invoice.findFirst.mockResolvedValue(null as never);
    prismaMock.invoice.create.mockResolvedValue({ id: "inv1" } as never);
    prismaMock.invoiceLine.createMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.invoice.findUniqueOrThrow.mockResolvedValue({
      id: "inv1",
      invoiceNumber: "INV-20251224-ABCD",
      company: { companyName: "Sklad A" },
      lines: [],
    } as never);

    const invoice = await createInvoiceForWorker("u1", { applicationIds: ["a1"] });

    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workerId: "w1",
          companyId: "c1",
          status: "DRAFT",
          currency: "EUR",
          totalEur: 80,
        }),
      }),
    );
    expect(invoice.id).toBe("inv1");
  });
});
