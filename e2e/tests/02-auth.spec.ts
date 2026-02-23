import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";

// ⚠️ CONFIGURE SUAS CREDENCIAIS AQUI OU VIA VARIÁVEIS DE AMBIENTE
const TEST_EMAIL = process.env.TEST_EMAIL || "teste@seudominio.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "senha123456";

test.describe("Autenticação", () => {
  test("deve fazer login com credenciais válidas e redirecionar ao dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await loginPage.expectRedirectToDashboard();
    await dashboardPage.expectLoaded();
  });

  test("deve exibir erro com senha inválida", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, "senhaerrada123");
    await loginPage.expectErrorMessage("Email ou senha incorretos");
  });

  test("deve exibir erro com campos vazios", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    // Click submit without filling fields – HTML5 validation should prevent submission
    await loginPage.submitButton.click();

    // The email input should show validation (required)
    const isInvalid = await loginPage.emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test("deve fazer logout com sucesso", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await loginPage.expectRedirectToDashboard();
    await dashboardPage.expectLoaded();
    await dashboardPage.logout();
    await expect(page).toHaveURL(/\/login/);
  });
});
