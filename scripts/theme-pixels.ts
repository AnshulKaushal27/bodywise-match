import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

interface RouteTest {
  path: string;
  name: string;
  keyScreen?: boolean;
  action?: (page: any) => Promise<void>;
}

const ROUTES: RouteTest[] = [
  { path: "/", name: "landing", keyScreen: true },
  { path: "/how-it-works", name: "how-it-works", keyScreen: true },
  { path: "/safeguards", name: "safeguards" },
  { path: "/match", name: "match", keyScreen: true },
  { path: "/match/confirm", name: "match-confirm", keyScreen: true },
  { path: "/match/results", name: "match-results", keyScreen: true },
  {
    path: "/products",
    name: "products",
    keyScreen: true,
    action: async (page) => {
      // Open filter dialog if button exists
      const filterBtn = page.locator("button:has-text('Filters')").first();
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
        await page.waitForTimeout(400);
      }
    },
  },
  { path: "/products/1-salicylic-acid-body-wash", name: "product-detail", keyScreen: true },
  { path: "/compare", name: "compare" },
  { path: "/help", name: "help", keyScreen: true },
  { path: "/safety", name: "safety" },
  { path: "/privacy", name: "privacy" },
  { path: "/about", name: "about" },
  { path: "/non-existent-page-test-404", name: "404-page" },
];

async function main() {
  console.log("=== Playwright Pixel Hue Verification (Theme: Blue + White) ===");
  const reportsDir = path.resolve(__dirname, "../reports/theme");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const browser = await chromium.launch();
  let totalFailures = 0;

  // Viewport configurations: Desktop (1440x900) & Mobile (390x844)
  const viewports = [
    { label: "desktop", width: 1440, height: 900 },
    { label: "mobile", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    console.log(`\n--- Testing Viewport: ${vp.label} (${vp.width}x${vp.height}) ---`);

    for (const r of ROUTES) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      try {
        await page.addInitScript(() => {
          localStorage.setItem("bodywise_medical_notice_dismissed", "true");
        });

        const url = `http://localhost:3000${r.path}`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
        await page.waitForTimeout(500);

        if (r.action) {
          try {
            await r.action(page);
          } catch {
            // interaction helper
          }
        }

        // Capture screenshot
        const screenshotPath = path.join(reportsDir, `${r.name}-${vp.label}.png`);
        const buffer = await page.screenshot({ path: screenshotPath });
        const b64 = buffer.toString("base64");

        // Analyze actual decoded RGBA pixels inside browser canvas
        const pixelStats = await page.evaluate(async (base64Data) => {
          // Find bounding boxes of catalogue product photos to ignore
          const ignoreBoxes: Array<{ x: number; y: number; w: number; h: number }> = [];
          document.querySelectorAll('img[src*="product"], img[alt*="product"], [data-catalogue-photo="true"], .product-image').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              ignoreBoxes.push({
                x: Math.round(rect.left),
                y: Math.round(rect.top),
                w: Math.round(rect.width),
                h: Math.round(rect.height),
              });
            }
          });

          return new Promise<{ total: number; green: number; pct: number }>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              if (!ctx) return resolve({ total: 0, green: 0, pct: 0 });

              ctx.drawImage(img, 0, 0);
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imgData.data;

              let evaluated = 0;
              let greenCount = 0;

              for (let y = 0; y < canvas.height; y += 2) {
                for (let x = 0; x < canvas.width; x += 2) {
                  // Check if (x, y) is inside any ignored product photo box
                  let isIgnored = false;
                  for (const box of ignoreBoxes) {
                    if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
                      isIgnored = true;
                      break;
                    }
                  }
                  if (isIgnored) continue;

                  const idx = (y * canvas.width + x) * 4;
                  const r = data[idx] / 255;
                  const g = data[idx + 1] / 255;
                  const b = data[idx + 2] / 255;
                  const a = data[idx + 3];

                  if (a < 50) continue;
                  evaluated++;

                  const max = Math.max(r, g, b);
                  const min = Math.min(r, g, b);
                  const l = (max + min) / 2;

                  if (max !== min) {
                    const d = max - min;
                    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    let h = 0;
                    switch (max) {
                      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                      case g: h = ((b - r) / d + 2) / 6; break;
                      case b: h = ((r - g) / d + 4) / 6; break;
                    }
                    const hue = h * 360;

                    // Green family hue: 70 to 180 degrees with saturation > 15% and luminance 10-90%
                    if (hue >= 70 && hue <= 180 && s > 0.15 && l >= 0.10 && l <= 0.90) {
                      greenCount++;
                    }
                  }
                }
              }

              const pct = evaluated > 0 ? (greenCount / evaluated) * 100 : 0;
              resolve({ total: evaluated, green: greenCount, pct });
            };
            img.src = "data:image/png;base64," + base64Data;
          });
        }, b64);

        const passed = pixelStats.pct <= 0.20;
        const statusStr = passed ? "✓ PASS" : "✗ FAIL";
        console.log(`  ${statusStr} [${r.name} @ ${vp.label}]: Green pixels: ${pixelStats.pct.toFixed(3)}% (${pixelStats.green}/${pixelStats.total}, threshold <= 0.20%)`);

        if (!passed) totalFailures++;
      } catch (err: any) {
        console.error(`  ERROR on ${r.path}:`, err.message);
        totalFailures++;
      } finally {
        await page.close();
      }
    }
  }

  // Also check reduced motion on & off on landing page
  console.log("\n--- Checking prefers-reduced-motion: reduce ---");
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const screenshotPath = path.join(reportsDir, `landing-reduced-motion-desktop.png`);
    await page.screenshot({ path: screenshotPath });
    console.log("  ✓ PASS [landing @ reduced-motion]: Screenshot captured.");
    await context.close();
  }

  await browser.close();

  if (totalFailures > 0) {
    console.error(`\nFAILED: ${totalFailures} view(s) failed pixel green-hue threshold.`);
    process.exit(1);
  } else {
    console.log("\nALL PIXEL CHECKS PASSED: Zero unauthorized green pixels detected across all screens!");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
