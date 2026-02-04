import { expect, test } from "@playwright/test";

test.describe("kiosk flows", () => {
  test("ready screen loads", async ({ page }) => {
    await page.goto("/kiosk/ready");
    await expect(page.getByRole("button", { name: "Start punch", exact: true })).toBeVisible();
  });

  test("handshake is stable and punch flow succeeds", async ({ page }) => {
    const handshakeRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/kiosk/handshake")) {
        handshakeRequests.push(request.url());
      }
    });

    await page.goto("/kiosk");
    await expect(page.getByTestId("handshake-status")).toHaveText(
      "Handshake OK",
      { timeout: 15000 },
    );
    await expect(page.getByTestId("offline-ready")).toHaveText("Ready", { timeout: 10000 });

    const badgeInput = page.getByLabel("Badge ID");
    await badgeInput.fill("BADGE-1001");
    await badgeInput.press("Enter");

    await expect(page.getByTestId("status-message")).toContainText("Avery Stone", { timeout: 10000 });
    await expect(page.getByTestId("status-message")).toContainText("IN");

    await page.waitForTimeout(1500);
    expect(handshakeRequests.length).toBeLessThanOrEqual(2);
  });

  test("offline queue stores punches and syncs when online", async ({ page, context }) => {
    // 1. Load page and wait for deterministic readiness
    await page.goto("/kiosk");
    await expect(page.getByTestId("handshake-status")).toHaveText(
      "Handshake OK",
      { timeout: 15000 },
    );
    await expect(page.getByTestId("offline-ready")).toHaveText("Ready", { timeout: 10000 });

    // 2. Go offline
    await context.setOffline(true);
    await expect(page.getByTestId("online-status")).toHaveText("Offline");

    // 3. Submit punch (should work immediately due to in-memory cache)
    const badgeInput = page.getByLabel("Badge ID");
    await badgeInput.fill("BADGE-1002");
    await badgeInput.press("Enter");

    // 4. Verify offline save
    await expect(page.getByTestId("status-message")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("status-message")).toContainText("Saved offline");
    await expect(page.getByTestId("queue-count")).toContainText("1 event");

    // 5. Go online and sync
    await context.setOffline(false);
    await expect(page.getByTestId("online-status")).toHaveText("Online");
    await page.getByTestId("sync-now").click();
    await expect(page.getByTestId("queue-count")).toContainText("0 events", { timeout: 10000 });
  });
});

test.describe("kiosk handshake validation", () => {
  test("rejects invalid device", async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/kiosk/handshake`, {
      data: { deviceId: "invalid-device", siteId: "site_hq" },
    });

    expect(response.status()).toBe(403);
    const json = await response.json();
    expect(json).toMatchObject({
      ok: false,
      error: "device_site_mismatch",
    });
  });
});
