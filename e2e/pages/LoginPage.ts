import { type Page, type Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("E-mail");
    this.passwordInput = page.getByLabel("Senha");
    this.submitButton = page.getByRole("button", { name: /entrar/i });
    this.errorToast = page.locator('[data-sonner-toast][data-type="error"], [role="status"]').first();
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectRedirectToDashboard() {
    await this.page.waitForURL("**/dashboard", { timeout: 15_000 });
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async expectErrorMessage(text: string) {
    // Toast messages appear in the page
    const toast = this.page.getByText(text);
    await expect(toast).toBeVisible({ timeout: 10_000 });
  }
}
