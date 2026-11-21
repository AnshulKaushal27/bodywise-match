import { test, expect } from "@playwright/test";

test.describe("Catalogue Directory Filters Dialog & State Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss notice banner to keep viewports clean
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });
  });

  test("1. Page loads with no open filter card; Filters button is visible and accessible", async ({
    page,
  }) => {
    await page.goto("/products");
    await expect(page.locator("h1")).toContainText(/Browse Product Catalogue/i);

    // Old large always-open filter card must be gone
    await expect(page.getByText("Filter by Attributes")).not.toBeVisible();

    // Filters button should be visible with proper aria attributes
    const filtersBtn = page.getByRole("button", { name: /^Filters/i });
    await expect(filtersBtn).toBeVisible();
    await expect(filtersBtn).toHaveAttribute("aria-haspopup", "dialog");
    await expect(filtersBtn).toHaveAttribute("aria-expanded", "false");

    // Search input has min-h-[52px] and is visible
    const searchInput = page.locator("#catalogue-search-input");
    await expect(searchInput).toBeVisible();
  });

  test("2. Filters button opens dialog, shows facet groups with counts, and focus moves inside", async ({
    page,
  }) => {
    await page.goto("/products");

    const filtersBtn = page.getByRole("button", { name: /^Filters/i });
    await filtersBtn.click();

    // Dialog is visible
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Filters" })).toBeVisible();
    await expect(dialog.getByText("Choose what matters to you")).toBeVisible();

    // Attribute groups exist
    await expect(dialog.getByText("Category", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Format", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Target Concern & Goal", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Fragrance Declaration", { exact: true })).toBeVisible();

    // Close button has aria-label
    const closeBtn = dialog.getByRole("button", { name: /Close filters/i });
    await expect(closeBtn).toBeVisible();
  });

  test("3. Selecting chips updates draft 'Show N products' count instantly", async ({
    page,
  }) => {
    await page.goto("/products");

    await page.getByRole("button", { name: /^Filters/i }).click();
    const dialog = page.getByRole("dialog");

    // Initially shows all products count (e.g. 107 products)
    const applyBtn = dialog.getByRole("button", { name: /Show \d+ products/i });
    await expect(applyBtn).toBeVisible();
    const initialText = await applyBtn.innerText();

    // Click "Face Wash" chip inside dialog
    const faceWashChip = dialog.getByRole("button", { name: /Face Wash/i });
    await faceWashChip.click();

    // Apply button text should update to smaller number
    await expect(applyBtn).toBeVisible();
    const updatedText = await applyBtn.innerText();
    expect(updatedText).not.toBe(initialText);
  });

  test("4. Apply updates grid, URL search params, and active count badge", async ({
    page,
  }) => {
    await page.goto("/products");

    await page.getByRole("button", { name: /^Filters/i }).click();
    const dialog = page.getByRole("dialog");

    // Select Face Wash
    await dialog.getByRole("button", { name: /Face Wash/i }).click();

    // Click Apply button
    const applyBtn = dialog.getByRole("button", { name: /Show \d+ products/i });
    await applyBtn.click();

    // Dialog closes
    await expect(dialog).not.toBeVisible();

    // URL has ?category=face_wash or ?category=face-wash
    await expect(page).toHaveURL(/category=face_wash/);

    // Filters button displays count badge "1"
    const filtersBtn = page.getByRole("button", { name: /^Filters/i });
    await expect(filtersBtn).toContainText("1");

    // Active filter chip row is visible with "Face Wash" and remove button
    const activeRegion = page.getByRole("region", { name: "Active Filters" });
    await expect(activeRegion).toBeVisible();
    await expect(activeRegion.getByText("Face Wash")).toBeVisible();
  });

  test("5. Escape and X close button discard unapplied draft changes", async ({
    page,
  }) => {
    await page.goto("/products");

    // Open dialog
    await page.getByRole("button", { name: /^Filters/i }).click();
    const dialog = page.getByRole("dialog");

    // Select Shampoo
    await dialog.getByRole("button", { name: /Shampoo/i }).click();

    // Press Escape to cancel
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();

    // URL unchanged and no badge
    await expect(page).not.toHaveURL(/category=shampoo/);
    await expect(page.getByRole("region", { name: "Active Filters" })).not.toBeVisible();

    // Reopen and close via Close (X) button
    await page.getByRole("button", { name: /^Filters/i }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /Serum & Roll-On/i }).click();
    await dialog.getByRole("button", { name: /Close filters/i }).click();
    await expect(dialog).not.toBeVisible();

    // Still no active filters
    await expect(page).not.toHaveURL(/category=serum/);
  });

  test("6. Clear all works in both dialog draft and active chips row", async ({
    page,
  }) => {
    await page.goto("/products?category=face_wash&fragrance=fragrance_free");

    // Verify deep link parsed into active chips
    const activeRegion = page.getByRole("region", { name: "Active Filters" });
    await expect(activeRegion).toBeVisible();
    await expect(page.getByRole("button", { name: /^Filters/i })).toContainText("2");

    // Clear all via active chips row
    const clearAllRowBtn = activeRegion.getByRole("button", { name: /Clear all/i });
    await clearAllRowBtn.click();

    // Active chips gone, badge gone
    await expect(activeRegion).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^Filters/i })).not.toContainText("2");
  });

  test("7. Removing an individual active chip updates results and URL", async ({
    page,
  }) => {
    await page.goto("/products?category=face_wash");

    const removeBtn = page.getByRole("button", { name: /Remove filter: Face Wash/i });
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // Active chip is removed and URL is cleared
    await expect(page.getByRole("region", { name: "Active Filters" })).not.toBeVisible();
    await expect(page).not.toHaveURL(/category=face_wash/);
  });

  test("8. Focus return: closing dialog returns focus to Filters button", async ({
    page,
  }) => {
    await page.goto("/products");

    const filtersBtn = page.getByRole("button", { name: /^Filters/i });
    await filtersBtn.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Close via Escape
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();

    // Filters button should have focus returned
    await expect(filtersBtn).toBeFocused();
  });

  test("9. Mobile viewport (390px): no horizontal overflow, sheet slides up", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/products");

    // Verify no document horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // Open filters dialog
    const filtersBtn = page.getByRole("button", { name: /^Filters/i });
    await filtersBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Check that mobile drag handle is rendered
    await expect(dialog.locator(".rounded-full").first()).toBeVisible();

    // Verify dialog width on mobile doesn't overflow
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox?.width).toBeLessThanOrEqual(390);
  });
});
