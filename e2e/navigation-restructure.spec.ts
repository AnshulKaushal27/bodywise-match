import { test, expect } from "@playwright/test";

test.describe("Landing Page Navigation Restructure & Header Actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });
  });

  // 2.a The header has no FAQ link on any page; the landing FAQ section still exists.
  test("2.a Header has no FAQ link on any page; landing FAQ section still exists", async ({ page }) => {
    // Check on landing page (/)
    await page.goto("/");
    const headerFaqLanding = page.locator("header").getByRole("link", { name: "FAQ" });
    await expect(headerFaqLanding).toHaveCount(0);

    // Verify FAQ section on landing page still exists
    const faqHeading = page.locator("#faq");
    await expect(faqHeading).toBeVisible();
    await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
    await expect(page.getByText("Is this medical advice?")).toBeVisible();

    // Check on /help
    await page.goto("/help");
    const headerFaqHelp = page.locator("header").getByRole("link", { name: "FAQ" });
    await expect(headerFaqHelp).toHaveCount(0);
  });

  // 2.b Help and Find my match have identical bounding-box height (and width within 2px of the same min-width rule) on desktop and mobile.
  test("2.b Help and Find my match have identical bounding-box height and equal width on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const helpLink = page.locator("header nav").getByRole("link", { name: "Help" });
    const matchLink = page.locator("header nav").getByRole("link", { name: "Find my match" });

    await expect(helpLink).toBeVisible();
    await expect(matchLink).toBeVisible();

    const helpBox = await helpLink.boundingBox();
    const matchBox = await matchLink.boundingBox();

    expect(helpBox).not.toBeNull();
    expect(matchBox).not.toBeNull();

    if (helpBox && matchBox) {
      // Identical height (48px)
      expect(helpBox.height).toBe(matchBox.height);
      expect(helpBox.height).toBeGreaterThanOrEqual(44);
      // Width within 2px of the same min-width rule
      expect(Math.abs(helpBox.width - matchBox.width)).toBeLessThanOrEqual(2);
    }
  });

  test("2.b (mobile) Help and Find my match have identical bounding-box height and equal width on mobile (390px and 360px)", async ({ page }) => {
    for (const width of [390, 360]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");

      const helpLink = page.locator("header nav").getByRole("link", { name: "Help" });
      const matchLink = page.locator("header nav").getByRole("link", { name: "Find my match" });

      await expect(helpLink).toBeVisible();
      await expect(matchLink).toBeVisible();

      const helpBox = await helpLink.boundingBox();
      const matchBox = await matchLink.boundingBox();

      expect(helpBox).not.toBeNull();
      expect(matchBox).not.toBeNull();

      if (helpBox && matchBox) {
        expect(helpBox.height).toBe(matchBox.height);
        expect(helpBox.height).toBeGreaterThanOrEqual(44);
        expect(Math.abs(helpBox.width - matchBox.width)).toBeLessThanOrEqual(2);
      }
    }
  });

  // 2.c Help opens /help and shows the active state; Find my match still opens /match.
  test("2.c Help opens /help and shows active state; Find my match opens /match", async ({ page }) => {
    await page.goto("/");

    // Click Help
    const helpLink = page.locator("header nav").getByRole("link", { name: "Help" });
    await helpLink.click();
    await expect(page).toHaveURL(/\/help/);

    // Active state on /help
    const activeHelpLink = page.locator("header nav").getByRole("link", { name: "Help" });
    await expect(activeHelpLink).toBeVisible();
    await expect(activeHelpLink).toHaveAttribute("aria-current", "page");

    // Click Find my match from header
    const matchLink = page.locator("header nav").getByRole("link", { name: "Find my match" });
    await matchLink.click();
    await expect(page).toHaveURL(/\/match/);
  });

  // 2.d No horizontal overflow at 390px and 360px; keyboard Tab reaches both buttons.
  test("2.d No horizontal overflow at 390px and 360px; keyboard Tab reaches both buttons", async ({ page }) => {
    for (const width of [390, 360]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");

      // Verify no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

      // Verify header fits on one row without wrapping
      const helpBox = await page.locator("header nav").getByRole("link", { name: "Help" }).boundingBox();
      const matchBox = await page.locator("header nav").getByRole("link", { name: "Find my match" }).boundingBox();
      expect(helpBox).not.toBeNull();
      expect(matchBox).not.toBeNull();
      if (helpBox && matchBox) {
        // Both buttons should be on the same vertical Y position (no wrapping)
        expect(Math.abs(helpBox.y - matchBox.y)).toBeLessThanOrEqual(2);
      }
    }

    // Keyboard navigation reaches both Help and Find my match
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const focusedElements: string[] = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      const text = (await page.evaluate(() => document.activeElement?.textContent))?.trim() || "";
      focusedElements.push(text);
      if (focusedElements.includes("Find my match") && focusedElements.includes("Help")) {
        break;
      }
    }

    expect(focusedElements).toContain("Help");
    expect(focusedElements).toContain("Find my match");
  });

  // 2.e /how-it-works and /safeguards routes and hash fragment redirects work properly
  test("2.e Routes and hash fragment redirects work properly", async ({ page }) => {
    await page.goto("/#how-it-works");
    await expect(page).toHaveURL(/\/how-it-works/);

    await page.goto("/#honest-rules");
    await expect(page).toHaveURL(/\/safeguards/);

    await page.goto("/#recommendation-preview");
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain("#recommendation-preview");
    await expect(page.locator("h1")).toContainText(/Not sure which .* to choose\?/i);
  });
});
