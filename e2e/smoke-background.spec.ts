import { test, expect } from "@playwright/test";

test.describe("SmokeBackground E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });
  });

  // 2.a The canvas exists on / and not on /match, /products, /help
  test("2.a Canvas exists on / and not on /match, /products, /help", async ({ page }) => {
    // 1. Check on landing (/)
    await page.goto("/");
    const canvas = page.locator("canvas[data-smoke-canvas]");
    await expect(canvas).toBeAttached({ timeout: 20000 });

    // 2. Check on /match
    await page.goto("/match");
    await expect(page.locator("canvas[data-smoke-canvas]")).toHaveCount(0);

    // 3. Check on /products
    await page.goto("/products");
    await expect(page.locator("canvas[data-smoke-canvas]")).toHaveCount(0);

    // 4. Check on /help
    await page.goto("/help");
    await expect(page.locator("canvas[data-smoke-canvas]")).toHaveCount(0);
  });

  // 2.b With reducedMotion emulated: no animation loop runs and a static smoke frame is visible
  test("2.b With reducedMotion emulated, animation loop does not run and canvas is static", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const canvas = page.locator("canvas[data-smoke-canvas]");
    await expect(canvas).toBeAttached();

    // In reduced motion, loop is bypassed, so data-frame-count is not incremented
    const initialFrameCount = await canvas.getAttribute("data-frame-count");
    await page.waitForTimeout(600);
    const afterFrameCount = await canvas.getAttribute("data-frame-count");

    expect(initialFrameCount).toBeNull();
    expect(afterFrameCount).toBeNull();
  });

  // 2.c With WebGL disabled: CSS fallback appears and there are no console errors
  test("2.c With WebGL disabled, CSS ambient fallback appears with zero console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    // Stub getContext to return null simulating unsupported WebGL
    await page.addInitScript(() => {
      // @ts-expect-error - Stubbing canvas getContext for WebGL
      HTMLCanvasElement.prototype.getContext = function (type: string) {
        if (type.includes("webgl")) return null;
        return null;
      };
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Ambient fallback blooms should appear
    const fallback = page.locator("[data-ambient-fallback]");
    await expect(fallback).toBeVisible();

    // Verify zero uncaught console errors
    expect(consoleErrors).toHaveLength(0);
  });

  // 2.d Off-screen hero pauses the loop
  test("2.d Off-screen hero pauses loop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const canvas = page.locator("canvas[data-smoke-canvas]");
    await expect(canvas).toBeAttached();

    // Wait for initial animation frames to register
    await page.waitForTimeout(800);
    const activeFrameCount = Number(await canvas.getAttribute("data-frame-count") || "0");
    expect(activeFrameCount).toBeGreaterThan(0);

    // Scroll down to the footer (hero off-screen)
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const scrolledFrameCount = Number(await canvas.getAttribute("data-frame-count") || "0");
    await page.waitForTimeout(500);
    const pausedFrameCount = Number(await canvas.getAttribute("data-frame-count") || "0");

    // Difference when off-screen should be minimal (0 to 1 frame max)
    expect(pausedFrameCount - scrolledFrameCount).toBeLessThanOrEqual(2);
  });

  // 2.e No horizontal overflow at 390px; hero text stays readable
  test("2.e Mobile 390px viewport has zero horizontal overflow and hero text is visible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Verify hero text elements remain visible and crisp
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#hero-query-input")).toBeVisible();
    await expect(page.getByRole("button", { name: "Find my match" })).toBeVisible();
  });
});
