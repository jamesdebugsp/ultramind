import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ServicosPage } from "../pages/ServicosPage";

const TEST_EMAIL = process.env.TEST_EMAIL || "teste@seudominio.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "senha123456";

test.describe("CRUD de Serviços", () => {
  const uniqueName = `Serviço Teste ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await loginPage.expectRedirectToDashboard();
  });

  test("deve criar um novo serviço", async ({ page }) => {
    const servicosPage = new ServicosPage(page);
    await servicosPage.goto();
    await servicosPage.openNewServiceDialog();
    await servicosPage.fillServiceForm({
      name: uniqueName,
      duration: "45",
      price: "120",
    });
    await servicosPage.submitForm();
    await servicosPage.expectServiceInList(uniqueName);
  });

  test("deve exigir campos obrigatórios", async ({ page }) => {
    const servicosPage = new ServicosPage(page);
    await servicosPage.goto();
    await servicosPage.openNewServiceDialog();

    // Submit without filling
    await servicosPage.submitForm();

    const isInvalid = await servicosPage.nameInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });
});
