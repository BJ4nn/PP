import { test, expect } from "@playwright/test";
import { loginAsCompany } from "./helpers/auth";

test("company settings and beta pages render", async ({ page }) => {
  await loginAsCompany(page);
  await page.goto("/company/settings");
  await expect(page.getByRole("heading", { name: /Nastavenia/i })).toBeVisible();

  await page.locator('a[href="/company/billing"]').click();
  await expect(
    page.getByRole("heading", { name: /Free trial a platby/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Späť na nastavenia/i }).click();
  await page.locator('a[href="/company/team"]').click();
  await expect(page.getByRole("heading", { name: /Tím firmy/i })).toBeVisible();

  await page.getByRole("link", { name: /Späť na nastavenia/i }).click();
  await page.locator('a[href="/company/audit"]').click();
  await expect(page.getByRole("heading", { name: /Audit log/i })).toBeVisible();

  await page.getByRole("link", { name: /Späť na nastavenia/i }).click();
  await page.locator('a[href="/company/policy"]').click();
  await expect(
    page.getByRole("heading", { name: /Pravidlá storna/i }),
  ).toBeVisible();
});
