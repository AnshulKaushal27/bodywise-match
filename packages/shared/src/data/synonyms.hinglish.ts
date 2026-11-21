/**
 * Controlled Hinglish & Hindi (Roman Script) Synonyms for Concept and Slot Extraction
 * Strictly cosmetic intent mapping — no medical diagnoses or curative promises (Rule 1 & 2).
 */

export interface SynonymMapping {
  canonical: string;
  synonyms: string[];
}

export const HINGLISH_NEEDS: Record<string, string[]> = {
  hydration: [
    "dryness",
    "sukhapan",
    "sukhi",
    "rukhi",
    "rukha",
    "khinchav",
    "tightness",
    "dry skin",
    "flaky",
    "phat rahi",
    "khurduri",
  ],
  dark_spots_look: [
    "darkkspots",
    "darkk spots",
    "darkspots",
    "dark spots",
    "dark spot",
    "dark-spots",
    "darkkspot",
    "daag",
    "dhabbe",
    "kale nishaan",
    "nishaan",
    "marks",
    "pigmentation",
    "jhaiya",
    "black spots",
    "blemishes",
  ],
  oil_control: [
    "oily",
    "tel",
    "chipchipa",
    "chipchipi",
    "grease",
    "greasy",
    "sebum",
    "chamak",
    "excess oil",
    "shiny face",
  ],
  scalp_comfort: [
    "khujli",
    "itching",
    "itchy",
    "dandruff",
    "rusi",
    "flaky scalp",
    "papdi",
    "scalp itch",
  ],
  hair_fall_appearance: [
    "hair fall",
    "hairfall",
    "baal jhadna",
    "baal jhad rahe",
    "comb me baal",
    "shedding",
    "baal tutna",
    "hair fall",
  ],
  hair_density_appearance: [
    "hair thinning",
    "patle baal",
    "baal ghane",
    "hairline",
    "baal badhana",
    "density",
    "scalp dikh raha",
  ],
  body_bumps_look: [
    "strawberry legs",
    "body bumps",
    "dana",
    "dane",
    "chote dane",
    "rough skin",
    "back bumps",
    "bumps",
  ],
  sun_protection: [
    "dhoop",
    "sun",
    "tan",
    "tanning",
    "sun protection",
    "de-tan",
    "sunburn",
    "dhoop se bachav",
  ],
};

export const HINGLISH_BODY_AREAS: Record<string, string[]> = {
  face: ["muh", "muh pe", "chehra", "chehre", "face", "face pe", "galon", "maatha", "forehead"],
  body: ["body", "badan", "hath", "pair", "pith", "back", "arms", "legs", "elbows", "knees"],
  scalp: ["scalp", "sar", "sir", "maang", "roots"],
  hair: ["baal", "hair", "baalon", "strands", "zulfen"],
  underarm: ["underarm", "underarms", "bagal", "armpit", "armpits", "pasina", "badbu"],
};

export const HINGLISH_TIME_OF_DAY: Record<string, string[]> = {
  night: ["raat", "raat ko", "night", "sone se pehle", "evening", "pm", "bedtime", "shaam"],
  morning: ["subah", "subha", "morning", "din me", "am", "dhoop me", "naha ke"],
  both: ["subah shaam", "dono time", "am pm", "day and night", "morning and night"],
};

export const HINGLISH_FREQUENCY: Record<string, string[]> = {
  daily: ["roz", "daily", "har roz", "har din", "roj", "niyamit", "everyday", "daily laga sku", "regular"],
  occasional: ["kabhi kabhi", "hafate me ek baar", "weekly", "occasionally"],
};

export const HINGLISH_PRODUCT_TYPES: Record<string, string[]> = {
  moisturizer: ["cream", "lotion", "moisturizer", "moisturiser", "malai", "lep", "cold cream", "day cream", "night cream"],
  serum: ["serum", "dropper", "ark", "liquid serum"],
  face_wash: ["facewash", "face wash", "chehra dhone", "cleanser", "face foam"],
  body_wash: ["bodywash", "body wash", "shower gel", "nahane ka sabun", "body cleanser"],
  shampoo: ["shampoo", "baal dhone ka", "shampu"],
  conditioner: ["conditioner"],
  sunscreen: ["sunscreen", "sunblock", "spf", "sun cream"],
  supplement: ["gummies", "gummy", "tablet", "chewable", "capsule", "supplement"],
  roll_on: ["roll-on", "rollon", "roller"],
};
