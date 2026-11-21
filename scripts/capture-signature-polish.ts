import { chromium } from "@playwright/test";
import * as path from "path";

async function main() {
  const browser = await chromium.launch();
  const dir = path.resolve(__dirname, "../docs/screenshots");

  // 1. Desktop - Motion ON
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.mouse.move(350, 240); // Move near hero to trigger custom cursor
    await page.waitForTimeout(600);

    // Hero with rotating word & typewriter input
    await page.screenshot({
      path: path.join(dir, "polish-hero-desktop-motion-on.png"),
      clip: { x: 0, y: 0, width: 1280, height: 850 },
    });

    // Stats strip & Category Bento Grid
    const statsSection = page.locator("#catalogue-stats-strip");
    await statsSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000); // Wait for count-up to finish

    await page.screenshot({
      path: path.join(dir, "polish-stats-bento-desktop.png"),
      clip: { x: 0, y: 550, width: 1280, height: 900 },
    });

    // Footer with Reduce motion toggle
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(dir, "polish-footer-motion-toggle.png"),
    });

    await page.close();
  }

  // 2. Desktop - Reduced Motion
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.mouse.move(300, 300);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(dir, "polish-hero-desktop-motion-reduced.png"),
      clip: { x: 0, y: 0, width: 1280, height: 850 },
    });

    await page.close();
  }

  // 3. Mobile (390px)
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    // Hero
    await page.screenshot({
      path: path.join(dir, "polish-hero-mobile-390.png"),
      clip: { x: 0, y: 0, width: 390, height: 780 },
    });

    // Stats & Category bento on mobile
    const statsSection = page.locator("#catalogue-stats-strip");
    await statsSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(dir, "polish-stats-bento-mobile-390.png"),
      clip: { x: 0, y: 520, width: 390, height: 850 },
    });

    await page.close();
  }

  await browser.close();
  console.log("Screenshots saved to docs/screenshots/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
