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
