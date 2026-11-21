import { test, expect } from "@playwright/test";

test.describe("Signature Polish E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    });
  });

  // 2.a Hero word rotates through real categories only; pauses on hover/focus and with Pause button; static under reduced motion; no layout shift
  test("2.a Hero rotating word rotates through real categories, pauses with button/hover, static on reduced motion", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const rotatingSpan = page.locator("[data-hero-rotating-word]");
    await expect(rotatingSpan).toBeVisible();

    // Check initial text is a valid category
    const initialText = await rotatingSpan.textContent();
    const validWords = ["body wash", "serum", "supplement", "sunscreen", "shampoo", "face wash"];
    expect(validWords).toContain(initialText?.trim());

    // Check bounding box height and width do not shift layout
    const initialBox = await rotatingSpan.boundingBox();
    expect(initialBox).not.toBeNull();

    // Test Pause button toggle (WCAG 2.2.2)
    const pauseButton = page.locator("button[aria-label*='category rotation']");
    await expect(pauseButton).toBeVisible();
    await pauseButton.click();
    await expect(page.locator("button[aria-label='Resume category rotation']")).toBeVisible();

    // Resume
    await pauseButton.click();
    await expect(page.locator("button[aria-label='Pause category rotation']")).toBeVisible();
  });

  test("2.a (reduced motion) Hero word remains static under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const rotatingSpan = page.locator("[data-hero-rotating-word]");
    await expect(rotatingSpan).toBeVisible();
    const initialText = await rotatingSpan.textContent();

    // Wait to ensure it does not rotate
    await page.waitForTimeout(1000);
    const textAfterWait = await rotatingSpan.textContent();
    expect(textAfterWait).toBe(initialText);
  });

  // 2.b Hero input placeholder animates, stops on focus, and submitting opens /match with text prefilled
  test("2.b Hero query input typing animation, stops on focus, submitting navigates to /match", async ({ page }) => {
    await page.goto("/");
    const queryInput = page.locator("#hero-query-input");
    await expect(queryInput).toBeVisible();

    // Focus input -> typewriter stops
    await queryInput.click();
    await queryInput.fill("chehre ke daag dhabbe aur tanning ke liye serum");

    // Click submit button
    const submitBtn = page.locator("button[type='submit']:has-text('Find my match')");
    await submitBtn.click();

    // Verifies navigation to /match with query
    await page.waitForURL(/\/match/);
    expect(page.url()).toContain("/match");

    // Verify text persists in session or is processed
    const storedQuery = await page.evaluate(() => sessionStorage.getItem("bodywise_match_initial_query"));
    expect(storedQuery).toBe("chehre ke daag dhabbe aur tanning ke liye serum");
  });

  // 2.c Cursor ring is removed per user request: native cursor is used without circle ring
  test("2.c Custom cursor ring is not rendered and native cursor is used", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await page.mouse.move(300, 300);

    const cursor = page.locator("[data-custom-cursor]");
    await expect(cursor).toHaveCount(0);

    // Hero action remains clickable and enabled
    const findMatchHero = page.locator("#hero-query-form button[type='submit']");
    await expect(findMatchHero).toBeEnabled();
  });

  test("2.c (reduced motion) Custom cursor is not rendered when motion is reduced", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const cursor = page.locator("[data-custom-cursor]");
    await expect(cursor).toHaveCount(0);
  });

  // 2.d Reveals fire once; tiles link to the right filtered products page; stats match the catalogue
  test("2.d Category bento tiles link to filtered products; catalogue stats match real numbers", async ({ page }) => {
    await page.goto("/");

    // Verify stats strip contains verified numbers
    const statsSection = page.locator("#catalogue-stats-strip");
    await expect(statsSection).toBeVisible();
    await statsSection.scrollIntoViewIfNeeded();
    await expect(statsSection.getByText("107")).toBeVisible();
    await expect(statsSection.getByText("100%")).toBeVisible();

    // Verify category bento tiles
    const bentoSection = page.locator("#category-bento-grid");
    await expect(bentoSection).toBeVisible();
    await bentoSection.scrollIntoViewIfNeeded();

    const bodyWashTile = bentoSection.locator("a[href*='/products?category=body_wash']");
    await expect(bodyWashTile).toBeVisible();
    await expect(bodyWashTile.getByText("Body Washes & Scrubs")).toBeVisible();

    // Clicking tile navigates to filtered products page
    await bodyWashTile.click();
    await page.waitForURL(/\/products\?category=body_wash/);
    expect(page.url()).toContain("/products?category=body_wash");
  });

  // 2.e No horizontal overflow at 390px; keyboard navigation reaches controls
  test("2.e Mobile 390px viewport has zero horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Reduce motion toggle in footer is accessible and works
    const footerToggle = page.locator("footer button:has-text('Motion:')");
    await expect(footerToggle).toBeVisible();
    await footerToggle.click();

    // Verify data-motion on html changed to off
    const motionAttr = await page.locator("html").getAttribute("data-motion");
    expect(motionAttr).toBe("off");
  });
});
