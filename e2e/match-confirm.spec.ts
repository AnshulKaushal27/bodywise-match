import { test, expect } from "@playwright/test";

test.describe("Match Confirm & Guided Facet Flow (Redesign Acceptance Suite)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });
  });

  test("1. Acceptance: Input 'hydration, no parabens, evening' -> provenance chips, candidate-filtered options with counts", async ({
    page,
  }) => {
    await page.goto("/match");
    await expect(page.getByRole("heading", { name: /what would you like help choosing for/i })).toBeVisible();

    const input = page.locator("textarea#concern-input");
    await input.fill("hydration, no parabens, evening");
    await page.getByRole("button", { name: /^continue$/i }).click();

    await expect(page).toHaveURL(/\/match\/confirm/);
    await expect(page.getByRole("heading", { name: /here's what we understood/i })).toBeVisible();

    // Check chips with provenance
    await expect(page.getByText(/Hydration/i).first()).toBeVisible();
    await expect(page.getByText(/No Parabens/i)).toBeVisible();
    await expect(page.getByText(/Evening/i)).toBeVisible();

    // Verify Path Chooser exists with 3 stacked paths
    await expect(page.getByRole("heading", { name: /how would you like to continue/i })).toBeVisible();
    await expect(page.getByText("Show my matches now")).toBeVisible();
    await expect(page.getByText("Narrow it down for me")).toBeVisible();
    await expect(page.getByText("I'll fine-tune it myself")).toBeVisible();

    // Click "Narrow it down for me" to see guided questions
    await page.getByText("Narrow it down for me").click();

    // Verify question is visible and options ONLY include relevant hydration candidate options with counts
    await expect(page.getByRole("heading", { level: 3 })).toBeVisible();
    const options = page.locator("[data-testid='facet-options-grid'] button");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(2);

    // Each option should show a count in parentheses (e.g. "Body wash (19)" or "Any / not sure")
    for (let i = 0; i < optionCount; i++) {
      const text = await options.nth(i).innerText();
      expect(text).toMatch(/(\(\d+\)|not sure)/i);
      // Ensure irrelevant categories like scalp or underarm are NOT offered for hydration
      expect(text.toLowerCase()).not.toContain("scalp");
      expect(text.toLowerCase()).not.toContain("underarm");
    }

    // Verify AI unavailable or AI interpreted line contains NO GROQ_API_KEY text
    const bodyText = await page.innerText("body");
    expect(bodyText).not.toContain("GROQ_API_KEY");
  });

  test("2. Path 1: 'Show my matches now' navigates immediately to results", async ({
    page,
  }) => {
    await page.goto("/match");
    await page.locator("textarea#concern-input").fill("dry skin hydration");
    await page.getByRole("button", { name: /^continue$/i }).click();

    await expect(page).toHaveURL(/\/match\/confirm/);

    // Select Path 1
    await page.getByText("Show my matches now").click();
    const seeMatchesBtn = page.getByRole("button", { name: /see (\d+ match|matches)/i }).first();
    await expect(seeMatchesBtn).toBeVisible();
    await seeMatchesBtn.click();

    await expect(page).toHaveURL(/\/match\/results/);
    await expect(page.getByRole("heading", { name: /options that match what you told us/i })).toBeVisible();
  });

  test("3. Path 2: Guided question answers update preview count and add choice chips", async ({
    page,
  }) => {
    await page.goto("/match");
    await page.locator("textarea#concern-input").fill("hydration");
    await page.getByRole("button", { name: /^continue$/i }).click();

    await expect(page).toHaveURL(/\/match\/confirm/);

    // Open Path 2
    await page.getByText("Narrow it down for me").click();
    const questionHeading = page.getByRole("heading", { level: 3 });
    await expect(questionHeading).toBeVisible();

    // Click the first specific option (not "Any / not sure")
    const firstOption = page.locator("[data-testid='facet-options-grid'] button").first();
    await firstOption.click();

    // The chosen facet should now appear in "Your choices:"
    await expect(page.getByText("Your choices:")).toBeVisible();

    // Wait for next question or shortlist focus state to settle
    await page.waitForTimeout(500);

    // Skip questions button works if another question is shown
    const skipBtn = page.getByRole("button", { name: /skip questions/i });
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    }
    await expect(page.getByRole("button", { name: /see (\d+ match|matches)/i }).first()).toBeVisible();
  });

  test("4. Path 3: Fine-tune panel allows direct facet adjustments with live count", async ({
    page,
  }) => {
    await page.goto("/match");
    await page.locator("textarea#concern-input").fill("body skin care");
    await page.getByRole("button", { name: /^continue$/i }).click();

    await expect(page).toHaveURL(/\/match\/confirm/);

    // Select Path 3
    await page.getByText("I'll fine-tune it myself").click();

    // Fine-tune controls should appear
    await expect(page.getByText(/Product Category/i)).toBeVisible();
    await expect(page.getByText(/Format Preference/i)).toBeVisible();
    await expect(page.getByText("Fragrance", { exact: true })).toBeVisible();

    // Click a category filter
    const bodyWashChip = page.getByRole("button", { name: "Body wash" });
    if (await bodyWashChip.isVisible()) {
      await bodyWashChip.click();
    }

    const seeMatchesBtn = page.getByRole("button", { name: /see (\d+ match|matches)/i }).first();
    await expect(seeMatchesBtn).toBeVisible();
  });

  test("5. Results page Refine bar displays active facets and allows adding questions", async ({
    page,
  }) => {
    await page.goto("/match");
    await page.locator("textarea#concern-input").fill("dry skin hydration");
    await page.getByRole("button", { name: /^continue$/i }).click();

    await expect(page).toHaveURL(/\/match\/confirm/);
    await page.getByText("Show my matches now").click();
    const seeMatchesBtn = page.getByRole("button", { name: /see (\d+ match|matches)/i }).first();
    await expect(seeMatchesBtn).toBeVisible();
    await seeMatchesBtn.click();

    await expect(page).toHaveURL(/\/match\/results/);

    // Verify Refine bar exists
    await expect(page.getByText(/Refine shortlist/i)).toBeVisible();
    const askQuestionBtn = page.getByRole("button", { name: /ask me a question/i });
    await expect(askQuestionBtn).toBeVisible();

    // Clicking "Ask me a question" opens a dialog
    await askQuestionBtn.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /refine with a quick question/i })).toBeVisible();

    // Close question dialog
    const closeBtn = dialog.getByRole("button", { name: /close dialog/i });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(dialog).not.toBeVisible();
    }
  });

  test("6. Mobile viewport (390px): Bottom preview bar is visible and opens preview sheet", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/match");
    await page.locator("textarea#concern-input").fill("hydration");
    await page.getByRole("button", { name: /^continue$/i }).click();

    await expect(page).toHaveURL(/\/match\/confirm/);

    // Verify mobile bottom bar
    const togglePreviewBtn = page.getByRole("button", { name: /toggle live shortlist preview/i });
    await expect(togglePreviewBtn).toBeVisible();
    await expect(togglePreviewBtn).toContainText(/products fit so far/i);

    // Click toggle to open bottom sheet
    await togglePreviewBtn.click();
    const sheetHeading = page.getByRole("heading", { name: "Early look at your matches", level: 3 });
    await expect(sheetHeading).toBeVisible();

    // Close preview sheet
    const closeSheetBtn = page.getByRole("button", { name: /close preview sheet/i });
    await closeSheetBtn.click();
    await expect(sheetHeading).not.toBeVisible();
  });
});
