import { test, expect } from "@playwright/test";
import { loginAsCompany } from "./helpers/auth";
import { uniqueId } from "./helpers/data";

test("company can review contracts and invoices", async ({ page }) => {
  await loginAsCompany(page);
  await page.goto("/company/contracts");
  await expect(page.getByRole("heading", { name: "Zmluvy (Beta)" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Upraviť šablónu/i }),
  ).toBeVisible();

  const emptyContracts = page.getByText(
    /Zatiaľ nemáte žiadne vygenerované zmluvy/i,
  );
  const contractCards = page.locator('a[href^="/company/contracts/"]', {
    hasText: "Otvoriť",
  });
  if (await emptyContracts.isVisible()) {
    await expect(emptyContracts).toBeVisible();
  } else {
    await expect(contractCards.first()).toBeVisible();
    await contractCards.first().click();
    await expect(
      page.getByRole("heading", { name: /Zmluva/i }),
    ).toBeVisible();
    await page.goBack();
  }

  await page.goto("/company/invoices");
  await expect(
    page.getByRole("heading", { name: /Prijaté faktúry/i }),
  ).toBeVisible();

  const emptyInvoices = page.getByText("Zatiaľ nemáte žiadne prijaté faktúry.");
  const invoiceCards = page.locator('a[href^="/company/invoices/"]');
  if (await emptyInvoices.isVisible()) {
    await expect(emptyInvoices).toBeVisible();
  } else {
    await expect(invoiceCards.first()).toBeVisible();
    await invoiceCards.first().click();
    await expect(
      page.getByRole("heading", { name: /Faktúra/i }),
    ).toBeVisible();
    await page.goBack();
  }
});

test("company can manage narrow collaboration settings", async ({ page }) => {
  const schemeName = uniqueId("Schéma");
  const groupName = uniqueId("Skupina");

  await loginAsCompany(page);
  await page.goto("/company/jobs");
  await expect(page.getByRole("heading", { name: "Ponuky zmien" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Export hodiny (CSV)" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Export bonusy (CSV)" }),
  ).toBeVisible();

  const cutoffCard = page
    .getByText("Cutoff čas pre užšiu spoluprácu")
    .locator("..")
    .locator("..");
  const cutoffSelect = cutoffCard.locator("select");
  if (await cutoffSelect.isDisabled()) {
    await expect(
      cutoffCard.getByText(/Advanced mode nie je aktívny/i),
    ).toBeVisible();
  } else {
    await cutoffSelect.selectOption("10");
    await cutoffCard.getByRole("button", { name: /Uložiť/i }).click();
    await expect(
      cutoffCard.getByText(/Cutoff cas ulozeny/i),
    ).toBeVisible();
  }

  const schemeSection = page.getByText("Schémy zmien").locator("..").locator("..");
  await schemeSection.getByPlaceholder("5 dní (Po–Pi)").fill(schemeName);
  await schemeSection.getByLabel("Pondelok").check();
  await schemeSection.getByLabel("Streda").check();
  await schemeSection.getByRole("button", { name: "Pridať" }).click();
  await expect(schemeSection.getByText("Schéma uložená.")).toBeVisible();
  const schemeRow = schemeSection.getByText(schemeName).locator("..").locator("..");
  await schemeRow.getByRole("button", { name: "Odstrániť" }).click();
  await expect(schemeSection.getByText("Schéma odstránená.")).toBeVisible();

  const groupSection = page
    .getByText("Skupiny užšej spolupráce")
    .locator("..")
    .locator("..");
  await groupSection.getByPlaceholder("Např. Stabilný tím").fill(groupName);
  await groupSection.locator("select").selectOption("2");
  await groupSection.getByRole("button", { name: "Pridať" }).click();
  await expect(groupSection.getByText("Skupina uložená.")).toBeVisible();
  const groupRow = groupSection.getByText(groupName).locator("..").locator("..");
  await groupRow.getByRole("button", { name: "Odstrániť" }).click();
  await expect(groupSection.getByText("Skupina odstránená.")).toBeVisible();
});

test("company can browse workers and relation settings", async ({ page }) => {
  await loginAsCompany(page);
  await page.goto("/company/workers");
  await expect(
    page.getByRole("heading", { name: "Pracovníci", exact: true }),
  ).toBeVisible();

  const workerCards = page.locator('a[href^="/company/workers/"]');
  if (!(await workerCards.count())) {
    await expect(
      page.getByText("Zatiaľ tu nie sú žiadni pracovníci."),
    ).toBeVisible();
    return;
  }

  await workerCards.first().click();
  const relationPanel = page
    .getByText("Užšia spolupráca")
    .locator("..")
    .locator("..");
  await expect(relationPanel).toBeVisible();

  const saveButton = relationPanel.getByRole("button", { name: "Uložiť" });
  if (await saveButton.isDisabled()) {
    await expect(
      relationPanel.getByText(/Pracovník ešte nemá potvrdenú odpracovanú zmenu/i),
    ).toBeVisible();
  } else {
    await saveButton.click();
    await expect(relationPanel.getByText("Nastavenia uložené.")).toBeVisible();
  }
});
