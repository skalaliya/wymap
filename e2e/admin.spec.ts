import { expect, test } from "@playwright/test";

test.describe("admin flows", () => {
  const loginAsAdmin = async (page: import("@playwright/test").Page) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Admin sign in" })).toBeVisible();

    await page.getByLabel("Email").first().fill("admin@wymap.local");
    await page.getByLabel("Password").first().fill("ChangeMe123!");

    await page.getByRole("button", { name: "Sign in" }).first().click();
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20000 });
  };

  test("login and dashboard load", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("core admin pages render", async ({ page }) => {
    await loginAsAdmin(page);

    const routes = [
      "/admin/employees",
      "/admin/sites",
      "/admin/devices",
      "/admin/timesheets",
      "/admin/corrections",
      "/admin/reports",
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByRole("heading").first()).toBeVisible();
    }
  });
});
