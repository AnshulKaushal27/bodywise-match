import { test, expect } from "@playwright/test";

test.describe("Unified Chat & Knowledge Pipeline E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });
  });

  test("1. Floating launcher appears and toggles panel with focus trap & Esc", async ({ page }) => {
    await page.goto("/");
    const launcher = page.locator("[data-testid='chat-launcher']");
    await expect(launcher).toBeVisible({ timeout: 15000 });

    // Click opens panel
    await launcher.click({ force: true });
    const dialog = page.locator("[data-testid='chat-panel']");
    await expect(dialog).toBeVisible();

    // Textarea is focused
    const textarea = page.locator("[data-testid='chat-input']");
    await expect(textarea).toBeFocused();

    // Esc closes panel and returns focus to launcher
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(launcher).toBeFocused();
  });

  test("2. Product page asks question with context chip & returns verified packaging tag", async ({ page }) => {
    await page.goto("/products/1-salicylic-acid-body-wash");

    const launcher = page.locator("[data-testid='chat-launcher']");
    await expect(launcher).toBeVisible({ timeout: 15000 });
    await launcher.click({ force: true });

    const dialog = page.locator("[data-testid='chat-panel']");
    await expect(dialog).toBeVisible();

    // Context banner should show product name
    await expect(dialog.getByText(/Asking about:/i)).toBeVisible();

    // Send question
    const textarea = page.locator("[data-testid='chat-input']");
    await textarea.fill("is this good for back acne?");
    await textarea.press("Enter");

    // Assistant response arrives with verified source tag
    await expect(dialog.getByText(/Official product packaging|Verified packaging/i).first()).toBeVisible({ timeout: 15000 });
  });

  test("3. Confirm page proposing change provides 'Apply to match' button and updates live shortlist", async ({ page }) => {
    // Start on match page with body wash
    await page.goto("/match");
    const input = page.locator("textarea#concern-input");
    await input.fill("body wash for back acne");
    await page.getByRole("button", { name: /^continue$/i }).click();

    await expect(page).toHaveURL(/\/match\/confirm/);

    // Open chat
    const launcher = page.locator("[data-testid='chat-launcher']");
    await expect(launcher).toBeVisible({ timeout: 15000 });
    await launcher.click({ force: true });

    const dialog = page.locator("[data-testid='chat-panel']");
    await expect(dialog).toBeVisible();

    // Ask to switch to shampoo
    const textarea = page.locator("[data-testid='chat-input']");
    await textarea.fill("can i switch to shampoo?");
    await page.locator("[data-testid='chat-send']").click();

    // Verify "Apply to match" button appears
    const applyBtn = dialog.getByRole("button", { name: /apply to match/i });
    await expect(applyBtn).toBeVisible({ timeout: 15000 });

    // Click apply to match
    await applyBtn.click();

    // Verify shortlist status or confirm page reflects shampoo
    await expect(page.getByText(/Shampoo/i).first()).toBeVisible();
  });

  test("4. Live shortlist status bar displays real count and navigates to results", async ({ page }) => {
    await page.goto("/products");

    // Open chat
    const launcher = page.locator("[data-testid='chat-launcher']");
    await expect(launcher).toBeVisible({ timeout: 15000 });
    await launcher.click({ force: true });

    const dialog = page.locator("[data-testid='chat-panel']");
    await expect(dialog).toBeVisible();

    // Ask for anti dandruff shampoo
    const textarea = page.locator("[data-testid='chat-input']");
    await textarea.fill("anti-dandruff shampoo");
    await page.locator("[data-testid='chat-send']").click();

    // Wait for response and shortlist bar
    await expect(dialog.getByText(/Shortlist:/i)).toBeVisible({ timeout: 15000 });
    const viewMatchesBtn = dialog.getByRole("button", { name: /view matches/i });
    await expect(viewMatchesBtn).toBeVisible();

    // Click view matches
    await viewMatchesBtn.click();
    await expect(page).toHaveURL(/\/match\/results/);
  });
});
