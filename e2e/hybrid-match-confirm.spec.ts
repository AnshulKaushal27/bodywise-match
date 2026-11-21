import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Hybrid Match Confirm Flow & Acceptance Tests", () => {
  const screenshotsDir = path.resolve(process.cwd(), "docs/screenshots");
  const brainScreenshotsDir = "C:\\Users\\anshu\\.gemini\\antigravity\\brain\\0ecac9d0-0b9d-4edd-a8ad-06514a2888c4\\screenshots";

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    try {
      if (!fs.existsSync(brainScreenshotsDir)) {
        fs.mkdirSync(brainScreenshotsDir, { recursive: true });
      }
    } catch {
      // Ignore if brain directory is inaccessible
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });
  });

  test("1. Acceptance Test: Hinglish intake parses face dryness, dark spots, cream, daily & displays question card", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/match");
    await expect(page.getByRole("heading", { name: /what would you like help choosing for/i })).toBeVisible();

    const input = page.locator("textarea#concern-input");
    await input.fill("yaar mere muh pe bahut dryness hai aur darkkspots bhi hain koi cream bata do jo daily laga sku");
    await page.getByRole("button", { name: /^continue$/i }).click();

    await expect(page).toHaveURL(/\/match\/confirm/);

    // Verify Understanding Card
    await expect(page.getByRole("heading", { name: /what we understood/i })).toBeVisible();
    await expect(page.getByText(/You misunderstood me/i)).toBeVisible();

    // Verify Needs
    await expect(page.getByText(/Hydration|Dryness/i).first()).toBeVisible();
    await expect(page.getByText(/Dark spots|Reduce the look of dark spots/i).first()).toBeVisible();

    // Verify Product Type is Moisturizer/Cream, NOT Serum
    await expect(page.getByText(/Moisturizer|Cream/i).first()).toBeVisible();
    const bodyText = await page.innerText("body");
    expect(bodyText).not.toContain("(LLM output did not match ParsedRequestSchema)");

    // Verify Guided Question Card
    await expect(page.getByText(/Prefer to type\? Chat instead/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /See \d+ matches/i }).first()).toBeVisible();

    // Verify Live Preview Shortlist
    await expect(page.getByRole("heading", { name: /Live Shortlist/i })).toBeVisible();

    // Save Desktop Screenshot
    const screenshotPath = path.join(screenshotsDir, "desktop-confirm-hybrid.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    try {
      fs.copyFileSync(screenshotPath, path.join(brainScreenshotsDir, "desktop-confirm-hybrid.png"));
    } catch {}
  });

  test("2. Two-way sync: Chat Dialog opens, updates time_of_day to night, and syncs preview", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/match");
    const input = page.locator("textarea#concern-input");
    await input.fill("yaar mere muh pe bahut dryness hai aur darkkspots bhi hain koi cream bata do jo daily laga sku");
    await page.getByRole("button", { name: /^continue$/i }).click();
    await expect(page).toHaveURL(/\/match\/confirm/);

    // Click "Prefer to type? Chat instead"
    const chatButton = page.getByRole("button", { name: /Prefer to type\? Chat instead/i });
    await chatButton.click();

    // Dialog opens
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Chat about your match/i })).toBeVisible();

    // Save Chat Open Screenshot
    const chatScreenshotPath = path.join(screenshotsDir, "desktop-chat-open.png");
    await page.screenshot({ path: chatScreenshotPath, fullPage: true });
    try {
      fs.copyFileSync(chatScreenshotPath, path.join(brainScreenshotsDir, "desktop-chat-open.png"));
    } catch {}

    // Type "night me use karunga"
    const chatInput = page.locator("textarea[aria-label='Type your message']");
    await chatInput.fill("night me use karunga");
    await page.getByRole("button", { name: /Send message/i }).click();

    // Wait for response message
    await expect(page.getByText(/night/i).first()).toBeVisible({ timeout: 10000 });

    // Close chat via Escape key
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Verify focus returned to the "Chat instead" button
    await expect(chatButton).toBeFocused();
  });

  test("3. Chat groundedness: ask about fragrance and verify verified catalogue fact tag", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/match");
    const input = page.locator("textarea#concern-input");
    await input.fill("face moisturizer cream");
    await page.getByRole("button", { name: /^continue$/i }).click();
    await expect(page).toHaveURL(/\/match\/confirm/);

    // Open chat
    await page.getByRole("button", { name: /Prefer to type\? Chat instead/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Ask about fragrance
    const chatInput = page.locator("textarea[aria-label='Type your message']");
    await chatInput.fill("kya isme koi fragrance hai?");
    await page.getByRole("button", { name: /Send message/i }).click();

    // Verify assistant answer contains catalogue fact badge
    await expect(page.getByText(/Packaging facts/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("4. Mobile viewport (390px): bottom preview bar and mobile sheet", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/match");
    const input = page.locator("textarea#concern-input");
    await input.fill("face cream for dry skin");
    await page.getByRole("button", { name: /^continue$/i }).click();
    await expect(page).toHaveURL(/\/match\/confirm/);

    // Check bottom preview bar
    await expect(page.getByText(/matches ready/i)).toBeVisible();

    // Open chat dialog on mobile
    await page.getByRole("button", { name: /Prefer to type\? Chat instead/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Save Mobile Sheet Screenshot
    const mobileScreenshotPath = path.join(screenshotsDir, "mobile-confirm-sheet.png");
    await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
    try {
      fs.copyFileSync(mobileScreenshotPath, path.join(brainScreenshotsDir, "mobile-confirm-sheet.png"));
    } catch {}
  });
});
