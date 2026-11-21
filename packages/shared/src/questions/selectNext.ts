/**
 * Catalogue-Driven Deterministic Question Selector
 * Computes information gain over candidate product families and prioritizes questions
 * using configured weights. Never repeats known information. Zero LLM hallucination (Section E).
 */

import { ProductRecord } from "../product";
import { CatalogFamily } from "../families";
import { MatchSessionState, SessionFacetId, SessionLanguage } from "../matchSession/types";
import { detectBodyArea, detectTimeOfDay } from "../scripts/catalogue-facets";
import { computeShortlist } from "../matcher/shortlist";
import { QUESTION_FACET_WEIGHTS } from "../matcher/matcher.config";
import { getImplicationsForCategory } from "../data/categoryMap";
import { CONCEPTS_BY_ID } from "../retrieval/concepts";
import { CatalogueCategoryId, formatCategoryLabel } from "../data/categories";

export interface SessionQuestionOption {
  id: string;
  label: string;
  count: number;
  value: unknown;
  isAny?: boolean;
}

export interface SelectNextQuestionResult {
  done: boolean;
  facet?: SessionFacetId;
  question?: string;
  whyAsking?: string;
  options?: SessionQuestionOption[];
  candidateCount: number;
  remainingCandidates?: number;
  askedCount: number;
}

interface QuestionTemplate {
  en: { question: string; why: string };
  "hi-latn": { question: string; why: string };
}

const QUESTION_TEMPLATES: Record<SessionFacetId, QuestionTemplate> = {
  body_area: {
    en: {
      question: "Where will you use this product?",
      why: "Your matches include options for different body areas.",
    },
    "hi-latn": {
      question: "Aap ise kahan lagayenge?",
      why: "Aapke matches me chehre aur sharir dono ke vikalp hain.",
    },
  },
  product_type: {
    en: {
      question: "What kind of product are you looking for?",
      why: "Selecting a product category focuses your matches immediately.",
    },
    "hi-latn": {
      question: "Aap kis tarah ka product dhoondh rahe hain?",
      why: "Product category select karne se shortlist turant focus ho jayegi.",
    },
  },
  need_confirm: {
    en: {
      question: "Which matters most to you?",
      why: "Different products in this category focus on different active benefits.",
    },
    "hi-latn": {
      question: "Aapke liye sabse zaroori kya hai?",
      why: "Is category ke products alag-alag benefits ke liye hain.",
    },
  },
  time_of_day: {
    en: {
      question: "When will you use it?",
      why: "Your matches include both day and night products.",
    },
    "hi-latn": {
      question: "Ise kab lagayenge?",
      why: "Aapke matches me din aur raat dono ke products shamil hain.",
    },
  },
  format: {
    en: {
      question: "Which format or texture do you prefer?",
      why: "Different textures are available for your goal.",
    },
    "hi-latn": {
      question: "Aapko konsa texture ya format pasand hai?",
      why: "Aapke goal ke liye alag-alag formats uplabdh hain.",
    },
  },
  fragrance_pref: {
    en: {
      question: "Do you prefer fragrance-free formulations?",
      why: "Your shortlist includes both fragrance-free and standard options.",
    },
    "hi-latn": {
      question: "Kya aap fragrance-free product chahte hain?",
      why: "Aapke shortlist me bina khushbu aur khushbudar dono hain.",
    },
  },
  frequency: {
    en: {
      question: "How often will you be using this?",
      why: "Some products are formulated for daily use, others for occasional care.",
    },
    "hi-latn": {
      question: "Aap ise kitni baar istemal karenge?",
      why: "Kuch products roz ke liye hote hain aur kuch kabhi-kabhi ke liye.",
    },
  },
  avoidances: {
    en: {
      question: "Are there ingredients you prefer to avoid?",
      why: "We can filter out products containing specific ingredients.",
    },
    "hi-latn": {
      question: "Kya koi aisa ingredient hai jise aap avoid karna chahte hain?",
      why: "Hum un ingredients wale products ko hata sakte hain.",
    },
  },
};

/**
 * Filter catalogue candidates based on confirmed slots using computeShortlist.
 * Guarantees 100% agreement between question counts and live preview.
 */
export function getCandidateFamiliesForSession(
  state: MatchSessionState,
  catalogue: ProductRecord[]
): CatalogFamily[] {
  const shortlist = computeShortlist(state, catalogue);

  return shortlist.topFamilies.map((tf) => ({
    familyId: tf.familyId,
    canonical_name: tf.canonical_name,
    slug: tf.primaryProduct.slug,
    category: tf.category,
    format: tf.format,
    primaryProduct: tf.primaryProduct,
    variants: [],
    allProductIds: [tf.primaryProduct.id],
  }));
}

/**
 * Catalogue-driven question selector with information gain and priority weights (Section E).
 */
export function selectNext(
  state: MatchSessionState,
  catalogue: ProductRecord[]
): SelectNextQuestionResult {
  const candidateFamilies = getCandidateFamiliesForSession(state, catalogue);
  const total = candidateFamilies.length;

  // Stop conditions:
  // 1. questionCount reaches 3 (shared cap of 3 questions)
  // 2. candidate families <= 1
  if (state.questionCount >= 3 || total <= 1) {
    return {
      done: true,
      candidateCount: total,
      askedCount: state.questionCount,
    };
  }

  interface EvaluatedFacet {
    facetId: SessionFacetId;
    score: number;
    options: SessionQuestionOption[];
    questionText?: string;
    whyAsking: string;
  }

  const evaluated: EvaluatedFacet[] = [];
  const lang: SessionLanguage = state.language || "en";
  const confirmedCategory = state.slots.product_type.value as CatalogueCategoryId | null;
  const implications = confirmedCategory ? getImplicationsForCategory(confirmedCategory) : null;

  // =========================================================================
  // 1. CATEGORY / PRODUCT_TYPE (Tier 1, Weight 1.0)
  // Asked ONLY if unknown (Rule 1: No category named -> first question asks category)
  // =========================================================================
  if (
    !confirmedCategory &&
    state.slots.product_type.status !== "confirmed" &&
    !state.askedQuestions.includes("product_type")
  ) {
    const buckets = new Map<CatalogueCategoryId, number>();
    for (const fam of candidateFamilies) {
      const cat = fam.primaryProduct.category as CatalogueCategoryId;
      buckets.set(cat, (buckets.get(cat) || 0) + 1);
    }

    if (buckets.size >= 2) {
      const counts = Array.from(buckets.values());
      const sumSq = counts.reduce((acc, c) => acc + Math.pow(c / total, 2), 0);
      const gini = 1 - sumSq;
      const score = gini * QUESTION_FACET_WEIGHTS.category;

      const options: SessionQuestionOption[] = Array.from(buckets.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, count]) => {
          const label = formatCategoryLabel(cat);
          return {
            id: cat,
            label: `${label} (${count})`,
            count,
            value: cat,
          };
        });

      options.push({
        id: "any",
        label: lang === "hi-latn" ? "Koi bhi category" : "Any / not sure",
        count: total,
        value: null,
        isAny: true,
      });

      evaluated.push({
        facetId: "product_type",
        score,
        options,
        whyAsking: QUESTION_TEMPLATES.product_type[lang].why,
      });
    }
  }

  // Category implications for body area
  const isAreaDerivedOrImplied = Boolean(
    implications?.derivedBodyArea || state.slots.body_area.source === "derived"
  );
  const isAreaConfirmedOrImplied = Boolean(
    isAreaDerivedOrImplied ||
    state.slots.body_area.status === "confirmed" ||
    implications?.derivedBodyArea
  );

  // =========================================================================
  // 2. BENEFIT / SUB-CONCEPT (Tier 2, Weight 0.9)
  // When category is known and area is confirmed or implied, ask benefit
  // =========================================================================
  if (
    confirmedCategory &&
    isAreaConfirmedOrImplied &&
    !state.askedQuestions.includes("need_confirm")
  ) {
    // Collect benefits supported by candidate products in this category
    const benefitCounts = new Map<string, number>();
    for (const fam of candidateFamilies) {
      const goals = fam.primaryProduct.supported_goals;
      for (const g of goals) {
        benefitCounts.set(g, (benefitCounts.get(g) || 0) + 1);
      }
    }

    // Filter to benefits that create a distinct split
    const eligibleBenefits = Array.from(benefitCounts.entries()).filter(
      ([, cnt]) => cnt > 0 && cnt < total
    );

    if (eligibleBenefits.length >= 2 || (eligibleBenefits.length === 1 && total > 2)) {
      const counts = eligibleBenefits.map(([, c]) => c);
      const sumSq = counts.reduce((acc, c) => acc + Math.pow(c / total, 2), 0);
      const gini = 1 - sumSq;
      const score = (gini > 0 ? gini : 0.5) * QUESTION_FACET_WEIGHTS.benefit;

      const topBenefitNames = eligibleBenefits
        .slice(0, 3)
        .map(([cid]) => {
          const cDef = CONCEPTS_BY_ID.get(cid);
          return cDef ? cDef.label.toLowerCase() : cid.replace(/_/g, " ");
        });

      const questionText =
        lang === "hi-latn"
          ? `Aapke liye kya zaroori hai: ${topBenefitNames.slice(0, 2).join(" ya ")}?`
          : `Which matters most: ${topBenefitNames.join(", ")}?`;

      const options: SessionQuestionOption[] = eligibleBenefits
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([cid, count]) => {
          const cDef = CONCEPTS_BY_ID.get(cid);
          const label = cDef ? cDef.label : cid.replace(/_/g, " ");
          return {
            id: cid,
            label: `${label} (${count})`,
            count,
            value: cid,
          };
        });

      options.push({
        id: "any",
        label: lang === "hi-latn" ? "Dono / All-round care" : "All-round / Not sure",
        count: total,
        value: null,
        isAny: true,
      });

      evaluated.push({
        facetId: "need_confirm",
        score,
        questionText,
        options,
        whyAsking: QUESTION_TEMPLATES.need_confirm[lang].why,
      });
    }
  }

  // =========================================================================
  // 3. BODY_AREA (Tier 3, Weight 0.5)
  // SKIPPED when derived from category!
  // =========================================================================
  if (
    !isAreaDerivedOrImplied &&
    state.slots.body_area.status !== "confirmed" &&
    !state.askedQuestions.includes("body_area")
  ) {
    const buckets = new Map<string, number>();
    for (const fam of candidateFamilies) {
      const area = detectBodyArea(fam.primaryProduct);
      if (area !== "unspecified") {
        buckets.set(area, (buckets.get(area) || 0) + 1);
      }
    }

    if (buckets.size >= 2) {
      const counts = Array.from(buckets.values());
      const sumSq = counts.reduce((acc, c) => acc + Math.pow(c / total, 2), 0);
      const gini = 1 - sumSq;
      const score = gini * QUESTION_FACET_WEIGHTS.body_area;

      const areaLabels: Record<string, { en: string; "hi-latn": string }> = {
        face: { en: "Face", "hi-latn": "Chehra (Face)" },
        body: { en: "Body", "hi-latn": "Sharir (Body)" },
        scalp: { en: "Scalp", "hi-latn": "Scalp" },
        hair: { en: "Hair", "hi-latn": "Baal (Hair)" },
        underarm: { en: "Underarm", "hi-latn": "Underarm" },
      };

      const options: SessionQuestionOption[] = Array.from(buckets.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([area, count]) => ({
          id: area,
          label: `${areaLabels[area]?.[lang] || area} (${count})`,
          count,
          value: area,
        }));

      options.push({
        id: "any",
        label: lang === "hi-latn" ? "Koi bhi" : "Any / not sure",
        count: total,
        value: null,
        isAny: true,
      });

      evaluated.push({
        facetId: "body_area",
        score,
        options,
        whyAsking: QUESTION_TEMPLATES.body_area[lang].why,
      });
    }
  }

  // =========================================================================
  // 4. TIME_OF_DAY (Tier 3, Weight 0.5)
  // Only when product data differentiates candidates by usage time
  // =========================================================================
  if (
    state.slots.time_of_day.status !== "confirmed" &&
    !state.askedQuestions.includes("time_of_day")
  ) {
    let amCount = 0;
    let pmCount = 0;
    for (const fam of candidateFamilies) {
      const tod = detectTimeOfDay(fam.primaryProduct);
      if (tod === "morning" || tod === "both") amCount++;
      if (tod === "night" || tod === "both") pmCount++;
    }

    if (amCount > 0 && pmCount > 0 && (amCount < total || pmCount < total)) {
      const counts = [amCount, pmCount];
      const sumSq = counts.reduce((acc, c) => acc + Math.pow(c / total, 2), 0);
      const gini = 1 - sumSq;
      const score = gini * QUESTION_FACET_WEIGHTS.time_of_day;

      const options: SessionQuestionOption[] = [
        {
          id: "morning",
          label: lang === "hi-latn" ? `Subah (Morning) (${amCount})` : `Morning / Day (${amCount})`,
          count: amCount,
          value: "morning",
        },
        {
          id: "night",
          label: lang === "hi-latn" ? `Raat (Night) (${pmCount})` : `Night / Evening (${pmCount})`,
          count: pmCount,
          value: "night",
        },
        {
          id: "any",
          label: lang === "hi-latn" ? "Dono time / Koi bhi" : "Any time / Not sure",
          count: total,
          value: "any",
          isAny: true,
        },
      ];

      evaluated.push({
        facetId: "time_of_day",
        score,
        options,
        whyAsking: QUESTION_TEMPLATES.time_of_day[lang].why,
      });
    }
  }

  // =========================================================================
  // 5. FORMAT (Tier 3, Weight 0.4)
  // Skipped if implied by the category
  // =========================================================================
  const isFormatImplied = Boolean(implications?.derivedFormat);

  if (
    !isFormatImplied &&
    state.slots.format.status !== "confirmed" &&
    !state.askedQuestions.includes("format")
  ) {
    const buckets = new Map<string, number>();
    for (const fam of candidateFamilies) {
      const fmt = fam.format;
      buckets.set(fmt, (buckets.get(fmt) || 0) + 1);
    }

    if (buckets.size >= 2) {
      const counts = Array.from(buckets.values());
      const sumSq = counts.reduce((acc, c) => acc + Math.pow(c / total, 2), 0);
      const gini = 1 - sumSq;
      const score = gini * QUESTION_FACET_WEIGHTS.format;

      const options: SessionQuestionOption[] = Array.from(buckets.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([fmt, count]) => ({
          id: fmt,
          label: `${fmt} (${count})`,
          count,
          value: fmt,
        }));

      options.push({
        id: "any",
        label: lang === "hi-latn" ? "Koi bhi format" : "Any format / Not sure",
        count: total,
        value: null,
        isAny: true,
      });

      evaluated.push({
        facetId: "format",
        score,
        options,
        whyAsking: QUESTION_TEMPLATES.format[lang].why,
      });
    }
  }

  // =========================================================================
  // 6. FRAGRANCE_PREF (Tier 3, Weight 0.3)
  // =========================================================================
  if (
    state.slots.fragrance_pref.status !== "confirmed" &&
    !state.askedQuestions.includes("fragrance_pref")
  ) {
    let freeCount = 0;
    let scentedCount = 0;
    for (const fam of candidateFamilies) {
      if (fam.primaryProduct.fragrance_free === true) freeCount++;
      else scentedCount++;
    }

    if (freeCount > 0 && scentedCount > 0) {
      const counts = [freeCount, scentedCount];
      const sumSq = counts.reduce((acc, c) => acc + Math.pow(c / total, 2), 0);
      const gini = 1 - sumSq;
      const score = gini * QUESTION_FACET_WEIGHTS.fragrance;

      const options: SessionQuestionOption[] = [
        {
          id: "free_only",
          label: lang === "hi-latn" ? `Fragrance-free (${freeCount})` : `Fragrance-free only (${freeCount})`,
          count: freeCount,
          value: "free_only",
        },
        {
          id: "any",
          label: lang === "hi-latn" ? `Khushbu chalegi (${scentedCount})` : `Lightly scented / Any (${total})`,
          count: total,
          value: "any",
          isAny: true,
        },
      ];

      evaluated.push({
        facetId: "fragrance_pref",
        score,
        options,
        whyAsking: QUESTION_TEMPLATES.fragrance_pref[lang].why,
      });
    }
  }

  // Stop condition: No eligible facets
  if (evaluated.length === 0) {
    return {
      done: true,
      candidateCount: total,
      askedCount: state.questionCount,
    };
  }

  // Sort by score descending (highest priority weight first)
  evaluated.sort((a, b) => b.score - a.score);
  const best = evaluated[0];

  if (best.score < 0.05) {
    return {
      done: true,
      candidateCount: total,
      askedCount: state.questionCount,
    };
  }

  const tmpl = QUESTION_TEMPLATES[best.facetId][lang];
  const questionTitle = best.questionText || tmpl.question;

  return {
    done: false,
    facet: best.facetId,
    question: questionTitle,
    whyAsking: best.whyAsking,
    options: best.options,
    candidateCount: total,
    askedCount: state.questionCount,
  };
}
