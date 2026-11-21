/**
 * Pure Product Filtering and Faceted Count Logic (Rule 2: Deterministic Matching)
 *
 * Filter rules:
 * - Different groups combine with AND.
 * - Multiple selections within a group combine with OR.
 * - Selecting "all" or an empty array clears that group's restriction.
 * - Fragrance filter:
 *   - "fragrance_free": only products with fragrance_free === true.
 *   - "other": products where fragrance_free is false or null.
 *   - "all": any fragrance status.
 */

import { ProductRecord } from "./product";
import { detectExplicitCategories } from "./data/categories";
import { CONTROLLED_GOALS } from "./goals";
import { HINGLISH_NEEDS } from "./data/synonyms.hinglish";
import { DEMO_CATALOGUE_SEED } from "./data/catalogue.seed";

export interface ProductFilterCriteria {
  search?: string;
  categories?: string[];
  formats?: string[];
  goals?: string[];
  fragrance?: string;
}

export interface ParsedFilterParams {
  search?: string;
  categories: string[];
  formats: string[];
  goals: string[];
  fragrance: string;
}

/**
 * Normalizes identifier strings (converting hyphens to underscores, lowercase)
 * so that both URL params like "face-wash" and catalogue tokens like "face_wash" match reliably.
 */
export function normalizeToken(token: string): string {
  return token.trim().toLowerCase().replace(/-/g, "_");
}

export const STOPWORDS_SET = new Set([
  // Common conversational English words
  "i", "me", "my", "myself", "we", "our", "ours", "you", "your", "yours",
  "he", "she", "it", "they", "them", "his", "her", "their",
  "is", "am", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "having",
  "do", "does", "did", "doing",
  "want", "wanted", "wants", "need", "needs", "needed", "looking", "look", "looks", "help",
  "for", "with", "from", "on", "at", "in", "into", "onto", "to", "by", "of", "about",
  "and", "or", "but", "so", "then", "than", "if", "because", "as",
  "the", "a", "an", "this", "that", "these", "those",
  "something", "anything", "everything", "nothing", "some", "any", "all", "each", "every",
  "best", "good", "better", "great", "top", "suitable", "right", "nice", "proper", "perfect",
  "suggest", "suggestion", "suggested", "recommend", "recommendation", "recommended", "please", "can", "could", "would", "should", "give",
  "product", "products", "item", "items", "options", "option", "care", "treatment", "treat", "cure", "fix", "solution", "routine",
  "lot", "lots", "much", "very", "too", "many", "more", "most", "less", "least", "excess", "excessive", "really", "quite", "extremely",
  "stay", "stays", "staying", "stayed", "remain", "remains", "remaining",
  "get", "gets", "getting", "got", "feel", "feels", "feeling", "felt",
  "always", "often", "daily", "sometimes", "usually", "constantly", "regularly", "frequently", "everyday",
  "day", "night", "morning", "evening", "time", "times",
  "severe", "bad", "terrible", "worst", "mild", "heavy",
  "problem", "problems", "issue", "issues", "trouble", "concern", "concerns",
  "which", "what", "where", "when", "why", "how", "who", "whom",
  "like", "just", "also", "still", "even", "ever", "never",
  "use", "using", "used", "apply", "applying", "applied",

  // Hinglish / Hindi postpositions, conjunctions, pronouns, adverbs & auxiliaries
  "pe", "par", "paas", "tak", "andar", "bahar", "upar", "niche",
  "bahut", "bohot", "bahot", "bhot", "zyada", "jyada", "kam", "thoda", "thodi", "thode", "bilkul", "pure", "pura", "puri", "kuch", "halka", "halki",
  "rehta", "rehti", "rehte", "rahta", "rahti", "rahte", "rahe", "raha", "rahi",
  "hota", "hoti", "hote",
  "lagta", "lagti", "lagte",
  "tha", "thi", "the",
  "hua", "hue", "hui",
  "hai", "hain", "ho", "hona", "hone",
  "karu", "karein", "karen", "kare", "karna", "karo", "kar", "karte", "karti",
  "chahta", "chahti", "chahte",
  "ka", "ki", "ke", "liye", "ko", "se", "me", "mein", "aur", "ya",
  "ilaaj", "ilaj", "upay", "tareeka", "tarika", "chahiye",
  "batao", "bataiye", "bata", "bataein", "bataao",
  "wala", "wali", "wale",
  "mera", "meri", "mere", "mujhe", "mujhko", "apna", "apni", "apne",
  "hum", "humein", "hamara", "humara", "humari",
  "aap", "aapka", "aapki", "aapke", "tum", "tumhara", "tumhari",
  "use", "unhe", "isse", "usse", "inka", "unka",
  "yeh", "ye", "woh", "wo",
  "kya", "kyun", "kyu", "kaise", "kab", "kaha", "kahan", "kitna", "kitni", "kitne",
  "kaun", "kaunsa", "kaunsi", "konsa", "konsi",
  "bhi", "toh", "to",
  "kisi", "koi", "sab", "sabse",
  "accha", "achha", "achhi", "achi", "badhiya", "sahi", "theek",
  "dikkat", "takleef", "pareshani", "wajah", "karan", "reason",
  "roz", "subah", "shaam", "din", "raat", "hamesha",
  "lagaye", "lagana", "lagao", "lagane",

  // Anatomical anchor words (unless part of specific target term)
  "chehra", "chehre", "face", "skin", "body", "hair", "baal", "sir", "gaal", "haath", "pair", "forehead", "nose", "cheeks", "back"
]);

/**
 * Pure filter function used across both the products catalogue grid and the filters dialog.
 * Guarantees that the dialog preview count always strictly equals the grid results count.
 */
export function filterProducts(
  products: ProductRecord[],
  criteria: ProductFilterCriteria
): ProductRecord[] {
  const search = criteria.search?.trim().toLowerCase() || "";
  const categories = (criteria.categories || [])
    .map(normalizeToken)
    .filter((c) => c && c !== "all");
  const formats = (criteria.formats || [])
    .map((f) => f.trim().toLowerCase())
    .filter((f) => f && f !== "all");
  const goals = (criteria.goals || [])
    .map(normalizeToken)
    .filter((g) => g && g !== "all");
  const fragrance = criteria.fragrance?.trim().toLowerCase() || "all";

  const hasStructuredFilters =
    categories.length > 0 || formats.length > 0 || goals.length > 0 || (fragrance !== "all" && fragrance.length > 0);

  // If structured filters are active and search string consists entirely of stopwords,
  // do not let conversational filler eliminate all products.
  let activeSearch = search;
  if (activeSearch.length > 0 && hasStructuredFilters) {
    const rawTokens = activeSearch.split(/\s+/).filter((t) => t.length > 0);
    const nonStopwords = rawTokens.filter((t) => !STOPWORDS_SET.has(t));
    if (nonStopwords.length === 0) {
      activeSearch = "";
    }
  }

  return products.filter((prod) => {
    // 1. Search Query Match
    if (activeSearch.length > 0) {
      const nameMatch = prod.official_name.toLowerCase().includes(activeSearch);
      const descMatch = prod.official_description.toLowerCase().includes(activeSearch);
      const catMatch = prod.category.toLowerCase().replace(/_/g, " ").includes(activeSearch);
      const formatMatch = prod.format.toLowerCase().includes(activeSearch);
      const goalsMatch = (prod.supported_goals as string[]).some((g) =>
        g.toLowerCase().replace(/_/g, " ").includes(activeSearch)
      );
      const ingredientsMatch = prod.ingredients
        ? prod.ingredients.some((ing) => ing.toLowerCase().includes(activeSearch))
        : false;

      if (!nameMatch && !descMatch && !catMatch && !formatMatch && !goalsMatch && !ingredientsMatch) {
        return false;
      }
    }

    // 2. Category Match (OR within group, AND across groups)
    if (categories.length > 0) {
      const prodCat = normalizeToken(prod.category);
      const matchesCategory = categories.some((c) => c === prodCat);
      if (!matchesCategory) return false;
    }

    // 3. Format Match (OR within group, substring match, AND across groups)
    if (formats.length > 0) {
      const prodFormat = prod.format.toLowerCase();
      const matchesFormat = formats.some((fmt) => prodFormat.includes(fmt));
      if (!matchesFormat) return false;
    }

    // 4. Goal Match (OR within group, AND across groups)
    if (goals.length > 0) {
      const prodGoals = (prod.supported_goals as string[]).map(normalizeToken);
      const matchesGoal = goals.some((goal) => prodGoals.includes(goal));
      if (!matchesGoal) return false;
    }

    // 5. Fragrance Declaration Match (Honest Wording Rule)
    if (fragrance === "fragrance_free" || fragrance === "free") {
      if (prod.fragrance_free !== true) return false;
    } else if (fragrance === "other" || fragrance === "unverified") {
      if (prod.fragrance_free === true) return false;
    }

    return true;
  });
}

export interface FacetOption {
  id: string;
}

export interface FacetCountResult {
  categories: Record<string, number>;
  formats: Record<string, number>;
  goals: Record<string, number>;
  fragrance: Record<string, number>;
}

/**
 * Computes live product counts for each chip option based on the other active filters.
 * Enables dimming/disabling chips that would yield 0 results.
 */
export function computeFacetCounts(
  products: ProductRecord[],
  current: ProductFilterCriteria,
  options: {
    categories: FacetOption[];
    formats: FacetOption[];
    goals: FacetOption[];
    fragrance: FacetOption[];
  }
): FacetCountResult {
  const result: FacetCountResult = {
    categories: {},
    formats: {},
    goals: {},
    fragrance: {},
  };

  // 1. Categories facet counts (keeping formats, goals, fragrance, search constant)
  for (const opt of options.categories) {
    if (opt.id === "all") {
      result.categories[opt.id] = filterProducts(products, {
        ...current,
        categories: [],
      }).length;
    } else {
      result.categories[opt.id] = filterProducts(products, {
        ...current,
        categories: [opt.id],
      }).length;
    }
  }

  // 2. Formats facet counts (keeping categories, goals, fragrance, search constant)
  for (const opt of options.formats) {
    if (opt.id === "all") {
      result.formats[opt.id] = filterProducts(products, {
        ...current,
        formats: [],
      }).length;
    } else {
      result.formats[opt.id] = filterProducts(products, {
        ...current,
        formats: [opt.id],
      }).length;
    }
  }

  // 3. Goals facet counts (keeping categories, formats, fragrance, search constant)
  for (const opt of options.goals) {
    if (opt.id === "all") {
      result.goals[opt.id] = filterProducts(products, {
        ...current,
        goals: [],
      }).length;
    } else {
      result.goals[opt.id] = filterProducts(products, {
        ...current,
        goals: [opt.id],
      }).length;
    }
  }

  // 4. Fragrance facet counts (keeping categories, formats, goals, search constant)
  for (const opt of options.fragrance) {
    result.fragrance[opt.id] = filterProducts(products, {
      ...current,
      fragrance: opt.id,
    }).length;
  }

  return result;
}

const FORMAT_PATTERNS = [
  { format: "gel", regex: /\b(gel)\b/i },
  { format: "liquid", regex: /\b(liquid)\b/i },
  { format: "roll-on", regex: /\b(roll[\s-]*on|roller)\b/i },
  { format: "oil", regex: /\b(hair[\s-]*oil|scalp[\s-]*oil|body[\s-]*oil)\b/i },
  { format: "cream", regex: /\b(cream|lotion|moisturizer|moisturiser|cold[\s-]*cream)\b/i },
  { format: "gummies", regex: /\b(gummies|gummy|chewables?)\b/i },
];

const FRAGRANCE_FREE_REGEX = /\b(no\s+fragrance|fragrance[\s-]free|without\s+fragrance|unscented|no\s+perfume|without\s+perfume|no\s+scent|without\s+scent|bina\s+khushbu|khushbu\s+bina|no\s+artificial\s+fragrance)\b/i;
const SCENTED_REGEX = /\b(with\s+fragrance|scented|perfumed|fragranced|khushbudar)\b/i;

/**
 * Deterministically parses free-text search (English or Hinglish) into structured product filters:
 * - Category filter: applied ONLY if user explicitly mentions a category (e.g. face wash, serum, shampoo).
 * - Goal filter: applied ONLY if user explicitly mentions a goal/concern (e.g. oiliness, acne, dark spots, hair fall).
 * - Fragrance filter: applied ONLY if user explicitly mentions fragrance (fragrance-free vs scented).
 * - Format filter: applied ONLY if user explicitly mentions format (e.g. gel, roll-on, cream, gummies).
 * - Residual keyword: any specific active ingredient (e.g. salicylic acid, niacinamide) or brand/product keyword.
 */
export function parseSearchToFilterParams(rawInput: string): ParsedFilterParams {
  const result: ParsedFilterParams = {
    categories: [],
    formats: [],
    goals: [],
    fragrance: "all",
  };

  if (!rawInput || typeof rawInput !== "string") {
    return result;
  }

  const cleanedInput = rawInput.trim();
  if (cleanedInput.length === 0) {
    return result;
  }

  const lower = cleanedInput.toLowerCase();
  const matchedSubstrings: string[] = [];

  // 1. Explicit Category Detection (Authoritative longest-match-first)
  const categoryWords = new Set<string>();
  const explicitCategories = detectExplicitCategories(cleanedInput);
  if (explicitCategories.length > 0) {
    for (const cat of explicitCategories) {
      const catText = cat.matchedText.toLowerCase();
      categoryWords.add(catText);
      categoryWords.add(cat.categoryId);
      matchedSubstrings.push(catText);
      if (cat.categoryId === "roll_on") {
        if (!result.categories.includes("serum")) result.categories.push("serum");
        if (!result.formats.includes("roll-on")) result.formats.push("roll-on");
      } else if (cat.categoryId === "moisturizer") {
        if (!result.formats.includes("cream")) result.formats.push("cream");
      } else {
        if (!result.categories.includes(cat.categoryId)) {
          result.categories.push(cat.categoryId);
        }
      }
    }
  }

  // 2. Format Detection
  for (const fmt of FORMAT_PATTERNS) {
    const match = fmt.regex.exec(cleanedInput);
    if (match) {
      matchedSubstrings.push(match[0].toLowerCase());
      if (!result.formats.includes(fmt.format)) {
        result.formats.push(fmt.format);
      }
    }
  }

  // 3. Fragrance Detection
  const ffMatch = cleanedInput.match(FRAGRANCE_FREE_REGEX);
  if (ffMatch) {
    result.fragrance = "fragrance_free";
    matchedSubstrings.push(ffMatch[0].toLowerCase());
  } else {
    const scMatch = cleanedInput.match(SCENTED_REGEX);
    if (scMatch) {
      result.fragrance = "other";
      matchedSubstrings.push(scMatch[0].toLowerCase());
    }
  }

  // 4. Goal Detection (Hinglish + English synonyms)
  const detectedGoals: Set<string> = new Set();

  const matchesPhrase = (text: string, phrase: string): boolean => {
    const p = phrase.trim().toLowerCase();
    if (!p) return false;
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
    return regex.test(text);
  };

  // Check HINGLISH_NEEDS (match all phrases so compound terms are fully extracted)
  for (const [key, synonyms] of Object.entries(HINGLISH_NEEDS)) {
    const canonicalGoal = key === "hydration" ? "hydration_barrier" : key;
    for (const syn of synonyms) {
      if (categoryWords.has(syn.toLowerCase())) continue;
      if (matchesPhrase(lower, syn)) {
        detectedGoals.add(canonicalGoal);
        matchedSubstrings.push(syn.toLowerCase());
      }
    }
  }

  // Check CONTROLLED_GOALS definitions
  for (const goal of CONTROLLED_GOALS) {
    for (const syn of goal.synonyms) {
      if (categoryWords.has(syn.toLowerCase())) continue;
      if (matchesPhrase(lower, syn)) {
        detectedGoals.add(goal.id);
        matchedSubstrings.push(syn.toLowerCase());
      }
    }

    if (!categoryWords.has(goal.label.toLowerCase()) && matchesPhrase(lower, goal.label)) {
      detectedGoals.add(goal.id);
      matchedSubstrings.push(goal.label.toLowerCase());
    }
  }

  // Additional high-frequency Hinglish & English health/beauty concern terms
  const ADDITIONAL_CONCERN_SETS: { goalId: string; terms: string[] }[] = [
    {
      goalId: "oil_control",
      terms: [
        "oily", "tel", "greasy", "grease", "sebum", "chipchipa", "chipchipi",
        "shiny face", "open pores", "blackhead", "blackheads", "oily face", "oily skin"
      ],
    },
    {
      goalId: "dark_spots_look",
      terms: [
        "daag", "dhabbe", "dark spots", "dark spot", "pigmentation", "kale nishaan",
        "jhaiya", "blemishes", "acne marks"
      ],
    },
    {
      goalId: "body_bumps_look",
      terms: [
        "strawberry legs", "body bumps", "back bumps", "rough bumps", "dana", "dane",
        "back acne", "body acne", "butt bumps", "bumps", "pimples"
      ],
    },
    {
      goalId: "hair_fall_appearance",
      terms: [
        "hair fall", "hairfall", "baal jhadna", "baal jhad rahe", "comb me baal",
        "baal tutna", "hair loss"
      ],
    },
    {
      goalId: "scalp_comfort",
      terms: [
        "dandruff", "rusi", "khujli", "itching", "itchy", "flaky scalp",
        "scalp itch", "dry scalp"
      ],
    },
    {
      goalId: "sun_protection",
      terms: [
        "uv protection", "sun shield", "broad spectrum", "daily spf",
        "dhoop", "tanning", "tan", "de-tan", "sun damage"
      ],
    },
  ];

  for (const set of ADDITIONAL_CONCERN_SETS) {
    for (const term of set.terms) {
      if (categoryWords.has(term)) continue;
      if (matchesPhrase(lower, term)) {
        detectedGoals.add(set.goalId);
        matchedSubstrings.push(term.toLowerCase());
      }
    }
  }

  result.goals = Array.from(detectedGoals);

  // 5. Residual Search Term Computation
  let residual = lower;
  // Sort matched substrings by length descending to replace multi-word terms first
  const sortedMatched = Array.from(new Set(matchedSubstrings)).sort((a, b) => b.length - a.length);
  for (const sub of sortedMatched) {
    if (!sub) continue;
    const escaped = sub.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    residual = residual.replace(new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "gi"), " ");
  }

  const residualTokens = residual
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS_SET.has(t));

  const hasStructuredFilters =
    result.categories.length > 0 ||
    result.goals.length > 0 ||
    result.formats.length > 0 ||
    (result.fragrance !== "all" && result.fragrance.length > 0);

  if (residualTokens.length > 0) {
    const candidateSearch = residualTokens.join(" ");

    if (hasStructuredFilters) {
      // If structured filters were recognized, residual text must ONLY be retained as a search constraint
      // if it does NOT break the filter to 0 matches AND represents genuine catalogue facts (e.g. ingredients or names).
      const candidateMatches = filterProducts(DEMO_CATALOGUE_SEED, {
        ...result,
        search: candidateSearch,
      });

      if (candidateMatches.length > 0) {
        result.search = candidateSearch;
      } else {
        // Test if any individual token or ingredient sub-phrase in residualTokens matches products with the filter
        const validTokens = residualTokens.filter((token) => {
          return DEMO_CATALOGUE_SEED.some((prod) => {
            const inName = prod.official_name.toLowerCase().includes(token);
            const inDesc = prod.official_description.toLowerCase().includes(token);
            const inIngs = prod.ingredients?.some((ing) => ing.toLowerCase().includes(token));
            return inName || inDesc || inIngs;
          });
        });

        if (validTokens.length > 0) {
          const refinedSearch = validTokens.join(" ");
          const refinedMatches = filterProducts(DEMO_CATALOGUE_SEED, {
            ...result,
            search: refinedSearch,
          });
          if (refinedMatches.length > 0) {
            result.search = refinedSearch;
          }
        }
        // If candidateSearch does not match any products alongside active filters,
        // do not set result.search so active filters are not broken to 0 results!
      }
    } else {
      // No structured filters detected; user typed a freeform search query
      result.search = candidateSearch;
    }
  }

  return result;
}
