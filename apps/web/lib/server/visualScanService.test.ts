import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { processVisualScan } from "./visualScanService";

describe("processVisualScan Service", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns verified preset data when a valid preset id is provided", async () => {
    const result = await processVisualScan({
      preset: "minimalist-niacinamide-serum",
    });

    expect(result.scanned_product.brand).toBe("Minimalist");
    expect(result.scanned_product.product_name).toContain("Niacinamide");
    expect(result.scanned_product.category).toBe("serum");
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.explanation).toContain("Minimalist");
  });

  it("handles unrecognized presets by falling back to default preset", async () => {
    const result = await processVisualScan({
      preset: "non-existent-preset",
    });

    expect(result.scanned_product.brand).toBe("Minimalist");
    expect(result.scanned_product.product_name).toContain("Salicylic");
  });

  it("returns honest undetected state when an image is analyzed and vision finds no cosmetic product", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_valid_key";

    // Mock Vision LLM returning no product detected
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                is_product_detected: false,
                brand: "Unknown",
                product_name: "No product detected",
                category: "unknown",
                format: "unknown",
                active_ingredients: [],
                primary_concerns: [],
                summary: "The image did not contain a readable cosmetic product bottle.",
              }),
            },
          },
        ],
      }),
    });

    const result = await processVisualScan({
      imageBase64: "data:image/jpeg;base64,mockimagedata",
    });

    expect(result.scanned_product.is_product_detected).toBe(false);
    expect(result.matches).toHaveLength(0);
    expect(result.explanation).toContain("No cosmetic or wellness product could be identified");
  });

  it("identifies a competitor product and matches Be Bodywise equivalents when vision succeeds", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_valid_key";

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                is_product_detected: true,
                brand: "The Ordinary",
                product_name: "The Ordinary 2% Salicylic Acid Masque",
                category: "face_wash",
                format: "Cream / Mask",
                active_ingredients: ["Salicylic Acid"],
                primary_concerns: ["Acne", "Clogged pores"],
                summary: "A clarifying formulation targeting pore congestion with Salicylic Acid.",
              }),
            },
          },
        ],
      }),
    });

    const result = await processVisualScan({
      imageBase64: "data:image/jpeg;base64,mocktheordinary",
    });

    expect(result.scanned_product.is_product_detected).toBe(true);
    expect(result.scanned_product.brand).toBe("The Ordinary");
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches.some((m) => m.shared_ingredients.includes("salicylic acid"))).toBe(true);
  });
});
