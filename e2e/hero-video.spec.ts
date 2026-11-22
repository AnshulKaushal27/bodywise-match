import { test, expect } from "@playwright/test";

test.describe("Hero Cinemagraph Video", () => {
  test("renders video with continuous loop, zero audio, no controls, and non-interactive overlay", async ({ page }) => {
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    const heroSection = page.locator("#hero-section");
    await expect(heroSection).toBeVisible();

    const video = heroSection.locator("video");
    await expect(video).toBeVisible();

    // Verify critical cinemagraph attributes
    await expect(video).toHaveAttribute("loop", "");
    await expect(video).toHaveAttribute("playsinline", "");
    await expect(video).toHaveAttribute("tabindex", "-1");
    await expect(video).toHaveAttribute("aria-hidden", "true");

    // Check that controls attribute is NOT present
    const hasControls = await video.evaluate((el: HTMLVideoElement) => el.controls);
    expect(hasControls).toBe(false);

    // Check muted state
    const isMuted = await video.evaluate((el: HTMLVideoElement) => el.muted);
    expect(isMuted).toBe(true);

    // Check pointer-events is none so user cannot interact or right-click to open video controls
    const pointerEvents = await video.evaluate((el: HTMLVideoElement) => window.getComputedStyle(el).pointerEvents);
    expect(pointerEvents).toBe("none");

    // Capture screenshot of hero section
    await heroSection.screenshot({ path: "docs/screenshots/hero-video-desktop.png" });
  });

  test("renders correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    const heroSection = page.locator("#hero-section");
    await expect(heroSection).toBeVisible();

    const video = heroSection.locator("video");
    await expect(video).toBeVisible();

    await heroSection.screenshot({ path: "docs/screenshots/hero-video-mobile.png" });
  });
});
