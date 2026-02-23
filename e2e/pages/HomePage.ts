import { type Page, type Locator, expect } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly heroHeading: Locator;
  readonly loginLink: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroHeading = page.locator("h1").first();
    this.loginLink = page.getByRole("link", { name: /entrar/i }).first();
    this.signupLink = page.getByRole("link", { name: /criar conta|começar/i }).first();
  }

  async goto() {
    await this.page.goto("/");
  }

  async expectLoaded() {
    await expect(this.heroHeading).toBeVisible({ timeout: 10_000 });
  }

  async goToLogin() {
    await this.loginLink.click();
    await this.page.waitForURL("**/login");
  }
}
