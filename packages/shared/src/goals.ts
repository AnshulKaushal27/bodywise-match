import { z } from "zod";

export const GoalIdSchema = z.enum([
  "body_bumps_look",
  "gentle_daily_cleansing",
  "oil_control",
  "hydration_barrier",
  "dark_spots_look",
  "hair_fall_appearance",
  "scalp_comfort",
  "frizz_control",
  "sun_protection",
  "underarm_odor_freshness",
  "underarm_texture_smoothing",
  "rough_texture_smoothing",
  "hair_density_appearance",
  "scalp_clarifying",
]);

export type GoalId = z.infer<typeof GoalIdSchema>;

export interface GoalDefinition {
  id: GoalId;
  label: string;
  description: string;
  category: "hair" | "scalp" | "underarm" | "body" | "skincare";
  synonyms: string[];
}

export const CONTROLLED_GOALS: GoalDefinition[] = [
  {
    id: "body_bumps_look",
    label: "Reduce the look of body bumps",
    description: "Supports smoother skin appearance on arms, legs, back, and chest without harsh physical scrubbing.",
    category: "body",
    synonyms: ["body bumps", "back bumps", "strawberry legs", "rough bumps", "keratosis pilaris look", "chest bumps", "butt bumps"],
  },
  {
    id: "gentle_daily_cleansing",
    label: "Gentle daily cleansing",
    description: "Effective surface dirt and sweat removal designed to preserve the moisture barrier without tight post-wash feeling.",
    category: "body",
    synonyms: ["gentle cleansing", "daily wash", "mild cleanser", "non-stripping", "everyday shower", "sensitive wash"],
  },
  {
    id: "oil_control",
    label: "Oil & sebum balance",
    description: "Helps regulate excess shine and surface greasiness without causing rebound dryness.",
    category: "skincare",
    synonyms: ["excess oil", "sebum balance", "greasy skin", "shiny forehead", "oily scalp", "pore congestion"],
  },
  {
    id: "hydration_barrier",
    label: "Hydration & barrier comfort",
    description: "Addresses tightness, flaking, or parched skin texture by locking in humectants and emollients.",
    category: "body",
    synonyms: ["hydration", "dry skin", "skin barrier", "tight skin", "parched", "moisture balance", "flakiness"],
  },
  {
    id: "dark_spots_look",
    label: "Reduce the look of dark spots",
    description: "Promotes visible tone consistency and targets past blemish marks through topical cosmetic actives.",
    category: "skincare",
    synonyms: ["dark spots", "post acne marks", "hyperpigmentation appearance", "blemish spots", "sun marks", "uneven patches"],
  },
  {
    id: "hair_fall_appearance",
    label: "Reduce hair fall appearance",
    description: "Supports strand retention and minimizes excessive daily comb shedding through root nourishment.",
    category: "hair",
    synonyms: ["hair fall", "excessive shedding", "comb hair fall", "hair breakage", "hair loss appearance", "strands on pillow"],
  },
  {
    id: "scalp_comfort",
    label: "Scalp comfort & itch relief",
    description: "Calms scalp tightness, dryness-induced itching, and flaky buildup for a balanced scalp feel.",
    category: "scalp",
    synonyms: ["scalp itch", "dry scalp", "scalp comfort", "scalp flaking", "scalp irritation feel", "tight scalp"],
  },
  {
    id: "frizz_control",
    label: "Frizz control & hair softness",
    description: "Smooths unruly flyaways and cuticle roughness in humid or dry ambient conditions.",
    category: "hair",
    synonyms: ["frizz", "flyaways", "unruly hair", "rough hair", "coarse strands", "hair softness"],
  },
  {
    id: "sun_protection",
    label: "Daily sun protection",
    description: "Shields skin from UVA and UVB exposure to mitigate premature photoaging and pigmentation darkening.",
    category: "skincare",
    synonyms: ["sunscreen", "uv protection", "sun shield", "broad spectrum", "daily spf", "sun damage prevention"],
  },
  {
    id: "underarm_odor_freshness",
    label: "Underarm odor freshness",
    description: "Targets odor-causing surface bacteria to maintain neutral freshness throughout active hours.",
    category: "underarm",
    synonyms: ["underarm odor", "body odor", "sweat smell", "armpit smell", "deodorant", "freshness"],
  },
  {
    id: "underarm_texture_smoothing",
    label: "Underarm texture smoothing & tone look",
    description: "Encourages cellular surface turnover for underarm friction zones and targets dark underarm look.",
    category: "underarm",
    synonyms: ["underarm darkness", "dark armpits", "underarm texture", "shaving bumps underarm", "smooth armpits"],
  },
  {
    id: "rough_texture_smoothing",
    label: "Rough texture smoothing",
    description: "Mild topical exfoliating care for patches of coarse, uneven, or textured skin.",
    category: "body",
    synonyms: ["rough skin", "textured skin", "dry patches", "flaky texture", "coarse skin"],
  },
  {
    id: "hair_density_appearance",
    label: "Hairline & parting density appearance",
    description: "Topical peptide and herbal active care intended to support the visible fullness of partings and temples.",
    category: "hair",
    synonyms: ["hairline density", "temple thinning", "wide parting", "hair fullness", "baby hairs", "scalp coverage"],
  },
  {
    id: "scalp_clarifying",
    label: "Scalp clarifying & buildup removal",
    description: "Clears residual styling products, hard water minerals, and excess sebum from the scalp.",
    category: "scalp",
    synonyms: ["scalp buildup", "greasy roots", "product residue", "dandruff flakes", "scalp clarify", "oily roots"],
  },
];

export const VALID_GOAL_IDS: Set<string> = new Set(CONTROLLED_GOALS.map((g) => g.id));

export function isGoalId(val: string): val is GoalId {
  return VALID_GOAL_IDS.has(val);
}

export function findMatchingGoalsByKeywords(query: string): GoalDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return CONTROLLED_GOALS.filter((goal) => {
    if (goal.label.toLowerCase().includes(q)) return true;
    return goal.synonyms.some((synonym) => q.includes(synonym) || synonym.includes(q));
  });
}
