import { test, expect } from "@playwright/test";
import { loginAsCompany, loginAsWorker } from "./helpers/auth";
import { futureDate, uniqueId } from "./helpers/data";

async function fillJobForm(page: any, title: string, startsAt: string) {
  await page.getByLabel("Názov zmeny").fill(title);
  await page.getByLabel("Popis").fill("Testovacia zmena pre E2E");
  await page.getByLabel("Mesto").fill("Bratislava");
  await page.getByLabel("Presná adresa").fill("Testovacia 12");
  await page.getByLabel("Región").selectOption("BA");
  await page.getByLabel("Typ prevádzky").selectOption("WAREHOUSE");
  await page.getByLabel("Začiatok zmeny").fill(startsAt);
  await page.getByLabel("Trvanie (hodiny)").fill("8");
  await page.getByLabel("Hodinová sadzba (€)").fill("9");
  await page.getByLabel("Počet pracovníkov").fill("1");
  await page.getByLabel("Rozoslanie ponuky").selectOption("PUBLIC");
}

test("company can create and manage a job", async ({ page }) => {
  const title = uniqueId("E2E Zmena");
  await loginAsCompany(page);
  await page.goto("/company/jobs/new");
  await fillJobForm(page, title, futureDate(48));

  await page.getByLabel(/urgentnú zmenu/i).check();
  await page.getByLabel(/Urgent bonus/i).fill("20");
  await page.getByLabel(/Potvrdiť do/i).fill(futureDate(24));

  await page.getByLabel(/Aktivovať balík/i).check();
  await page.getByLabel(/Min\. hodín/i).fill("16");
  await page.getByLabel(/Min\. dní/i).fill("2");
  await page.getByLabel("Bonus (€)", { exact: true }).fill("15");
  await page.getByLabel(/Sadzba balíka/i).fill("10");

  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/company/jobs") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Zverejniť zmenu/i }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.ok()).toBeTruthy();
  const createdJob = await createResponse.json();

  await page.goto(`/company/jobs/${createdJob.id}`);
  await expect(page.getByRole("heading", { name: new RegExp(title) })).toBeVisible();

  await page.getByLabel(/Garancia storna/i).selectOption("H12");
  await page.getByLabel(/Kompenzácia/i).fill("10");
  const policyWidget = page.locator("section").filter({ hasText: "Notice politika" });
  await policyWidget.getByRole("button", { name: "Uložiť" }).first().click();
  await page.waitForLoadState("networkidle");

  const quickActions = page.locator("aside").filter({ hasText: "Quick actions" });
  await quickActions.getByRole("button", { name: "+1" }).click();
  await quickActions.getByRole("button", { name: "Uložiť" }).click();
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: /Uzavrieť zmenu/i }).click();
  await page.reload();
  const statusRow = page.locator("dt", { hasText: "Stav" }).locator("..");
  await expect(statusRow.getByText(/Uzavretá/i)).toBeVisible();
});

test("company can mark a job as filled", async ({ page, browser }) => {
  const title = uniqueId("E2E Apply");
  await loginAsCompany(page);
  await page.goto("/company/jobs/new");
  await fillJobForm(page, title, futureDate(36));
  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/company/jobs") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Zverejniť zmenu/i }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.ok()).toBeTruthy();
  const createdJob = await createResponse.json();
  const jobId = createdJob.id as string;

  const workerContext = await browser.newContext();
  const workerPage = await workerContext.newPage();
  await loginAsWorker(workerPage);
  await workerPage.goto("/worker/jobs");
  const jobLink = workerPage.getByRole("link", { name: new RegExp(title) });
  if (await jobLink.count()) {
    await jobLink.first().click();
    await expect(
      workerPage.getByRole("heading", { name: new RegExp(title) }),
    ).toBeVisible();
    await workerPage.getByRole("button", { name: /Prihlásiť sa/i }).click();
    await expect(
      workerPage.getByText("Prihláška odoslaná", { exact: true }),
    ).toBeVisible();
  }
  await workerContext.close();

  await page.goto(`/company/jobs/${jobId}`);
  await expect(
    page.getByRole("heading", { name: new RegExp(title) }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Prihlášky/i })).toBeVisible();
  await page.getByRole("button", { name: "Označiť ako obsadenú" }).click();
  await page.reload();
  await expect(page.getByText(/Obsadená/i)).toBeVisible();
});
