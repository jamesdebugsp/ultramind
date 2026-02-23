import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";

test.describe("Página Inicial", () => {
  test("deve carregar com status 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("deve exibir o conteúdo principal", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.expectLoaded();
  });

  test("deve ter link para login", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.goToLogin();
    await expect(page).toHaveURL(/\/login/);
  });
});
