import { type Page, type Locator, expect } from "@playwright/test";

export class ServicosPage {
  readonly page: Page;
  readonly newServiceButton: Locator;
  readonly nameInput: Locator;
  readonly durationInput: Locator;
  readonly priceInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newServiceButton = page.getByRole("button", { name: /novo serviço/i });
    this.nameInput = page.getByLabel("Nome do serviço");
    this.durationInput = page.getByLabel("Duração (min)");
    this.priceInput = page.getByLabel("Preço (R$)");
    this.submitButton = page.getByRole("button", { name: /adicionar|salvar/i });
  }

  async goto() {
    await this.page.goto("/dashboard/servicos");
    await this.page.waitForLoadState("networkidle");
  }

  async openNewServiceDialog() {
    await this.newServiceButton.click();
    await expect(this.nameInput).toBeVisible({ timeout: 5_000 });
  }

  async fillServiceForm(data: { name: string; duration: string; price: string }) {
    await this.nameInput.fill(data.name);
    await this.durationInput.fill(data.duration);
    await this.priceInput.fill(data.price);
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async expectServiceInList(name: string) {
    const serviceCard = this.page.getByText(name);
    await expect(serviceCard).toBeVisible({ timeout: 10_000 });
  }
}
