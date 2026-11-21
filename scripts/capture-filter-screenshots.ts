import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function capture() {
  const outputDir = path.resolve(
    "C:/Users/anshu/.gemini/antigravity/brain/dbe1a90c-0205-4c73-8d6c-ef6f407f1864/screenshots"
  );
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch();

  // 1. Desktop Screenshots (1440 x 900)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.addInitScript(() => {
    localStorage.setItem("bodywise_medical_notice_dismissed", "true");
  });

  await desktopPage.goto("http://localhost:3000/products");
  await desktopPage.waitForLoadState("networkidle");

  // Screenshot 1: Desktop, Dialog Closed
  await desktopPage.screenshot({
    path: path.join(outputDir, "desktop-dialog-closed.png"),
    fullPage: false,
  });
  console.log("Captured: desktop-dialog-closed.png");

  // Open Filters Dialog
  await desktopPage.getByRole("button", { name: /^Filters/i }).click();
  await desktopPage.waitForSelector('[role="dialog"]');
  await desktopPage.waitForTimeout(300); // Wait for transition

  // Screenshot 2: Desktop, Dialog Open
  await desktopPage.screenshot({
    path: path.join(outputDir, "desktop-dialog-open.png"),
    fullPage: false,
  });
  console.log("Captured: desktop-dialog-open.png");

  // Apply a filter and capture active chips
  await desktopPage.getByRole("button", { name: /Face Wash/i }).click();
  await desktopPage.getByRole("button", { name: /Show \d+ products/i }).click();
  await desktopPage.waitForTimeout(300);
  await desktopPage.screenshot({
    path: path.join(outputDir, "desktop-active-chips.png"),
    fullPage: false,
  });
  console.log("Captured: desktop-active-chips.png");

  // 2. Mobile Screenshots (390 x 844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.addInitScript(() => {
    localStorage.setItem("bodywise_medical_notice_dismissed", "true");
  });

  await mobilePage.goto("http://localhost:3000/products");
  await mobilePage.waitForLoadState("networkidle");

  // Screenshot 3: Mobile, Dialog Closed
  await mobilePage.screenshot({
    path: path.join(outputDir, "mobile-dialog-closed.png"),
    fullPage: false,
  });
  console.log("Captured: mobile-dialog-closed.png");

  // Open Filters Dialog on Mobile
  await mobilePage.getByRole("button", { name: /^Filters/i }).click();
  await mobilePage.waitForSelector('[role="dialog"]');
  await mobilePage.waitForTimeout(300); // Wait for transition

  // Screenshot 4: Mobile, Dialog Open (Bottom Sheet)
  await mobilePage.screenshot({
    path: path.join(outputDir, "mobile-dialog-open.png"),
    fullPage: false,
  });
  console.log("Captured: mobile-dialog-open.png");

  await browser.close();
  console.log("All screenshots captured successfully.");
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
