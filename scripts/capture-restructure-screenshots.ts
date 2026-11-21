import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

async function capture() {
  const outputDir = path.join(process.cwd(), "docs", "screenshots");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch();

  // Desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.addInitScript(() => {
    localStorage.setItem("bodywise_medical_notice_dismissed", "true");
  });

  // 1. Landing Top
  await desktopPage.goto("http://localhost:3000");
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({
    path: path.join(outputDir, "landing-top.png"),
    clip: { x: 0, y: 0, width: 1280, height: 750 },
  });
  console.log("✓ Captured landing-top.png");

  // 2. Header Desktop
  const header = desktopPage.locator("header");
  await header.screenshot({
    path: path.join(outputDir, "header-desktop.png"),
  });
  console.log("✓ Captured header-desktop.png");

  // 3. Landing Bottom
  await desktopPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({
    path: path.join(outputDir, "landing-bottom.png"),
  });
  console.log("✓ Captured landing-bottom.png");

  // 4. /how-it-works
  await desktopPage.goto("http://localhost:3000/how-it-works");
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({
    path: path.join(outputDir, "how-it-works.png"),
    fullPage: true,
  });
  console.log("✓ Captured how-it-works.png");

  // 5. /safeguards
  await desktopPage.goto("http://localhost:3000/safeguards");
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({
    path: path.join(outputDir, "safeguards.png"),
    fullPage: true,
  });
  console.log("✓ Captured safeguards.png");

  await desktopContext.close();

  // Mobile context (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.addInitScript(() => {
    localStorage.setItem("bodywise_medical_notice_dismissed", "true");
  });

  // 6. Header Mobile
  await mobilePage.goto("http://localhost:3000");
  await mobilePage.waitForTimeout(500);
  const mobileHeader = mobilePage.locator("header");
  await mobileHeader.screenshot({
    path: path.join(outputDir, "header-mobile.png"),
  });
  console.log("✓ Captured header-mobile.png");

  await mobileContext.close();
  await browser.close();
  console.log("\nAll screenshots captured successfully.");
}

capture();
