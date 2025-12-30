# Company Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add comprehensive company coverage using Playwright E2E plus targeted Vitest service/API tests.

**Architecture:** Hybrid test pyramid. E2E validates company UI flows end-to-end; Vitest covers domain logic and edge cases with Prisma mocks. Shared helpers minimize brittle selectors.

**Tech Stack:** Next.js, Playwright, Vitest, Prisma, TypeScript.

---

### Task 1: Add Playwright harness + smoke test

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`

**Step 1: Write the failing test**

```ts
// tests/e2e/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("home renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Spojte sez[oó]nny dopyt/i })).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/smoke.spec.ts`
Expected: FAIL with missing config/dependency or missing browsers.

**Step 3: Add Playwright dependency + script**

```json
// package.json (devDependencies)
{
  "@playwright/test": "^1.49.0"
}
```

```json
// package.json (scripts)
{
  "test:e2e": "playwright test"
}
```

Run: `npm install`

**Step 4: Add Playwright config**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: process.env.E2E_WEB_SERVER ?? "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

**Step 5: Run test to verify it passes**

Run: `npx playwright test tests/e2e/smoke.spec.ts`
Expected: PASS (server running + DB seeded).

**Step 6: Commit**

```bash
git add package.json package-lock.json playwright.config.ts tests/e2e/smoke.spec.ts
git commit -m "test: add Playwright harness"
```

---

### Task 2: Add E2E auth + data helpers

**Files:**
- Create: `tests/e2e/helpers/auth.ts`
- Create: `tests/e2e/helpers/data.ts`

**Step 1: Write the failing test**

```ts
// tests/e2e/helpers/auth.ts
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const DEFAULT_PASSWORD =
  process.env.E2E_PASSWORD ?? process.env.DEV_SEED_PASSWORD ?? "Heslo123";

export const companyEmail = process.env.E2E_COMPANY_EMAIL ?? "company@demo.local";
export const workerEmail = process.env.E2E_WORKER_EMAIL ?? "worker@demo.local";

export async function login(page: Page, email: string, password = DEFAULT_PASSWORD) {
  await page.goto("/auth/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Heslo").fill(password);
  await page.getByRole("button", { name: "Prihlásiť sa" }).click();
}

export async function loginAsCompany(page: Page) {
  await login(page, companyEmail);
  await expect(page).toHaveURL(/\/company\/dashboard/);
}

export async function loginAsWorker(page: Page) {
  await login(page, workerEmail);
  await expect(page).toHaveURL(/\/worker\/dashboard/);
}
```

```ts
// tests/e2e/helpers/data.ts
export function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function toInputDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function futureDate(hoursFromNow: number) {
  return toInputDateTime(new Date(Date.now() + hoursFromNow * 60 * 60 * 1000));
}

export function pastDate(hoursAgo: number) {
  return toInputDateTime(new Date(Date.now() - hoursAgo * 60 * 60 * 1000));
}
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/smoke.spec.ts`
Expected: PASS (helpers unused yet). No failures expected.

**Step 3: Commit**

```bash
git add tests/e2e/helpers/auth.ts tests/e2e/helpers/data.ts
git commit -m "test: add e2e auth/data helpers"
```

---

### Task 3: Company auth + settings E2E

**Files:**
- Create: `tests/e2e/company-auth.spec.ts`
- Create: `tests/e2e/company-settings.spec.ts`

**Step 1: Write the failing tests**

```ts
// tests/e2e/company-auth.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsCompany, loginAsWorker } from "./helpers/auth";

test("company can access dashboard", async ({ page }) => {
  await loginAsCompany(page);
  await expect(page.getByRole("heading", { name: /Panel firmy|Vitajte/i })).toBeVisible();
});

test("worker is redirected away from company dashboard", async ({ page }) => {
  await loginAsWorker(page);
  await page.goto("/company/dashboard");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: /Som pracovník/i })).toBeVisible();
});
```

```ts
// tests/e2e/company-settings.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsCompany } from "./helpers/auth";

test("company settings and beta pages render", async ({ page }) => {
  await loginAsCompany(page);
  await page.goto("/company/settings");
  await expect(page.getByRole("heading", { name: /Nastavenia/i })).toBeVisible();

  await page.getByRole("link", { name: /Free trial a platby/i }).click();
  await expect(page.getByRole("heading", { name: /Free trial a platby/i })).toBeVisible();

  await page.getByRole("link", { name: /Späť na nastavenia/i }).click();
  await page.getByRole("link", { name: /Tím firmy/i }).click();
  await expect(page.getByRole("heading", { name: /Tím firmy/i })).toBeVisible();

  await page.getByRole("link", { name: /Späť na nastavenia/i }).click();
  await page.getByRole("link", { name: /Audit log/i }).click();
  await expect(page.getByRole("heading", { name: /Audit log/i })).toBeVisible();

  await page.getByRole("link", { name: /Späť na nastavenia/i }).click();
  await page.getByRole("link", { name: /Pravidlá storna/i }).click();
  await expect(page.getByRole("heading", { name: /Pravidlá storna/i })).toBeVisible();
});
```

**Step 2: Run tests to verify they fail (auth helpers + routing)**

Run: `npx playwright test tests/e2e/company-auth.spec.ts tests/e2e/company-settings.spec.ts`
Expected: FAIL if redirects/labels mismatch.

**Step 3: Fix selectors and make tests pass**

Update selectors if needed (match headings/links).

**Step 4: Run tests to verify they pass**

Run: `npx playwright test tests/e2e/company-auth.spec.ts tests/e2e/company-settings.spec.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/e2e/company-auth.spec.ts tests/e2e/company-settings.spec.ts
git commit -m "test: add company auth and settings e2e"
```

---

### Task 4: Company jobs lifecycle E2E

**Files:**
- Create: `tests/e2e/company-jobs.spec.ts`

**Step 1: Write the failing test**

```ts
// tests/e2e/company-jobs.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsCompany, loginAsWorker } from "./helpers/auth";
import { futureDate, pastDate, uniqueId } from "./helpers/data";

function jobFormFillers(page: any, title: string, startsAt: string) {
  return Promise.all([
    page.getByLabel("Názov zmeny").fill(title),
    page.getByLabel("Popis").fill("Testovacia zmena pre E2E"),
    page.getByLabel("Mesto").fill("Bratislava"),
    page.getByLabel("Presná adresa").fill("Testovacia 12"),
    page.getByLabel("Región").selectOption("BA"),
    page.getByLabel("Typ prevádzky").selectOption("WAREHOUSE"),
    page.getByLabel("Začiatok zmeny").fill(startsAt),
    page.getByLabel("Trvanie (hodiny)").fill("8"),
    page.getByLabel("Hodinová sadzba (€)").fill("9"),
    page.getByLabel("Počet pracovníkov").fill("1"),
  ]);
}

test("company can create and manage a job", async ({ page }) => {
  const title = uniqueId("E2E Zmena");
  await loginAsCompany(page);
  await page.goto("/company/jobs/new");
  await jobFormFillers(page, title, futureDate(48));

  await page.getByLabel(/urgentnú zmenu/i).check();
  await page.getByLabel(/Urgent bonus/i).fill("20");
  await page.getByLabel(/Potvrdiť do/i).fill(futureDate(24));

  await page.getByLabel(/Aktivovať balík/i).check();
  await page.getByLabel(/Min\. hodín/i).fill("16");
  await page.getByLabel(/Min\. dní/i).fill("2");
  await page.getByLabel(/Bonus/i).fill("15");
  await page.getByLabel(/Sadzba balíka/i).fill("10");

  await page.getByRole("button", { name: /Zverejniť zmenu/i }).click();
  await expect(page).toHaveURL(/\/company\/jobs/);
  await page.getByRole("link", { name: new RegExp(title) }).click();

  await page.getByLabel(/Garancia storna/i).selectOption("H12");
  await page.getByLabel(/Kompenzácia/i).fill("10");
  await page.getByRole("button", { name: "Uložiť" }).click();
  await expect(page.getByText(/Uložené/i)).toBeVisible();

  await page.getByRole("button", { name: "+1" }).click();
  await page.getByRole("button", { name: "Uložiť" }).click();
  await expect(page.getByText(/Sloty uložené/i)).toBeVisible();

  await page.getByRole("button", { name: /Spustiť 2\. vlnu/i }).click();
  await expect(page.getByText(/Vlna aktualizovaná/i)).toBeVisible();

  await page.getByRole("button", { name: /Uzavrieť zmenu/i }).click();
  await page.reload();
  await expect(page.getByText(/Uzavretá/i)).toBeVisible();
});


test("company can process applications and worked confirmations", async ({ page, browser }) => {
  const title = uniqueId("E2E Past Shift");
  await loginAsCompany(page);
  await page.goto("/company/jobs/new");
  await jobFormFillers(page, title, pastDate(6));
  await page.getByRole("button", { name: /Zverejniť zmenu/i }).click();
  await expect(page).toHaveURL(/\/company\/jobs/);

  const workerContext = await browser.newContext();
  const workerPage = await workerContext.newPage();
  await loginAsWorker(workerPage);
  await workerPage.goto("/worker/jobs");
  await workerPage.getByRole("link", { name: new RegExp(title) }).click();
  await workerPage.getByRole("button", { name: /Prihlásiť sa/i }).click();
  await expect(workerPage.getByText(/Prihláška odoslaná/i)).toBeVisible();
  await workerContext.close();

  await page.goto("/company/jobs");
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await page.getByRole("button", { name: /^Potvrdiť$/ }).click();
  await page.reload();
  await expect(page.getByText(/Potvrdené/i)).toBeVisible();

  await page.goto("/company/dashboard");
  await page.getByRole("button", { name: /Potvrdiť odpracované/i }).click();
  await page.reload();
  await expect(page.getByText(/Nemáte nič na potvrdenie/i)).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/company-jobs.spec.ts`
Expected: FAIL until selectors and flow match.

**Step 3: Fix selectors/flows to make test pass**

Adjust selectors to match actual UI copy as needed.

**Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/company-jobs.spec.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/e2e/company-jobs.spec.ts
git commit -m "test: add company jobs lifecycle e2e"
```

---

### Task 5: Company contracts, invoices, exports, workers, narrow collaboration E2E

**Files:**
- Create: `tests/e2e/company-business.spec.ts`

**Step 1: Write the failing test**

```ts
// tests/e2e/company-business.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsCompany, loginAsWorker } from "./helpers/auth";
import { futureDate, uniqueId } from "./helpers/data";

async function drawSignature(page: any) {
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Signature canvas not found");
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 10, box.y + box.height - 10);
  await page.mouse.up();
}

test("company can handle contracts, exports, invoices, and workers", async ({ page, browser }) => {
  const title = uniqueId("E2E Contract Shift");
  await loginAsCompany(page);
  await page.goto("/company/jobs/new");

  await page.getByLabel("Názov zmeny").fill(title);
  await page.getByLabel("Popis").fill("Test zmluvy a exportov");
  await page.getByLabel("Mesto").fill("Bratislava");
  await page.getByLabel("Presná adresa").fill("Exportova 4");
  await page.getByLabel("Región").selectOption("BA");
  await page.getByLabel("Typ prevádzky").selectOption("WAREHOUSE");
  await page.getByLabel("Začiatok zmeny").fill(futureDate(24));
  await page.getByLabel("Trvanie (hodiny)").fill("4");
  await page.getByLabel("Hodinová sadzba (€)").fill("9");
  await page.getByLabel("Počet pracovníkov").fill("1");

  await page.getByRole("button", { name: /Zverejniť zmenu/i }).click();
  await expect(page).toHaveURL(/\/company\/jobs/);

  const workerContext = await browser.newContext();
  const workerPage = await workerContext.newPage();
  await loginAsWorker(workerPage);
  await workerPage.goto("/worker/jobs");
  await workerPage.getByRole("link", { name: new RegExp(title) }).click();
  await workerPage.getByRole("button", { name: /Prihlásiť sa/i }).click();
  await expect(workerPage.getByText(/Prihláška odoslaná/i)).toBeVisible();
  await workerContext.close();

  await page.getByRole("link", { name: new RegExp(title) }).click();
  await page.getByRole("button", { name: /^Potvrdiť$/ }).click();
  await page.reload();

  await page.goto("/company/contracts");
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await page.getByLabel("Meno a priezvisko").fill("Company Signer");
  await page.getByLabel(/Potvrdzujem, že som si dokument/i).check();
  await drawSignature(page);
  await page.getByRole("button", { name: /Podpísať/i }).click();
  await expect(page.getByText(/Podpísané/i)).toBeVisible();

  await page.goto("/company/jobs");
  await page.getByRole("button", { name: /Exporty/i }).first().click();

  await page.goto("/company/invoices");
  await expect(page.getByRole("heading", { name: /Faktúry/i })).toBeVisible();

  await page.goto("/company/workers");
  await expect(page.getByRole("heading", { name: /Pracovníci/i })).toBeVisible();

  await page.goto("/company/jobs");
  await page.getByText(/Uzšia spolupráca/i).scrollIntoViewIfNeeded();
  await expect(page.getByText(/Skupina pre plánovanie/i)).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/company-business.spec.ts`
Expected: FAIL until selectors/flow match (signature + contract).

**Step 3: Fix selectors/flow to make test pass**

Adjust selectors and confirm contract creation timing (may require refresh).

**Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/company-business.spec.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/e2e/company-business.spec.ts
git commit -m "test: add company business e2e"
```

---

### Task 6: Extend prismaMock for company collaboration models

**Files:**
- Modify: `tests/setup.ts`

**Step 1: Write failing tests (next tasks)**

Run next unit tests to observe missing prisma sections.

**Step 2: Implement prisma mock sections**

```ts
// tests/setup.ts (add sections)
export const prismaMock = {
  // ...existing
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
    "findMany",
    "findUnique",
    "upsert",
  ]),
  // ...existing
};
```

**Step 3: Run tests to verify it passes**

Run: `npm run test -- tests/narrow-collaboration-service.test.ts`
Expected: FAIL until service tests are added, but prismaMock should exist.

**Step 4: Commit**

```bash
git add tests/setup.ts
git commit -m "test: extend prisma mock for company collaboration"
```

---

### Task 7: Add narrow collaboration service tests

**Files:**
- Create: `tests/narrow-collaboration-service.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, it, expect, vi } from "vitest";
import { applyNarrowCollaborationSchedule, getCompanyNarrowCollaborationSettings } from "@/server/services/narrow-collaboration";
import { prismaMock } from "./setup";
import { DayOfWeek, ShiftType } from "@/types";

vi.mock("@/server/services/worker-companies", () => ({
  requireNarrowCollaboration: vi.fn().mockResolvedValue({ id: "worker-1" }),
}));
vi.mock("@/server/services/jobs", () => ({
  listOpenJobsForWorker: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/server/services/applications", () => ({
  applyToJob: vi.fn().mockResolvedValue({ id: "app-1" }),
}));

const companyProfile = {
  id: "company-1",
  userId: "user-company",
  onboardingComplete: true,
};

describe("narrow collaboration service", () => {
  it("maps groups and schemes for company settings", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue(companyProfile as never);
    prismaMock.companyNarrowCollaborationGroup.findMany.mockResolvedValue([
      { id: "g1", name: "A", maxAdvanceWeeks: 2, _count: { workerRelations: 3 } },
    ] as never);
    prismaMock.companyNarrowCollaborationScheme.findMany.mockResolvedValue([
      { id: "s1", name: "Weekdays", daysOfWeek: [DayOfWeek.MON, DayOfWeek.TUE] },
    ] as never);

    const result = await getCompanyNarrowCollaborationSettings("user-company");
    expect(result.groups[0]?.workerCount).toBe(3);
    expect(result.schemes[0]?.daysOfWeek).toContain(DayOfWeek.MON);
  });

  it("applies schedule only for allowed narrow collaboration", async () => {
    prismaMock.workerCompanyRelation.findUnique.mockResolvedValue({
      isNarrowCollaboration: true,
      narrowGroupId: "g1",
    } as never);
    prismaMock.companyNarrowCollaborationGroup.findFirst.mockResolvedValue({
      id: "g1",
      maxAdvanceWeeks: 2,
    } as never);
    prismaMock.companyNarrowCollaborationScheme.findFirst.mockResolvedValue({
      id: "s1",
      daysOfWeek: [DayOfWeek.MON],
    } as never);
    prismaMock.companyProfile.findFirst.mockResolvedValue({
      advancedModeEnabled: false,
      narrowCollaborationCutoffHour: 12,
    } as never);

    const result = await applyNarrowCollaborationSchedule("user-worker", "company-1", {
      schemeId: "s1",
      shiftType: ShiftType.MORNING,
      weeks: 1,
    });

    expect(result).toHaveProperty("appliedCount");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/narrow-collaboration-service.test.ts`
Expected: FAIL until mocks align.

**Step 3: Adjust mocks until pass**

Update mocked listOpenJobsForWorker to include at least one job for apply flow if needed.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/narrow-collaboration-service.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/narrow-collaboration-service.test.ts
git commit -m "test: add narrow collaboration service coverage"
```

---

### Task 8: Add company workers/relations service tests

**Files:**
- Create: `tests/company-workers-service.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { getCompanyWorkersData, updateCompanyWorkerRelation } from "@/server/services/company-workers";
import { prismaMock } from "./setup";

const company = { id: "company-1", userId: "user-company", onboardingComplete: true };

describe("company workers service", () => {
  it("summarizes worked and verified workers", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue(company as never);
    prismaMock.jobApplication.findMany.mockResolvedValueOnce([
      { workerId: "w1", job: { endsAt: new Date("2024-01-01") }, worker: { id: "w1", name: "A", city: "BA", reliabilityScore: 2 } },
    ] as never);
    prismaMock.jobApplication.findMany.mockResolvedValueOnce([
      { workerId: "w1", job: { endsAt: new Date("2024-01-01") }, worker: { id: "w1", name: "A", city: "BA", reliabilityScore: 2 } },
    ] as never);

    const data = await getCompanyWorkersData("user-company");
    expect(data.workersWorked.length).toBe(1);
    expect(data.verifiedWorkers.length).toBe(1);
  });

  it("rejects relation update for workers without confirmed work", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue(company as never);
    prismaMock.jobApplication.findFirst.mockResolvedValue(null as never);

    await expect(
      updateCompanyWorkerRelation("user-company", "worker-1", { isPriority: true }),
    ).rejects.toThrow("Pracovník ešte nemá potvrdenú odpracovanú zmenu.");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/company-workers-service.test.ts`
Expected: FAIL until mocks align.

**Step 3: Adjust mocks and pass**

Ensure prismaMock returns data as required.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/company-workers-service.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/company-workers-service.test.ts
git commit -m "test: add company workers service coverage"
```

---

### Task 9: Add company worker groups service tests

**Files:**
- Create: `tests/company-worker-groups.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { getCompanyWorkerGroups } from "@/server/services/company-worker-groups";
import { prismaMock } from "./setup";

const company = { id: "company-1", userId: "user-company", onboardingComplete: true };

describe("company worker groups", () => {
  it("builds priority and narrow group lists", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue(company as never);
    prismaMock.workerCompanyRelation.findMany.mockResolvedValue([
      { workerId: "w1", isPriority: true, isNarrowCollaboration: false, worker: { id: "w1", name: "A", city: "BA", reliabilityScore: 3 } },
      { workerId: "w2", isPriority: false, isNarrowCollaboration: true, worker: { id: "w2", name: "B", city: "BA", reliabilityScore: 2 } },
    ] as never);
    prismaMock.jobApplication.findMany.mockResolvedValue([
      { workerId: "w1", job: { endsAt: new Date("2024-02-01") } },
      { workerId: "w2", job: { endsAt: new Date("2024-02-02") } },
    ] as never);

    const result = await getCompanyWorkerGroups("user-company");
    expect(result.priorityWorkers.length).toBe(1);
    expect(result.narrowWorkers.length).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/company-worker-groups.test.ts`
Expected: FAIL until mocks align.

**Step 3: Adjust mocks and pass**

Ensure prismaMock returns correct shapes (distinct, job.endsAt).

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/company-worker-groups.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/company-worker-groups.test.ts
git commit -m "test: add company worker groups coverage"
```

---

### Task 10: Run full test suites

**Files:**
- None

**Step 1: Run unit/service tests**

Run: `npm run test`
Expected: PASS.

**Step 2: Run E2E**

Run: `npx playwright test`
Expected: PASS (ensure DB running + seeded).

**Step 3: Commit (if any updates)**

```bash
git add .
git commit -m "test: stabilize company test suite"
```

---

## Notes
- Use seeded demo accounts (`company@demo.local`, `worker@demo.local`) with `DEV_SEED_PASSWORD` or `Heslo123`.
- E2E requires DB + seeded data; `npm run dev` bootstraps DB and seed if needed.
