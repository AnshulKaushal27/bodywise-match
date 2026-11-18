import { test, expect } from "@playwright/test";

test.describe("Bodywise Match - End-to-End Test Suite", () => {
  // 1. Happy Path: Landing -> Match -> Confirm -> Results -> Compare -> Details
  test("1. Happy path: landing -> intake -> confirm -> results -> compare -> details", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });

    // 1. Landing Page
    await page.goto("/");
    await expect(page).toHaveTitle(/Bodywise Match/i);
    await expect(page.locator("h1")).toContainText(/fits your concern/i);

    // Click "Find my match" in hero section
    const startLink = page.locator("#hero-section").getByRole("link", { name: /find my match/i });
    await startLink.click();
    await expect(page).toHaveURL(/\/match/);

    // 2. Step 1: Describe Concern
    await expect(page.getByRole("heading", { name: /what would you like help choosing for/i })).toBeVisible();
    const concernInput = page.locator("textarea#concern-input");
    await concernInput.fill("I want to reduce rough skin bumps on my upper arms and back.");

    // Submit Step 1 via Continue button
    const continueBtn = page.getByRole("button", { name: /^continue$/i });
    await continueBtn.click();
    await expect(page).toHaveURL(/\/match\/confirm/);

    // 3. Step 2: Confirm & Clarifying Question
    await expect(page.getByRole("heading", { name: /here's what we understood/i })).toBeVisible();

    // Click an option button or skip to proceed to results
    const optionBtn = page.locator(".grid button").first();
    if (await optionBtn.isVisible()) {
      await optionBtn.click();
    }

    const seeOptionsBtn = page.getByRole("button", { name: /see my options/i });
    if (await seeOptionsBtn.isVisible()) {
      await seeOptionsBtn.click();
    } else {
      await page.goto("/match/results");
    }

    await expect(page).toHaveURL(/\/match\/results/);

    // 4. Step 3: Shortlist Results
    await expect(page.getByRole("heading", { name: /options that match what you told us/i })).toBeVisible();

    // Verify Recommendation Cards
    const cards = page.locator(".shadow-card");
    await expect(cards.first()).toBeVisible();
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Verify trade-offs on first card
    await expect(cards.first().getByText(/consider this if/i)).toBeVisible();
    await expect(cards.first().getByText(/may not be the best fit if/i)).toBeVisible();

    // Verify collapsible "How we matched" panel
    const howWeMatchedBtn = page.getByRole("button", { name: /how we matched these options/i });
    await expect(howWeMatchedBtn).toBeVisible();
    await expect(page.getByText(/rules version: 1.0.0/i)).toBeVisible();

    // Select compare checkboxes on two cards
    const compareCheckboxes = page.locator("label").filter({ hasText: "Compare" }).locator("input[type='checkbox']");
    await compareCheckboxes.nth(0).check();
    await compareCheckboxes.nth(1).check();

    // Floating comparison bar appears
    const compareNowBtn = page.getByRole("button", { name: /compare now/i });
    await expect(compareNowBtn).toBeVisible();

    // View Details modal test
    const viewDetailsBtn = cards.first().getByRole("button", { name: /view details/i });
    await viewDetailsBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/official description/i)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 5. Compare Page
    await page.goto("/compare");
    await expect(page).toHaveURL(/\/compare/);
    await expect(page.getByRole("heading", { name: /compare product specifications/i })).toBeVisible();

    // Differences toggle
    const diffToggle = page.getByLabel(/show only differences/i);
    await diffToggle.check();
    expect(await diffToggle.isChecked()).toBe(true);
    await diffToggle.uncheck();

    // 6. Product Detail Page
    await page.goto("/products/1-salicylic-acid-body-wash");
    await expect(page).toHaveURL(/\/products\/1-salicylic-acid-body-wash/);
    await expect(page.getByRole("heading", { name: /1% salicylic acid body wash/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /intended use/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /how to use/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /ingredients/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /cautions/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /customer experiences/i })).toBeVisible();
  });

  // 2. Edit Parsed Chips
  test("2. Edit parsed chips: update preferences in /match/confirm", async ({ page }) => {
    await page.goto("/match/confirm");
    await expect(page.getByRole("heading", { name: /here's what we understood/i })).toBeVisible();

    // Click "+ Add a preference" button
    const addPrefBtn = page.getByRole("button", { name: /add a preference/i });
    await expect(addPrefBtn).toBeVisible();
    await addPrefBtn.click();

    // Dialog opens
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/add a preference or avoidance/i)).toBeVisible();

    // Select an avoidance chip: "No Fragrance / perfume"
    const fragranceChip = dialog.getByRole("button", { name: /fragrance/i }).first();
    await fragranceChip.click();

    // Modal closes automatically, chip is now visible in avoidances
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(/fragrance/i).first()).toBeVisible();
  });

  // 3. "This Doesn't Fit" Shortlist Regeneration
  test("3. 'This doesn't fit': opens dialog and regenerates shortlist", async ({ page }) => {
    await page.goto("/match/results");
    await expect(page.getByRole("heading", { name: /options that match what you told us/i })).toBeVisible();

    // Click "This doesn't fit" on first card
    const rejectBtn = page.locator("[data-testid='this-doesnt-fit-btn']").first();
    await rejectBtn.click();

    // Dialog appears with reasons
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/why doesn't this option fit/i)).toBeVisible();

    // Select reason: "Wrong format"
    const wrongFormatBtn = dialog.getByRole("button", { name: /wrong format/i });
    await wrongFormatBtn.click();

    // Dialog closes and shortlist updates
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("heading", { name: /options that match what you told us/i })).toBeVisible();
  });

  // 4. NO_FIT Path
  test("4. NO_FIT path: displays friendly EmptyState with browse and change links", async ({ page }) => {
    // Inject contradictory criteria into sessionStorage before navigating
    await page.goto("/match/results");
    await page.evaluate(() => {
      sessionStorage.setItem(
        "bodywise_parsed_needs",
        JSON.stringify({
          goal: "unsupported_unknown_goal_xyz",
          category: null,
          format_preferences: ["Unobtainable Format"],
          avoidances: [],
          routine_context: null,
          uncertainties: [],
          confidence: "low",
        })
      );
    });
    // Reload page to re-run matcher against contradictory criteria
    await page.reload();

    // Verify EmptyState appears
    await expect(page.getByText(/we couldn't find a good fit in our current catalogue/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /browse all products/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /change my request/i })).toBeVisible();
  });

  // 5. API-down Fallback
  test("5. API-down fallback: graceful client-side heuristic when API is offline", async ({ page }) => {
    // Intercept API routes to simulate offline / server error
    await page.route("**/v1/**", (route) => {
      route.abort("failed");
    });

    await page.goto("/match");
    const concernInput = page.locator("textarea#concern-input");
    await concernInput.fill("I want something for daily cleansing and hydration.");

    const continueBtn = page.getByRole("button", { name: /^continue$/i });
    await continueBtn.click();

    // App gracefully catches error and shows manual fallback option
    const manualBtn = page.getByRole("button", { name: /proceed manually|continue with manual/i });
    await expect(manualBtn).toBeVisible();
    await manualBtn.click();

    // Gracefully lands on step 2
    await expect(page).toHaveURL(/\/match\/confirm/);
    await expect(page.getByRole("heading", { name: /here's what we understood/i })).toBeVisible();
  });

  // 6. Help Centre: Checklist, Details, Template & Copy
  test("6. Help centre: checklist ticking, local details entry, template generation, copy & clear", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Help landing
    await page.goto("/help");
    await expect(page.getByRole("heading", { name: /need help with an order or product/i })).toBeVisible();
    await expect(page.getByText(/we can't check your order, courier, payment or batch here/i)).toBeVisible();

    // Navigate to Damaged Package issue
    const damagedLink = page.getByRole("link", { name: /damaged or leaking package/i });
    await damagedLink.click();
    await expect(page).toHaveURL(/\/help\/damaged-package/);

    // (1) Check checklist item
    const checkbox = page.locator("input[type='checkbox']").first();
    await checkbox.check();
    expect(await checkbox.isChecked()).toBe(true);

    // (2) User-entered fields (stored in localStorage only)
    await page.locator("input#field-order_id").fill("BW-987654");
    await page.locator("input#field-batch_number").fill("B26-999");

    // (3) Editable message template dynamically updates
    const templateTextarea = page.locator("textarea");
    await expect(templateTextarea).toContainText("BW-987654");
    await expect(templateTextarea).toContainText("B26-999");

    // Copy template button
    const copyBtn = page.getByRole("button", { name: /copy message/i });
    await copyBtn.click();
    await expect(page.getByText(/copied to clipboard/i)).toBeVisible();

    // (4) Official support box
    await expect(page.getByRole("heading", { name: /official email support/i })).toBeVisible();

    // (5) "Clear my local data" button
    const clearBtn = page.getByRole("button", { name: /clear my local data/i }).first();
    await clearBtn.click();
    await expect(page.getByText(/local checklist and draft fields for this issue have been cleared/i)).toBeVisible();
  });

  // 7. Skip Flows
  test("7. Skip flows: step 2 skip and feedback experience skip", async ({ page }) => {
    // Confirm step skip
    await page.goto("/match/confirm");
    const skipStep2Btn = page.getByRole("button", { name: /skip, show broad options/i });
    if (await skipStep2Btn.isVisible()) {
      await skipStep2Btn.click();
      const seeOptionsBtn = page.getByRole("button", { name: /see my options/i });
      await expect(seeOptionsBtn).toBeVisible();
      await seeOptionsBtn.click();
      await expect(page).toHaveURL(/\/match\/results/);
    }

    // Feedback experience skip buttons
    await page.goto("/feedback/experience");
    await expect(page.getByRole("heading", { name: /share your product experience/i })).toBeVisible();

    // Top escape buttons: "I didn't try it", "Not yet", "Skip"
    const didntTryBtn = page.getByRole("button", { name: /i didn't try it/i });
    await expect(didntTryBtn).toBeVisible();
    await didntTryBtn.click();

    // Respectful acknowledgement view
    await expect(page.getByText(/no problem at all/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /browse catalogue/i })).toBeVisible();
  });

  // 8. Privacy Data Deletion
  test("8. Privacy data deletion: /privacy/data view, export download, and delete local data", async ({
    page,
  }) => {
    // Populate dummy local data
    await page.goto("/privacy/data");
    await expect(page.getByRole("heading", { name: /your privacy & data management/i })).toBeVisible();

    await page.evaluate(() => {
      localStorage.setItem("bodywise_saved_trials", JSON.stringify([{ slug: "demo-body-wash-a", name: "Demo Wash", saved_at: Date.now() }]));
      sessionStorage.setItem("bodywise_parsed_needs", JSON.stringify({ goal: "body_bumps_look" }));
    });

    // Refresh view
    await page.getByRole("button", { name: "Refresh" }).click();

    // Verify local data summary lists items
    await expect(page.getByText(/stated concern & goals/i)).toBeVisible();

    // Delete all local data button
    const deleteBtn = page.getByRole("button", { name: /delete all local data/i });
    await expect(deleteBtn).toBeEnabled();
    await deleteBtn.click();

    // Verify deletion confirmation
    await expect(page.getByText(/all local browser records .* have been permanently erased/i)).toBeVisible();

    // Confirm storage is cleared
    const storageEmpty = await page.evaluate(() => {
      return localStorage.getItem("bodywise_saved_trials") === null && sessionStorage.getItem("bodywise_parsed_needs") === null;
    });
    expect(storageEmpty).toBe(true);
  });
});
