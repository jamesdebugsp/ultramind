import { type Page, type Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("h1").first();
    this.logoutButton = page.getByText(/sair/i).first();
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async navigateTo(path: string) {
    await this.page.goto(`/dashboard/${path}`);
    await this.page.waitForLoadState("networkidle");
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL("**/login", { timeout: 10_000 });
  }
}
