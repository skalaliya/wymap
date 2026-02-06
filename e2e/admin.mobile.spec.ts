import { expect, test } from "@playwright/test";

const assertNoHorizontalOverflow = async (page: import("@playwright/test").Page) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(4);
};

test.describe("admin mobile smoke", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("login, navigate to devices and employees, and avoid layout overflow", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin sign in" })).toBeVisible();

    await page.getByLabel("Email").first().fill("admin@wymap.local");
    await page.getByLabel("Password").first().fill("ChangeMe123!");
    await page.getByRole("button", { name: "Sign in" }).first().click();

    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.getByTestId("admin-menu-button").click();
    await page.getByTestId("nav-devices").filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/admin\/devices/);
    await expect(page.getByRole("heading", { name: "Devices" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Register" })).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.getByTestId("admin-menu-button").click();
    await page.getByTestId("nav-employees").filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/admin\/employees/);
    await expect(page.getByRole("heading", { name: "Employees" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add employee" })).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
