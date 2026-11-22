import {
  ScannedProductInfo,
  ScannedProductInfoSchema,
  VisualScanResult,
  matchSimilarBodywiseProducts,
  DEMO_CATALOGUE_SEED,
} from "@bodywise/shared";
import { getGroqConfig, callGroqVisionCompletion } from "./groq";

export const PRESET_PRODUCTS: Record<string, ScannedProductInfo> = {
  "minimalist-salicylic-face-wash": {
    is_product_detected: true,
    brand: "Minimalist",
    product_name: "Minimalist 2% Salicylic Acid Cleanser",
    category: "face_wash",
    format: "Gel / Foaming cleanser",
    active_ingredients: ["Salicylic Acid", "LHA", "Zinc PCA"],
    primary_concerns: ["Acne", "Oil control", "Blackheads", "Clogged pores"],
    summary:
      "A daily gentle exfoliating face wash formulated with 2% Salicylic Acid and LHA for acne reduction and oil balance.",
  },
  "minimalist-niacinamide-serum": {
    is_product_detected: true,
    brand: "Minimalist",
    product_name: "Minimalist 10% Niacinamide Serum",
    category: "serum",
    format: "Serum",
    active_ingredients: ["Niacinamide", "Zinc PCA"],
    primary_concerns: ["Dark spots", "Open pores", "Uneven texture", "Blemish marks"],
    summary:
      "A high-strength nourishing serum containing 10% pure Niacinamide to fade dark spots and reduce pore appearance.",
  },
  "minimalist-spf50-sunscreen": {
    is_product_detected: true,
    brand: "Minimalist",
    product_name: "Minimalist SPF 50 Multi-Vitamin Sunscreen",
    category: "sunscreen",
    format: "Lotion",
    active_ingredients: ["Avobenzone", "Octocrylene", "Niacinamide", "Vitamin F"],
    primary_concerns: ["Sun protection", "UV damage", "Tanning", "Photoaging"],
    summary:
      "A broad-spectrum SPF 50 PA++++ sunscreen lotion providing head-to-toe UVA/UVB protection without white cast.",
  },
  "sebamed-anti-dandruff-shampoo": {
    is_product_detected: true,
    brand: "Sebamed",
    product_name: "Sebamed Anti-Dandruff Shampoo",
    category: "shampoo",
    format: "Liquid shampoo",
    active_ingredients: ["Piroctone Olamine", "Ketoconazole"],
    primary_concerns: ["Dandruff", "Flaky scalp", "Scalp itching"],
    summary:
      "A gentle cleansing shampoo targeting visible scalp flakes and fungal irritation with active dandruff blockers.",
  },
  "cetaphil-gentle-cleanser": {
    is_product_detected: true,
    brand: "Cetaphil",
    product_name: "Cetaphil Gentle Skin Cleanser",
    category: "face_wash",
    format: "Cream / Lotion cleanser",
    active_ingredients: ["Glycerin", "Niacinamide", "Panthenol"],
    primary_concerns: ["Dry skin", "Sensitive barrier", "Gentle daily cleansing"],
    summary:
      "A non-foaming hydrating face cleanser designed for sensitive, dry skin to preserve the natural moisture barrier.",
  },
};

const VISION_SYSTEM_PROMPT = `You are an expert cosmetic and personal care formulation analyst.
Carefully inspect this image.
First determine: does this image clearly show a cosmetic, personal care, skincare, haircare, body care, or wellness product (such as a bottle, tube, jar, tub, pump, spray, or carton)?
If NOT (for example: a person, room, wall, ceiling, clothes, furniture, random object, animal, food, or extremely blurry/unreadable image), you MUST set "is_product_detected": false.

Extract the product details into valid JSON with these exact keys:
- is_product_detected: boolean (true if a cosmetic/personal care product bottle or packaging is clearly visible and readable; false otherwise)
- brand: string (brand name if detected, e.g. "Minimalist", "The Ordinary", "Cetaphil", "Neutrogena", or "Unknown")
- product_name: string (full product name if detected, e.g. "Minimalist 2% Salicylic Acid Face Wash", or "Unknown")
- category: string (one of: face_wash, body_wash, shampoo, conditioner, serum, lotion, moisturizer, sunscreen, roll_on, scrub, gummies, kit, oil, or "unknown")
- format: string (e.g. "Gel / Foaming cleanser", "Liquid body wash", "Serum", "Lotion", "Liquid shampoo", "Spray", or "unknown")
- active_ingredients: string[] (key visible actives, e.g. ["Salicylic Acid", "Niacinamide"], or empty array [])
- primary_concerns: string[] (e.g. ["acne", "oil control", "dandruff"], or empty array [])
- summary: string (one clear factual sentence: describing what product was detected, OR stating clearly that no cosmetic/wellness product could be identified)

Output ONLY valid JSON. No surrounding markdown backticks.`;

export async function processVisualScan(options: {
  imageBase64?: string;
  preset?: string;
}): Promise<VisualScanResult> {
  const startTime = Date.now();
  const cfg = getGroqConfig();

  let scanned: ScannedProductInfo | null = null;

  // 1. Check if user selected a verified preset
  if (options.preset && PRESET_PRODUCTS[options.preset]) {
    scanned = PRESET_PRODUCTS[options.preset];
  }

  // 2. If real image provided, call Groq Vision LLM
  if (!scanned && options.imageBase64) {
    if (cfg.apiKey) {
      try {
        const result = await callGroqVisionCompletion({
          imageBase64: options.imageBase64,
          prompt: VISION_SYSTEM_PROMPT,
          model: "qwen/qwen3.8-27b",
          timeoutMs: 20000,
        });

        const rawContent = result.content;
        const cleaned = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsedJson = JSON.parse(cleaned);
        const validated = ScannedProductInfoSchema.safeParse(parsedJson);

        if (validated.success) {
          scanned = validated.data;
          // Guardrail: if brand is Unknown and no actives were found, mark as not detected
          if (
            scanned.brand.toLowerCase() === "unknown" &&
            scanned.active_ingredients.length === 0
          ) {
            scanned.is_product_detected = false;
          }
        }
      } catch (err: unknown) {
        // Redact any sensitive info, never log image data (Rule 8)
        console.error(
          "[VisualScan] Vision LLM processing encountered an error:",
          err instanceof Error ? err.message : "Unknown error"
        );
      }
    } else {
      console.warn("[VisualScan] GROQ_API_KEY is not configured for Vision LLM");
    }

    // If an image was submitted but could not be parsed, mark as not detected (NEVER fake a preset)
    if (!scanned) {
      const summaryMsg = !cfg.apiKey
        ? "AI Vision is currently unavailable because the Groq API key is not configured on this deployment. Please select a sample product preset below."
        : "The image did not contain a clear, readable cosmetic or wellness product bottle.";

      scanned = {
        is_product_detected: false,
        brand: "Unknown",
        product_name: "No product detected",
        category: "unknown",
        format: "unknown",
        active_ingredients: [],
        primary_concerns: [],
        summary: summaryMsg,
      };
    }
  }

  // 3. Fallback to default demo preset ONLY if NO image and NO preset were provided at all
  if (!scanned) {
    scanned = PRESET_PRODUCTS["minimalist-salicylic-face-wash"];
  }

  // 4. Deterministic rules matching against Be Bodywise catalogue (Rule 2)
  const matches = matchSimilarBodywiseProducts(scanned, DEMO_CATALOGUE_SEED);

  // 5. Generate transparent explanation
  let explanation = "";
  if (!scanned.is_product_detected || matches.length === 0) {
    explanation = !cfg.apiKey && options.imageBase64
      ? "AI Vision analysis could not run because the Groq API key is not configured on this deployment. Please select a preset below to test visual matching."
      : "No cosmetic or wellness product could be identified in this image. Please position your product bottle clearly within the camera frame.";
  } else {
    const activeList =
      scanned.active_ingredients.length > 0
        ? scanned.active_ingredients.join(", ")
        : "targeted active ingredients";
    const displayName = scanned.product_name
      .toLowerCase()
      .startsWith(scanned.brand.toLowerCase())
      ? scanned.product_name
      : `${scanned.brand} ${scanned.product_name}`;
    explanation = `We detected ${displayName} (${scanned.category.replace(/_/g, " ")}). Based on key active ingredients (${activeList}) and wellness goals, here are the closest Be Bodywise catalogue alternatives.`;
  }

  const latencyMs = Date.now() - startTime;

  return {
    scanned_product: scanned,
    explanation,
    matches,
    latency_ms: latencyMs,
  };
}
