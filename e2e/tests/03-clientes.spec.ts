import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ClientesPage } from "../pages/ClientesPage";

const TEST_EMAIL = process.env.TEST_EMAIL || "teste@seudominio.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "senha123456";

test.describe("CRUD de Clientes", () => {
  const uniqueName = `Cliente Teste ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await loginPage.expectRedirectToDashboard();
  });

  test("deve criar um novo cliente", async ({ page }) => {
    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();
    await clientesPage.openNewClientDialog();
    await clientesPage.fillClientForm({
      name: uniqueName,
      whatsapp: "(11) 99999-0000",
      email: "teste@email.com",
    });
    await clientesPage.submitForm();
    await clientesPage.expectSuccessMessage();
    await clientesPage.expectClientInList(uniqueName);
  });

  test("deve exigir nome obrigatório", async ({ page }) => {
    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();
    await clientesPage.openNewClientDialog();

    // Try to submit empty form
    await clientesPage.submitForm();

    // HTML5 validation should prevent submission
    const isInvalid = await clientesPage.nameInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });
});
