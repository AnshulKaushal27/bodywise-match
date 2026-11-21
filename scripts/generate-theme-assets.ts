import { chromium } from "@playwright/test";
import * as path from "path";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const publicDir = path.resolve(__dirname, "../apps/web/public");

  // 1. Generate icon-192.png
  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 192px;
            height: 192px;
            background: #F5F9FF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .circle {
            width: 160px;
            height: 160px;
            border-radius: 50%;
            background: #1D4ED8;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-weight: 800;
            font-size: 72px;
            letter-spacing: -2px;
            box-shadow: 0 8px 24px rgba(11, 36, 71, 0.15);
          }
        </style>
      </head>
      <body>
        <div class="circle">BM</div>
      </body>
    </html>
  `);
  await page.screenshot({ path: path.join(publicDir, "icon-192.png") });

  // 2. Generate icon-512.png
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 512px;
            height: 512px;
            background: #F5F9FF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .circle {
            width: 440px;
            height: 440px;
            border-radius: 50%;
            background: #1D4ED8;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-weight: 800;
            font-size: 200px;
            letter-spacing: -6px;
            box-shadow: 0 20px 60px rgba(11, 36, 71, 0.18);
          }
        </style>
      </head>
      <body>
        <div class="circle">BM</div>
      </body>
    </html>
  `);
  await page.screenshot({ path: path.join(publicDir, "icon-512.png") });

  // 3. Generate og-image.png (1200 x 630)
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 60px 80px;
            width: 1200px;
            height: 630px;
            box-sizing: border-box;
            background: #F5F9FF;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            position: relative;
            overflow: hidden;
          }
          .decor-1 {
            position: absolute;
            top: -100px;
            right: -100px;
            width: 500px;
            height: 500px;
            border-radius: 50%;
            background: #E3EEFC;
            filter: blur(80px);
            opacity: 0.8;
            z-index: 0;
          }
          .decor-2 {
            position: absolute;
            bottom: -80px;
            left: 200px;
            width: 450px;
            height: 450px;
            border-radius: 50%;
            background: #BBD9FF;
            filter: blur(90px);
            opacity: 0.45;
            z-index: 0;
          }
          .content {
            position: relative;
            z-index: 1;
          }
          .header {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .logo {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #1D4ED8;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-weight: 800;
            font-size: 20px;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 700;
            color: #0B2447;
          }
          .badge {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 4px 12px;
            border-radius: 999px;
            background: #BBD9FF;
            color: #0B2447;
          }
          .headline {
            font-size: 58px;
            font-weight: 800;
            line-height: 1.15;
            color: #0B2447;
            max-width: 900px;
            margin-top: 50px;
            letter-spacing: -0.02em;
          }
          .headline span {
            background: #BBD9FF;
            padding: 2px 14px;
            border-radius: 8px;
          }
          .subhead {
            font-size: 24px;
            color: #5B6B82;
            line-height: 1.5;
            max-width: 820px;
            margin-top: 24px;
          }
          .footer {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid #D5E0EF;
            padding-top: 24px;
            color: #5B6B82;
            font-size: 16px;
            font-weight: 600;
          }
          .badges-row {
            display: flex;
            gap: 16px;
          }
          .badge-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 16px;
            background: #FFFFFF;
            border: 1px solid #D5E0EF;
            border-radius: 999px;
            font-size: 14px;
            color: #1B2A41;
          }
        </style>
      </head>
      <body>
        <div class="decor-1"></div>
        <div class="decor-2"></div>
        <div class="content">
          <div class="header">
            <div class="logo">BM</div>
            <div class="brand-title">Bodywise Match</div>
            <div class="badge">Official Product Finder</div>
          </div>
          <div class="headline">
            Find personal care products that fit <span>your stated goal</span>.
          </div>
          <div class="subhead">
            Tell us what you're looking for. We'll ask a few quick questions and explain which options may fit.
          </div>
        </div>
        <div class="footer">
          <div class="badges-row">
            <div class="badge-item">&#x2713; Deterministic Matching Rules</div>
            <div class="badge-item">&#x2713; Verified Label Provenance</div>
            <div class="badge-item">&#x2713; 0% Sponsored Bias</div>
          </div>
          <div>Zero Mandatory Signup</div>
        </div>
      </body>
    </html>
  `);
  await page.screenshot({ path: path.join(publicDir, "og-image.png") });

  await browser.close();
  console.log("THEME_ASSETS_GENERATED_SUCCESSFULLY");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
