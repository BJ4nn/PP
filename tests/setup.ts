import { vi, beforeEach } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;

const createSection = (methods: string[]) =>
  methods.reduce<Record<string, MockFn>>((acc, method) => {
    acc[method] = vi.fn();
    return acc;
  }, {});

export const prismaMock = {
  workerProfile: createSection([
    "findFirst",
    "findUnique",
    "findMany",
    "upsert",
    "updateMany",
    "update",
    "count",
  ]),
  companyProfile: createSection(["findUnique", "findMany", "upsert", "count"]),
  job: createSection([
    "create",
    "update",
    "findFirst",
    "findMany",
    "count",
    "aggregate",
    "groupBy",
  ]),
  jobApplication: createSection([
    "create",
    "findFirst",
    "findUnique",
    "findMany",
    "update",
    "updateMany",
    "count",
    "aggregate",
  ]),
  invoice: createSection(["findFirst", "findMany", "findUniqueOrThrow", "create"]),
  invoiceLine: createSection(["createMany"]),
  contractTemplate: createSection(["findUnique", "upsert"]),
  contractDocument: createSection([
    "findUnique",
    "findFirst",
    "findMany",
    "create",
    "update",
  ]),
  companyNarrowCollaborationGroup: createSection([
    "findMany",
    "findFirst",
    "create",
    "delete",
  ]),
  companyNarrowCollaborationScheme: createSection([
    "findMany",
    "findFirst",
    "create",
    "delete",
  ]),
  workerCompanyRelation: createSection([
    "findUnique",
    "findMany",
    "upsert",
    "update",
  ]),
  notification: createSection(["create", "findMany", "updateMany"]),
  user: createSection(["findUnique", "create"]),
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
};

export const authMock = vi.fn();

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/config/auth", () => ({
  auth: authMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(prismaMock).forEach((section) => {
    if (typeof section === "function") {
      section.mockReset();
      return;
    }
    Object.values(section).forEach((mockFn) => mockFn.mockReset());
  });
  authMock.mockReset();
});
