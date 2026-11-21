import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

interface PageReport {
  page: string;
  status: "OK" | "ERROR" | "TIMEOUT";
  httpStatus?: number;
  consoleErrors: string[];
  layoutIssues: string[];
  screenshot?: string;
  loadTimeMs: number;
}

const PAGES_TO_TEST = [
  { name: "Landing (/)", url: "http://localhost:3000/" },
  { name: "Match (/match)", url: "http://localhost:3000/match" },
  { name: "Products (/products)", url: "http://localhost:3000/products" },
  { name: "Product Detail (/products/[slug])", url: "http://localhost:3000/products/1-salicylic-acid-body-wash" },
  { name: "Compare (/compare)", url: "http://localhost:3000/compare" },
  { name: "Help (/help)", url: "http://localhost:3000/help" },
];

async function runAudit() {
  const auditDir = path.resolve(
    "C:/Users/anshu/.gemini/antigravity/brain/dbe1a90c-0205-4c73-8d6c-ef6f407f1864/audit"
  );
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }

  const browser = await chromium.launch({ timeout: 20000 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const reports: PageReport[] = [];

  for (const item of PAGES_TO_TEST) {
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    const layoutIssues: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    const startTime = Date.now();
    let status: "OK" | "ERROR" | "TIMEOUT" = "OK";
    let httpStatus: number | undefined = undefined;
    let screenshotName: string | undefined = undefined;

    try {
      const response = await page.goto(item.url, {
        timeout: 15000,
        waitUntil: "domcontentloaded",
      });
      httpStatus = response?.status();

      // Dismiss banner if present
      await page.evaluate(() => {
        localStorage.setItem("bodywise_medical_notice_dismissed", "true");
      });

      // Quick layout inspection
      const hasHeader = await page.locator("header").isVisible().catch(() => false);
      const hasMain = await page.locator("main").isVisible().catch(() => false);
      const hasFooter = await page.locator("footer").isVisible().catch(() => false);

      if (!hasHeader) layoutIssues.push("Missing or hidden <header>");
      if (!hasMain) layoutIssues.push("Missing or hidden <main>");
      if (!hasFooter) layoutIssues.push("Missing or hidden <footer>");

      // Check for horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      if (scrollWidth > clientWidth + 2) {
        layoutIssues.push(`Horizontal overflow detected: scrollWidth ${scrollWidth} > clientWidth ${clientWidth}`);
      }

      // Check if body is scroll-locked
      const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
      if (bodyOverflow === "hidden") {
        layoutIssues.push("Body scroll lock is active while dialog is closed");
      }

      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      screenshotName = `${slug}.png`;
      await page.screenshot({
        path: path.join(auditDir, screenshotName),
        timeout: 10000,
      });

      if (httpStatus && httpStatus >= 400) {
        status = "ERROR";
      }
    } catch (e: any) {
      status = e.name === "TimeoutError" ? "TIMEOUT" : "ERROR";
      consoleErrors.push(e.message || String(e));
    } finally {
      const loadTimeMs = Date.now() - startTime;
      reports.push({
        page: item.name,
        status,
        httpStatus,
        consoleErrors,
        layoutIssues,
        screenshot: screenshotName,
        loadTimeMs,
      });
      await page.close();
    }
  }

  await browser.close();

  console.log(JSON.stringify(reports, null, 2));
}

runAudit().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
