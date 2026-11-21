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

  // Desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await desktopContext.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    sessionStorage.clear();
    sessionStorage.setItem("bodywise_user_raw_input", "body wash for my oily skin");
    sessionStorage.setItem("bodywise_parse_source", "llm");
  });

  // 1. Visit /match/confirm directly with hydrated session
  console.log("Navigating to http://localhost:3000/match/confirm ...");
  await page.goto("http://localhost:3000/match/confirm");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Screenshot 1: Match Confirm Page
  await page.screenshot({
    path: path.join(outputDir, "pipeline-confirm-bodywash-oilyskin.png"),
    fullPage: true,
  });
  console.log("Captured: pipeline-confirm-bodywash-oilyskin.png");

  // 2. Visit /match/results
  console.log("Navigating to http://localhost:3000/match/results ...");
  await page.goto("http://localhost:3000/match/results");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Screenshot 2: Match Results Page
  await page.screenshot({
    path: path.join(outputDir, "pipeline-results-bodywash-oilyskin.png"),
    fullPage: true,
  });
  console.log("Captured: pipeline-results-bodywash-oilyskin.png");

  await browser.close();
  console.log("Screenshots captured successfully.");
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
