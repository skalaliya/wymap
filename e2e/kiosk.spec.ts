import { expect, test } from "@playwright/test";

test.describe("kiosk flows", () => {
  test("ready screen loads", async ({ page }) => {
    await page.goto("/kiosk/ready");
    await expect(page.getByRole("button", { name: "Start punch" })).toBeVisible();
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
    );

    const badgeInput = page.getByLabel("Badge ID");
    await badgeInput.fill("BADGE-1001");
    await badgeInput.press("Enter");

    await expect(page.getByTestId("status-message")).toContainText("Avery Stone");
    await expect(page.getByTestId("status-message")).toContainText("IN");

    await page.waitForTimeout(1500);
    expect(handshakeRequests.length).toBeLessThanOrEqual(2);
  });

  test("offline queue stores punches and syncs when online", async ({ page, context }) => {
    await page.goto("/kiosk");
    await expect(page.getByTestId("handshake-status")).toHaveText(
      "Handshake OK",
    );

    await context.setOffline(true);
    await expect(page.getByTestId("online-status")).toHaveText("Offline");

    const badgeInput = page.getByLabel("Badge ID");
    await badgeInput.fill("BADGE-1002");
    await badgeInput.press("Enter");

    await expect(page.getByTestId("status-message")).toContainText("Saved offline");
    await expect(page.getByTestId("queue-count")).toContainText("1 event");

    await context.setOffline(false);
    await expect(page.getByTestId("online-status")).toHaveText("Online");
    await page.getByTestId("sync-now").click();
    await expect(page.getByTestId("queue-count")).toContainText("0 events");
  });
});

test.describe("kiosk handshake validation", () => {
  test("rejects invalid device", async ({ request }) => {
    const response = await request.post("/api/kiosk/handshake", {
      data: { deviceId: "invalid-device", siteId: "site_hq" },
    });

    expect(response.status()).toBe(403);
    await expect(response).toHaveJSON({
      ok: false,
      error: "device_site_mismatch",
    });
  });
});
