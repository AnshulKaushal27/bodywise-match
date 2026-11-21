/**
 * Filter Intent Service for Bodywise Match
 *
 * Uses Groq LLM to intelligently understand user search & filter intent.
 * Intelligently discriminates between:
 * 1. "exact_name": Specific product names, brand terms, or active ingredients (e.g. "Folli Advanced", "Salicylic Acid Body Wash", "Niacinamide").
 * 2. "concern_intent": Free-text physical concerns or goals in English, Hindi, or Hinglish (e.g. "mere baal kam ho rhe hain", "skin pe bahut tel rehta hai", "strawberry legs").
 *    Extracts structured goals/categories without leaving behind broken search keywords (like "rhe" or "pe").
 * 3. "filter_modification": Direct filter adjustments (e.g. "fragrance-free only", "clear category").
 *
 * Falls back cleanly to deterministic catalogue lookup when LLM is offline, disabled, or unavailable.
 */

import { z } from "zod";
import {
  ProductFilterCriteria,
  CONTROLLED_GOALS,
  CATALOGUE_CATEGORIES,
  DEMO_CATALOGUE_SEED,
  normalizeToken,
} from "@bodywise/shared";
import { callGroqChatCompletion } from "../llm/groqClient";
import { getConfig } from "../config";

export interface ParseFilterIntentInput {
  query: string;
  active_filters?: ProductFilterCriteria;
  requestId?: string;
}

export interface ParseFilterIntentOutput {
  request_id: string;
  intent_type: "exact_name" | "concern_intent" | "filter_modification";
  criteria: {
    search?: string;
    categories: string[];
    formats: string[];
    goals: string[];
    fragrance: string;
  };
  explanation: string;
  source: "llm" | "fallback";
}

const FilterIntentResponseSchema = z.object({
  intent_type: z.enum(["exact_name", "concern_intent", "filter_modification"]),
  search: z.string().nullable().optional(),
  categories: z.array(z.string()).default([]),
  formats: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  fragrance: z.enum(["all", "fragrance_free", "other"]).default("all"),
  explanation: z.string().default(""),
});

const VALID_CATEGORIES = new Set([
  "body_wash",
  "face_wash",
  "moisturizer",
  "serum",
  "roll_on",
  "shampoo",
  "conditioner",
  "sunscreen",
  "supplement",
  "kit",
  "accessory",
]);

const VALID_FORMATS = new Set([
  "liquid",
  "gel",
  "cream",
  "serum",
  "roll-on",
  "spray",
  "gummies",
  "scrub",
]);

const VALID_GOALS = new Set<string>(CONTROLLED_GOALS.map((g) => g.id));

const FILTER_INTENT_SYSTEM_PROMPT = `You are an expert product discovery & filter intent parser for Be Bodywise (a personal care brand with skincare, haircare, and bodycare).
Analyze the user's search query together with their active filters, and determine what structured filters to set.

TAXONOMY REFERENCE:
Categories (must match exactly or omit):
- "body_wash" (body wash, shower gel, exfoliating body scrub)
- "face_wash" (face wash, facial cleanser)
- "moisturizer" (body lotion, face moisturizer, ceramide cream, urea lotion)
- "serum" (hair growth serum, scalp serum, lash serum, face serum)
- "roll_on" (underarm roll-on deodorant, 20%/30% Urea foot roll-on for cracked heels/feet)
- "shampoo" (anti-dandruff shampoo, clarifying shampoo)
- "conditioner" (hair conditioner)
- "sunscreen" (sunscreen lotion, spf spray, mineral sunscreen)
- "supplement" (biotin hair gummies, collagen, multivitamins)
- "kit" (routine pack, duo, trio, hair fall kit, strawberry skin kit, heel repair kit)
- "accessory" (ice roller, face razor, scalp massager)

Formats (must match exactly or omit):
"liquid", "gel", "cream", "serum", "roll-on", "spray", "gummies", "scrub"

Controlled Goals (must match exactly or omit):
- "oil_control": Excess oil, shiny skin, open pores, sebum, chipchipa face
- "hair_fall_appearance": Hair fall, shedding, hair loss, baal jhadna, baal girna, comb me baal
- "hair_density_appearance": Thinning hair, wide parting, hairline density, baal kam ho rahe, baal kam ho rhe, baal kam hona, patle baal
- "scalp_comfort": Dandruff, rusi, flaky scalp, itchy scalp, khujli
- "body_bumps_look": Strawberry legs, body bumps, back acne, rough bumps, dane
- "rough_texture_smoothing": Rough skin texture, coarse bumpy skin, cracked heels, fati aedi, pair ki aedi, paer ki aedi, dry rough feet, heel repair (primary match: Urea Foot Roll-On under "roll_on")
- "underarm_odor_freshness": Underarm odor, smell, freshness, badbu, pasina
- "underarm_texture_smoothing": Dark underarms, uneven underarm skin
- "sun_protection": Sun defense, tanning, UV rays, dhoop
- "hydration_barrier": Dry skin, tight skin, flakiness, moisture barrier
- "dark_spots_look": Dark spots, pigmentation, acne marks, blemishes, daag dhabbe
- "frizz_control": Frizzy hair, flyaways, smoothing rough hair

Fragrance:
"all" (default), "fragrance_free", "other"

DECISION RULES:
1. INTENT TYPE:
   - "exact_name": When the user is typing a specific product name, brand term, or active ingredient (e.g. "Folli Advanced", "Salicylic Acid Body Wash", "Niacinamide", "Ice Roller", "Anti Hair Fall Kit", "Biotin Gummies", "Urea Foot Roll On").
     Set "search" to the specific keyword, ingredient, or product name.
   - "concern_intent": When the user describes a problem, concern, or wellness need in English, Hindi, or Hinglish (e.g. "mere baal kam ho rhe hain", "skin pe bahut tel rehta hai", "strawberry legs", "underarm smell", "paer ki aedi fati hui hai").
     CRITICAL: Set "search" to null! Do NOT put conversational filler words (like "mere", "baal", "kam", "rhe", "pe", "rehta", etc.) into "search", because searching for conversational filler words in product names returns 0 products!
     Instead, translate the user's intent into the appropriate "goals" and/or "categories".
   - "filter_modification": When the user modifies filters directly (e.g. "fragrance-free only", "clear category").

2. MULTI-LINGUAL RECOGNITION (Hindi/Hinglish):
   - "paer ki aedi fati hui hai" / "pair ki aedi fati" / "fati aedi" / "cracked heels" / "dry rough heels" -> intent_type: "concern_intent", categories: ["roll_on"], formats: ["roll-on"], goals: ["rough_texture_smoothing"], search: null (CRITICAL: Be Bodywise's primary targeted formulation for cracked heels and fati aedi is the 20%/30% Urea Foot Roll-On under "roll_on", not regular body moisturizer!)
   - "mere baal kam ho rhe hain" / "baal kam ho rahe hain" -> intent_type: "concern_intent", goals: ["hair_fall_appearance", "hair_density_appearance"], search: null
   - "skin pe bahut tel rehta hai" / "chehra chipchipa rehta hai" -> intent_type: "concern_intent", goals: ["oil_control"], search: null
   - "khujli aur dandruff" -> intent_type: "concern_intent", goals: ["scalp_comfort"], search: null
   - "strawberry legs" / "pairon pe dane" -> intent_type: "concern_intent", goals: ["body_bumps_look"], search: null

OUTPUT JSON ONLY. Strict schema:
{
  "intent_type": "exact_name" | "concern_intent" | "filter_modification",
  "search": string | null,
  "categories": string[],
  "formats": string[],
  "goals": string[],
  "fragrance": "all" | "fragrance_free" | "other",
  "explanation": "brief 1-sentence explanation"
}`;

/**
 * Clean deterministic fallback for when LLM is unavailable or unconfigured.
 * Matches catalogue titles, ingredients, and explicit category/goal tokens cleanly without fragile stopword surgery.
 */
export function fallbackParseFilterIntent(
  query: string,
  activeFilters?: ProductFilterCriteria
): ParseFilterIntentOutput {
  const cleaned = query.trim();
  const lower = cleaned.toLowerCase();

  const categories: string[] = activeFilters?.categories ? [...activeFilters.categories] : [];
  const formats: string[] = activeFilters?.formats ? [...activeFilters.formats] : [];
  const goals: string[] = activeFilters?.goals ? [...activeFilters.goals] : [];
  let fragrance = activeFilters?.fragrance || "all";
  let search: string | undefined = undefined;
  let intentType: "exact_name" | "concern_intent" | "filter_modification" = "concern_intent";

  // 1. Direct Category Match
  for (const cat of CATALOGUE_CATEGORIES) {
    if (lower.includes(cat.displayLabel.toLowerCase()) || lower.includes(cat.id.replace(/_/g, " "))) {
      if (!categories.includes(cat.id)) categories.push(cat.id);
    }
  }

  // 2. Direct Format Match
  for (const fmt of Array.from(VALID_FORMATS)) {
    if (lower.includes(fmt)) {
      if (!formats.includes(fmt)) formats.push(fmt);
    }
  }

  // 3. Direct Fragrance Match
  if (lower.includes("fragrance free") || lower.includes("unscented")) {
    fragrance = "fragrance_free";
  }

  // 4. Exact Product Name or Ingredient Match in Catalogue
  const matchesCatalogueProduct = DEMO_CATALOGUE_SEED.some((p) => {
    const nameMatch = p.official_name.toLowerCase().includes(lower);
    const ingMatch = p.ingredients?.some((ing) => lower.includes(ing.toLowerCase()) || ing.toLowerCase().includes(lower));
    return nameMatch || ingMatch;
  });

  if (matchesCatalogueProduct && lower.length >= 3) {
    intentType = "exact_name";
    search = cleaned;
  } else {
    // 5. Goal Mapping from common terms (English + Hindi)
    if (
      lower.includes("hair fall") ||
      lower.includes("hairfall") ||
      lower.includes("baal kam") ||
      lower.includes("baal jhad") ||
      lower.includes("baal gir") ||
      lower.includes("shedding")
    ) {
      if (!goals.includes("hair_fall_appearance")) goals.push("hair_fall_appearance");
      if (!goals.includes("hair_density_appearance")) goals.push("hair_density_appearance");
      search = undefined;
    } else if (
      lower.includes("oil") ||
      lower.includes("tel") ||
      lower.includes("chipchip") ||
      lower.includes("greas") ||
      lower.includes("sebum") ||
      lower.includes("pore")
    ) {
      if (!goals.includes("oil_control")) goals.push("oil_control");
      search = undefined;
    } else if (lower.includes("dandruff") || lower.includes("rusi") || lower.includes("khujli") || lower.includes("itch")) {
      if (!goals.includes("scalp_comfort")) goals.push("scalp_comfort");
      search = undefined;
    } else if (lower.includes("strawberry") || lower.includes("bump") || lower.includes("dana") || lower.includes("dane")) {
      if (!goals.includes("body_bumps_look")) goals.push("body_bumps_look");
      search = undefined;
    } else if (
      lower.includes("aedi") ||
      lower.includes("aidi") ||
      lower.includes("heel") ||
      lower.includes("feet") ||
      lower.includes("foot") ||
      (lower.includes("pair") && lower.includes("fat")) ||
      (lower.includes("paer") && lower.includes("fat"))
    ) {
      if (!categories.includes("roll_on")) categories.push("roll_on");
      if (!formats.includes("roll-on")) formats.push("roll-on");
      if (!goals.includes("rough_texture_smoothing")) goals.push("rough_texture_smoothing");
      search = undefined;
    } else if (lower.includes("tan") || lower.includes("sun") || lower.includes("dhoop") || lower.includes("spf")) {
      if (!goals.includes("sun_protection")) goals.push("sun_protection");
      search = undefined;
    } else {
      // Freeform specific search term
      intentType = "exact_name";
      search = cleaned;
    }
  }

  return {
    request_id: "fallback",
    intent_type: intentType,
    criteria: {
      search,
      categories,
      formats,
      goals,
      fragrance,
    },
    explanation: "Fallback deterministic rule evaluation applied.",
    source: "fallback",
  };
}

export async function parseFilterIntent(
  input: ParseFilterIntentInput
): Promise<ParseFilterIntentOutput> {
  const reqId = input.requestId || "unknown";
  const query = input.query.trim();

  if (!query) {
    return {
      request_id: reqId,
      intent_type: "filter_modification",
      criteria: {
        search: undefined,
        categories: input.active_filters?.categories || [],
        formats: input.active_filters?.formats || [],
        goals: input.active_filters?.goals || [],
        fragrance: input.active_filters?.fragrance || "all",
      },
      explanation: "Empty query provided.",
      source: "fallback",
    };
  }

  const config = getConfig();
  const isLlmEnabled = Boolean(config.llm.apiKey && process.env.LLM_ENABLED !== "false");

  if (!isLlmEnabled) {
    const fallback = fallbackParseFilterIntent(query, input.active_filters);
    return {
      ...fallback,
      request_id: reqId,
    };
  }

  try {
    const userPayload = JSON.stringify({
      user_query: query,
      active_filters: input.active_filters || {},
    });

    const completion = await callGroqChatCompletion({
      messages: [
        { role: "system", content: FILTER_INTENT_SYSTEM_PROMPT },
        { role: "user", content: userPayload },
      ],
      temperature: 0,
      max_tokens: 350,
      response_format: { type: "json_object" },
      timeoutMs: 4000,
    });

    const parsedJson = JSON.parse(completion.content);
    const validated = FilterIntentResponseSchema.parse(parsedJson);

    // Sanitize values against catalogue taxonomy
    const safeCategories = validated.categories
      .map(normalizeToken)
      .filter((c) => VALID_CATEGORIES.has(c));

    const safeFormats = validated.formats
      .map((f) => f.trim().toLowerCase())
      .filter((f) => VALID_FORMATS.has(f));

    const safeGoals = validated.goals
      .map(normalizeToken)
      .filter((g) => VALID_GOALS.has(g));

    const safeSearch =
      validated.search && validated.search.trim().length > 0
        ? validated.search.trim()
        : undefined;

    return {
      request_id: reqId,
      intent_type: validated.intent_type,
      criteria: {
        search: safeSearch,
        categories: safeCategories,
        formats: safeFormats,
        goals: safeGoals,
        fragrance: validated.fragrance,
      },
      explanation: validated.explanation || "Interpreted via Groq LLM filter intent pipeline.",
      source: "llm",
    };
  } catch {
    // Graceful fallback to deterministic matcher
    const fallback = fallbackParseFilterIntent(query, input.active_filters);
    return {
      ...fallback,
      request_id: reqId,
    };
  }
}
