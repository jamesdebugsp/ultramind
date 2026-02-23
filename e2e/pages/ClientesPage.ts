import { type Page, type Locator, expect } from "@playwright/test";

export class ClientesPage {
  readonly page: Page;
  readonly newClientButton: Locator;
  readonly nameInput: Locator;
  readonly whatsappInput: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newClientButton = page.getByRole("button", { name: /novo cliente/i });
    this.nameInput = page.getByLabel("Nome completo");
    this.whatsappInput = page.getByLabel("WhatsApp");
    this.emailInput = page.getByLabel("E-mail");
    this.submitButton = page.getByRole("button", { name: /adicionar|salvar/i });
    this.cancelButton = page.getByRole("button", { name: /cancelar/i });
  }

  async goto() {
    await this.page.goto("/dashboard/clientes");
    await this.page.waitForLoadState("networkidle");
  }

  async openNewClientDialog() {
    await this.newClientButton.click();
    await expect(this.nameInput).toBeVisible({ timeout: 5_000 });
  }

  async fillClientForm(data: { name: string; whatsapp?: string; email?: string }) {
    await this.nameInput.fill(data.name);
    if (data.whatsapp) await this.whatsappInput.fill(data.whatsapp);
    if (data.email) await this.emailInput.fill(data.email);
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async expectClientInList(name: string) {
    const clientRow = this.page.getByText(name);
    await expect(clientRow).toBeVisible({ timeout: 10_000 });
  }

  async expectSuccessMessage() {
    // Wait for the dialog to close as success indicator
    await expect(this.nameInput).not.toBeVisible({ timeout: 10_000 });
  }
}
