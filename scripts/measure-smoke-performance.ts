import { chromium } from "@playwright/test";
import * as path from "path";

async function main() {
  const browser = await chromium.launch();
  const dir = path.resolve(__dirname, "../docs/screenshots");

  console.log("Starting performance & screenshot capture...");

  // 1. Desktop - Smoke Motion ON (measure frame times & capture)
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000); // Wait for fade in

    // Measure frame time over 60 frames on desktop
    const desktopPerf = await page.evaluate(`
      new Promise((resolve) => {
        const frameTimes = [];
        let last = performance.now();
        let frames = 0;

        const tick = (now) => {
          const delta = now - last;
          last = now;
          if (frames > 0) frameTimes.push(delta);
          frames++;

          if (frames < 60) {
            requestAnimationFrame(tick);
          } else {
            const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
            resolve({ avgFrameTime: Math.round(avg * 10) / 10, fps: Math.round(1000 / avg) });
          }
        };
        requestAnimationFrame(tick);
      })
    `) as { avgFrameTime: number; fps: number };

    console.log(`Desktop measured: ${desktopPerf.avgFrameTime} ms/frame (~${desktopPerf.fps} fps)`);

    // Screenshot Desktop Smoke ON
    await page.screenshot({
      path: path.join(dir, "smoke-hero-desktop-motion-on.png"),
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });

    await page.close();
  }

  // 2. Desktop - Reduced Motion Static
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
    await page.waitForTimeout(600);

    await page.screenshot({
      path: path.join(dir, "smoke-hero-desktop-motion-reduced.png"),
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });

    await page.close();
  }

  // 3. Desktop - WebGL Disabled Fallback
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
      // Stub getContext to return null simulating unsupported WebGL
      // @ts-expect-error - canvas stub
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    await page.screenshot({
      path: path.join(dir, "smoke-hero-webgl-off-fallback.png"),
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });

    await page.close();
  }

  // 4. Mobile (390px) - Measure frame times & capture
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const mobilePerf = await page.evaluate(`
      new Promise((resolve) => {
        const frameTimes = [];
        let last = performance.now();
        let frames = 0;

        const tick = (now) => {
          const delta = now - last;
          last = now;
          if (frames > 0) frameTimes.push(delta);
          frames++;

          if (frames < 60) {
            requestAnimationFrame(tick);
          } else {
            const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
            resolve({ avgFrameTime: Math.round(avg * 10) / 10, fps: Math.round(1000 / avg) });
          }
        };
        requestAnimationFrame(tick);
      })
    `) as { avgFrameTime: number; fps: number };

    console.log(`Mobile measured: ${mobilePerf.avgFrameTime} ms/frame (~${mobilePerf.fps} fps)`);

    await page.screenshot({
      path: path.join(dir, "smoke-hero-mobile-390.png"),
      clip: { x: 0, y: 0, width: 390, height: 750 },
    });

    await page.close();
  }

  await browser.close();
  console.log("Performance measurement and screenshots completed successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
