import { test, expect } from "@playwright/test";
import { loginAsCompany, loginAsWorker } from "./helpers/auth";

test("company can access dashboard", async ({ page }) => {
  await loginAsCompany(page);
  await expect(
    page.getByRole("heading", { name: /Panel firmy|Vitajte/i }),
  ).toBeVisible();
});

test("worker is redirected away from company dashboard", async ({ page }) => {
  await loginAsWorker(page);
  await page.goto("/company/dashboard");
  await expect(page).not.toHaveURL(/\/company\//);
  await expect(page.getByText(/Som pripravený na zmeny/i)).toBeVisible();
});
