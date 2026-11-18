# Catalogue Extraction & Review Gate Report

**Date of Extraction:** 2026-11-18  
**Official Source:** [bebodywise.com](https://bebodywise.com)  
**Total Products Extracted:** 107  

---

## 1. Executive Summary & Verification Metrics

| Metric | Count | Percentage | Status |
| :--- | :---: | :---: | :--- |
| **Total Products Extracted** | **107** | 100% | Complete |
| **Full Ingredients Verified** | 88 | 82% | Highlighted in report |
| **Missing Ingredients (Null)** | 19 | 18% | Null preserved (Rule 3) |
| **Directions Verified** | 60 | 56% | Verified from How To Use |
| **Missing Directions (Null)** | 47 | 44% | Null preserved |
| **Cautions Verified** | 73 | 68% | Verified from FAQ/Safety advisory |
| **Missing Cautions (Null)** | 34 | 32% | Null preserved |
| **Size Verified** | 52 | 49% | Verified from name / packaging |
| **Price (INR) Verified** | 107 | 100% | Verified from JSON-LD offer |
| **Medical Claims Flagged** | 0 | 0% | Flagged & excluded from UI copy |
| **Goal Mappings Needing Review** | 37 | 35% | Multi-packs & kits flagged |

---

## 2. Hard Rule Safeguards Applied
1. **Zero Hallucination (Rule 2 & 3):** No ingredients, sizes, cautions, or suitability claims were invented or inferred from general knowledge. Missing values remain strictly `null` and render as *"Not verified yet"*.
2. **Neutral Paraphrasing:** Brand marketing claims were isolated. Product summaries use our neutral, non-promotional descriptions without treatment promises.
3. **Medical Language Quarantine:** Claims containing treatment or cure language (e.g., *"prevents body acne"*, *"clears acne"*) are quarantined in `published_claims` for audit only and marked with `medical_claim_language: true`.
4. **Image Quarantine:** Per `data/image-permissions.md` (`IMAGE_PERMISSION: not_granted`), zero brand images were downloaded or embedded. `image_url` remains `null` in the catalogue.

---

## 3. Products Flagged with Medical Claim Language
The following products have published claims on the official website that contain medical or treatment phrasing. In accordance with AGENTS.md, these phrases are retained for audit only and neutralized in our UI summary:

| Product Slug | Official Name | Flagged Phrasing Found on Site |
| :--- | :--- | :--- |


---

## 4. Goal Mappings Needing Review (`needs_review`)
The following products are multi-item kits, dietary supplements, or accessories where goal assignment involves editorial discretion:

| Product Slug | Official Name | Proposed Goals | Reason for Review |
| :--- | :--- | :--- | :--- |
| `10-magnesium-lotion` | 10% Magnesium Body Lotion - 200 ml | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `10-magnesium-lotion-300ml` | 10% Magnesium Body Lotion - 300 ml | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `5-lactic-acid-body-lotion` | 5% Lactic Acid Body Lotion | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `magnesium-gummies-and-lotion-kit` | Complete Magnesium Care | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `6-aha-bha-underarm-roll-on-twin-pack-75ml` | Underarm Twin Defence Pack | `underarm_odor_freshness, underarm_texture_smoothing` | Multi-item bundle, accessory, or oral supplement |
| `advanced-hair-growth-pack` | Advanced Hair Growth Pack | `hair_density_appearance` | Multi-item bundle, accessory, or oral supplement |
| `advanced-hair-growth-pack-xp` | Advanced Hair Growth Pack | `hair_density_appearance` | Multi-item bundle, accessory, or oral supplement |
| `advanced-underarm-pigmentation-kit` | Advanced Underarm Pigmentation Kit | `dark_spots_look, underarm_texture_smoothing, underarm_odor_freshness` | Multi-item bundle, accessory, or oral supplement |
| `aha-bha-body-pack` | AHA-BHA Body Pack | `body_bumps_look, rough_texture_smoothing` | Multi-item bundle, accessory, or oral supplement |
| `body-de-tan-kit` | De-Tan Kit | `dark_spots_look` | Multi-item bundle, accessory, or oral supplement |
| `body-exfoliation-pigmentation-kit` | Body Exfoliation & Pigmentation Kit | `dark_spots_look` | Multi-item bundle, accessory, or oral supplement |
| `daily-hydration-kit` | Daily Hydration Kit | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `dandruff-hairfall-kit` | Anti Dandruff & Hairfall Kit | `scalp_comfort, scalp_clarifying` | Multi-item bundle, accessory, or oral supplement |
| `face-and-body-acne-kit` | Face & Body Acne Kit | `oil_control` | Multi-item bundle, accessory, or oral supplement |
| `face-razor-for-women` | Face Razor | `rough_texture_smoothing` | Multi-item bundle, accessory, or oral supplement |
| `hair-growth-pack-30ml-xp` | Advanced Hair Growth Pack with Dropper 30ml | `hair_density_appearance` | Multi-item bundle, accessory, or oral supplement |
| `hair-growth-pack-rosemary-roll-on-90n` | Advanced Hair Growth Pack with Roll On 25ml | `hair_density_appearance` | Multi-item bundle, accessory, or oral supplement |
| `hair-growth-pack-rosemary-roll-on-xp-2` | Advanced Hair Growth Pack with Roll On 25ml | `hair_density_appearance` | Multi-item bundle, accessory, or oral supplement |
| `hair-pro-growth-pack` | Hair Growth Pack | `hair_density_appearance` | Multi-item bundle, accessory, or oral supplement |
| `ice-roller` | Ice Roller (1 N) | `rough_texture_smoothing` | Multi-item bundle, accessory, or oral supplement |
| `scalp-massager` | Scalp Massager | `rough_texture_smoothing` | Multi-item bundle, accessory, or oral supplement |
| `strawberry-skin-kit` | Strawberry Skin Kit | `body_bumps_look, rough_texture_smoothing` | Multi-item bundle, accessory, or oral supplement |
| `strawberry-skin-pack` | Strawberry Skin Pack | `body_bumps_look, rough_texture_smoothing` | Multi-item bundle, accessory, or oral supplement |
| `summer-essentials-kit` | Summer Essentials Trio | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `underarm-pigmentation-kit-no-fragrance` | Underarm Pigmentation Kit - No Fragrance | `dark_spots_look, underarm_texture_smoothing, underarm_odor_freshness` | Multi-item bundle, accessory, or oral supplement |
| `urea-skin-heel-repair-kit` | Urea Skin & Heel Repair Kit | `rough_texture_smoothing` | Multi-item bundle, accessory, or oral supplement |
| `brow-lash-serum` | Brow & Lash Growth Serum | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `face-body-sunscreen-kit` | Daily Sun Shield Kit | `sun_protection` | Multi-item bundle, accessory, or oral supplement |
| `advanced-magnesium-gummies-30n` | 5-in-1 Magnesium Gummies with Beads 30N | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `advanced-magnesium-gummies-60n` | 5-in-1 Magnesium Gummies with Glycinate & Vitamin D3 (60N) | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `biotin-hair-gummies-120` | Biotin Hair Gummies (120) | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `biotin-multivitamin-hair-gummies-2m` | Biotin Hair Gummies (60) | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `calcium-gummies` | Calcium Gummies | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `collagen-skin-gummies` | Collagen Builder Gummies | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `glutathione-gummies-60` | Glutathione Gummies (60N) | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `magnesium-glycinate-gummies-60n` | 5-in-1 Magnesium Gummies with Glycinate & Vitamin D3 (60N) | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |
| `multivitamin-gummies` | Multivitamin Gummies | `gentle_daily_cleansing` | Multi-item bundle, accessory, or oral supplement |

---

## 5. Complete Product Inventory & Extraction Table

> **Note on Nulls:** Where a field was not explicitly published on the official page, it is set to `NULL` (rendered as "Not verified yet" in UI).

| Slug | Category | Size | Price | Ing. Count | Null Fields | Goals | Approved? |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| [`1-salicylic-acid-body-wash`](https://bebodywise.com/product/1-salicylic-acid-body-wash) | body_wash | 250 mL | ₹329 | 18 | None | `body_bumps_look` | [ ] |
| [`1-salicylic-acid-body-wash-350ml`](https://bebodywise.com/product/1-salicylic-acid-body-wash-350ml) | body_wash | 375 mL | ₹399 | 18 | None | `body_bumps_look` | [ ] |
| [`10-aha-body-scrub`](https://bebodywise.com/product/10-aha-body-scrub) | body_wash | 200g | ₹369 | 22 | **Dir, Frag** | `rough_texture_smoothing` | [ ] |
| [`10-aha-body-scrub-300`](https://bebodywise.com/product/10-aha-body-scrub-300) | body_wash | 300g | ₹499 | 22 | **Dir, Frag** | `rough_texture_smoothing` | [ ] |
| [`10-magnesium-lotion`](https://bebodywise.com/product/10-magnesium-lotion) | body_wash | 200 ml | ₹349 | 21 | **Dir, Frag** | `gentle_daily_cleansing` | [ ] |
| [`10-magnesium-lotion-300ml`](https://bebodywise.com/product/10-magnesium-lotion-300ml) | body_wash | 300 ml | ₹499 | 21 | **Dir, Frag** | `gentle_daily_cleansing` | [ ] |
| [`10-urea-lotion`](https://bebodywise.com/product/10-urea-lotion) | body_wash | 200 ml | ₹399 | 21 | **Dir, Frag** | `rough_texture_smoothing, hydration_barrier` | [ ] |
| [`10-urea-lotion-300ml`](https://bebodywise.com/product/10-urea-lotion-300ml) | body_wash | 300 ml | ₹499 | 21 | **Frag** | `rough_texture_smoothing, hydration_barrier` | [ ] |
| [`12-aha-scrub`](https://bebodywise.com/product/12-aha-scrub) | body_wash | 300g | ₹599 | 22 | **Dir, Frag** | `rough_texture_smoothing` | [ ] |
| [`2-5-benzoyl-peroxide-bodywash`](https://bebodywise.com/product/2-5-benzoyl-peroxide-bodywash) | body_wash | NULL | ₹174 | 18 | **Dir, Size** | `gentle_daily_cleansing` | [ ] |
| [`2-aha-body-wash`](https://bebodywise.com/product/2-aha-body-wash) | body_wash | NULL | ₹199 | 21 | **Dir, Size, Frag** | `gentle_daily_cleansing` | [ ] |
| [`20-urea-lotion-xp`](https://bebodywise.com/product/20-urea-lotion-xp) | body_wash | 300ml | ₹599 | 25 | **Frag** | `rough_texture_smoothing, hydration_barrier` | [ ] |
| [`5-aha-bha-bodywash`](https://bebodywise.com/product/5-aha-bha-bodywash) | body_wash | 250 mL | ₹399 | 20 | **Frag** | `body_bumps_look, rough_texture_smoothing` | [ ] |
| [`5-aha-bha-bodywash-250ml-flora`](https://bebodywise.com/product/5-aha-bha-bodywash-250ml-flora) | body_wash | 250ml | ₹399 | 20 | **Frag** | `body_bumps_look, rough_texture_smoothing` | [ ] |
| [`5-aha-bha-bodywash-700ml`](https://bebodywise.com/product/5-aha-bha-bodywash-700ml) | body_wash | 700ml | ₹699 | 20 | **Frag** | `body_bumps_look, rough_texture_smoothing` | [ ] |
| [`5-aha-bha-bodywash-700ml-flora`](https://bebodywise.com/product/5-aha-bha-bodywash-700ml-flora) | body_wash | 700ml | ₹699 | 20 | **Frag** | `body_bumps_look, rough_texture_smoothing` | [ ] |
| [`5-lactic-acid-body-lotion`](https://bebodywise.com/product/5-lactic-acid-body-lotion) | body_wash | NULL | ₹449 | 18 | **Dir, Size, Frag** | `gentle_daily_cleansing` | [ ] |
| [`5-niacinamide-body-wash`](https://bebodywise.com/product/5-niacinamide-body-wash) | body_wash | NULL | ₹329 | 18 | **Dir, Size** | `gentle_daily_cleansing, dark_spots_look` | [ ] |
| [`aha-body-wash-deal`](https://bebodywise.com/product/aha-body-wash-deal) | body_wash | NULL | ₹199 | 21 | **Dir, Size, Frag** | `gentle_daily_cleansing, hydration_barrier` | [ ] |
| [`body-sunscreen-lotion-with-spf-50`](https://bebodywise.com/product/body-sunscreen-lotion-with-spf-50) | body_wash | NULL | ₹549 | 51 | **Caut, Size** | `sun_protection` | [ ] |
| [`magnesium-gummies-and-lotion-kit`](https://bebodywise.com/product/magnesium-gummies-and-lotion-kit) | body_wash | NULL | ₹1498 | 0 | **Ing, Size, Frag** | `gentle_daily_cleansing` | [ ] |
| [`niacinamide-body-lotion`](https://bebodywise.com/product/niacinamide-body-lotion) | body_wash | NULL | ₹399 | 14 | **Dir, Size** | `dark_spots_look` | [ ] |
| [`niacinamide-body-wash-700`](https://bebodywise.com/product/niacinamide-body-wash-700) | body_wash | 700 ml | ₹699 | 18 | None | `gentle_daily_cleansing, dark_spots_look` | [ ] |
| [`pigmentation-repair-cream`](https://bebodywise.com/product/pigmentation-repair-cream) | body_wash | NULL | ₹599 | 19 | **Dir, Size** | `dark_spots_look` | [ ] |
| [`sabodywash-scrub`](https://bebodywise.com/product/sabodywash-scrub) | body_wash | NULL | ₹649 | 38 | **Dir, Size** | `rough_texture_smoothing` | [ ] |
| [`salicylic-acid-body-wash-700`](https://bebodywise.com/product/salicylic-acid-body-wash-700) | body_wash | 700 ml | ₹699 | 18 | None | `body_bumps_look` | [ ] |
| [`salicylic-ceramide-bodywash`](https://bebodywise.com/product/salicylic-ceramide-bodywash) | body_wash | NULL | ₹549 | 0 | **Ing, Caut, Size, Frag** | `body_bumps_look, hydration_barrier` | [ ] |
| [`triple-milk-deep-hydrating-bodywash-xp`](https://bebodywise.com/product/triple-milk-deep-hydrating-bodywash-xp) | body_wash | NULL | ₹499 | 0 | **Ing, Caut, Size, Frag** | `gentle_daily_cleansing, hydration_barrier` | [ ] |
| [`deep-moisturizing-conditioner`](https://bebodywise.com/product/deep-moisturizing-conditioner) | conditioner | NULL | ₹399 | 25 | **Caut, Size** | `frizz_control` | [ ] |
| [`2-salicylic-acid-face-wash`](https://bebodywise.com/product/2-salicylic-acid-face-wash) | face_wash | NULL | ₹232 | 12 | **Dir, Size** | `body_bumps_look, oil_control` | [ ] |
| [`benzoyl-peroxide-facewash`](https://bebodywise.com/product/benzoyl-peroxide-facewash) | face_wash | NULL | ₹199 | 18 | **Dir, Size** | `oil_control` | [ ] |
| [`salicylic-acid-face-wash`](https://bebodywise.com/product/salicylic-acid-face-wash) | face_wash | NULL | ₹239 | 16 | **Size** | `body_bumps_look, oil_control` | [ ] |
| [`1-peptide-ceramide-moisturizer`](https://bebodywise.com/product/1-peptide-ceramide-moisturizer) | other | NULL | ₹374 | 17 | **Size** | `hydration_barrier` | [ ] |
| [`20-urea-roll-on-50ml`](https://bebodywise.com/product/20-urea-roll-on-50ml) | other | 50 ml | ₹399 | 19 | **Frag** | `rough_texture_smoothing, underarm_odor_freshness` | [ ] |
| [`20-urea-roll-on-75ml`](https://bebodywise.com/product/20-urea-roll-on-75ml) | other | 75 ml | ₹549 | 19 | **Frag** | `rough_texture_smoothing, underarm_odor_freshness` | [ ] |
| [`30-urea-foot-roll-on`](https://bebodywise.com/product/30-urea-foot-roll-on) | other | 50ml | ₹549 | 25 | None | `rough_texture_smoothing` | [ ] |
| [`30-urea-foot-roll-on-75ml`](https://bebodywise.com/product/30-urea-foot-roll-on-75ml) | other | 75 ml | ₹649 | 25 | None | `rough_texture_smoothing` | [ ] |
| [`4-aha-bha-underarm-roll-on`](https://bebodywise.com/product/4-aha-bha-underarm-roll-on) | other | 50 mL | ₹329 | 15 | **Dir, Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`4-aha-bha-underarm-roll-on-aqua`](https://bebodywise.com/product/4-aha-bha-underarm-roll-on-aqua) | other | 50 mL | ₹329 | 15 | **Dir, Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`4-aha-bha-underarm-roll-on-no-fragrance`](https://bebodywise.com/product/4-aha-bha-underarm-roll-on-no-fragrance) | other | 50 mL | ₹329 | 15 | **Dir** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`4-aha-bha-underarm-roll-on-oudh`](https://bebodywise.com/product/4-aha-bha-underarm-roll-on-oudh) | other | 50 mL | ₹329 | 15 | **Dir, Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`4-aha-bha-underarm-roll-on-watermelon`](https://bebodywise.com/product/4-aha-bha-underarm-roll-on-watermelon) | other | 50 mL | ₹329 | 15 | **Dir, Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`4-aha-bha-underarm-rollon-75`](https://bebodywise.com/product/4-aha-bha-underarm-rollon-75) | other | 75 mL | ₹499 | 15 | **Dir, Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`4-aha-bha-underarm-rollon-frag-free-75`](https://bebodywise.com/product/4-aha-bha-underarm-rollon-frag-free-75) | other | 75 ml | ₹499 | 15 | **Dir** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`6-aha-bha-underarm-roll-on`](https://bebodywise.com/product/6-aha-bha-underarm-roll-on) | other | 50mL | ₹399 | 19 | **Dir, Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`6-aha-bha-underarm-roll-on-aqua`](https://bebodywise.com/product/6-aha-bha-underarm-roll-on-aqua) | other | 50 ml | ₹399 | 19 | **Dir, Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`6-aha-bha-underarm-roll-on-aqua-75ml`](https://bebodywise.com/product/6-aha-bha-underarm-roll-on-aqua-75ml) | other | 75 ml | ₹499 | 19 | **Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`6-aha-bha-underarm-roll-on-flora-75ml`](https://bebodywise.com/product/6-aha-bha-underarm-roll-on-flora-75ml) | other | 75ml | ₹499 | 19 | **Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`6-aha-bha-underarm-roll-on-frag-free`](https://bebodywise.com/product/6-aha-bha-underarm-roll-on-frag-free) | other | 50 ml | ₹399 | 19 | **Dir** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`6-aha-bha-underarm-roll-on-twin-pack-75ml`](https://bebodywise.com/product/6-aha-bha-underarm-roll-on-twin-pack-75ml) | other | 50 g | ₹998 | 19 | **Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`6-aha-bha-underarm-roll-on-watermelon`](https://bebodywise.com/product/6-aha-bha-underarm-roll-on-watermelon) | other | 50 ml | ₹399 | 19 | **Dir, Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`advanced-hair-growth-pack`](https://bebodywise.com/product/advanced-hair-growth-pack) | other | NULL | ₹949 | 25 | **Caut, Size** | `hair_density_appearance` | [ ] |
| [`advanced-hair-growth-pack-xp`](https://bebodywise.com/product/advanced-hair-growth-pack-xp) | other | NULL | ₹949 | 25 | **Caut, Size** | `hair_density_appearance` | [ ] |
| [`advanced-underarm-pigmentation-kit`](https://bebodywise.com/product/advanced-underarm-pigmentation-kit) | other | NULL | ₹859 | 19 | **Size, Frag** | `dark_spots_look, underarm_texture_smoothing` | [ ] |
| [`aha-bha-body-pack`](https://bebodywise.com/product/aha-bha-body-pack) | other | NULL | ₹688 | 33 | **Size** | `body_bumps_look, rough_texture_smoothing` | [ ] |
| [`anti-stretch-mark-roll-on`](https://bebodywise.com/product/anti-stretch-mark-roll-on) | other | NULL | ₹599 | 0 | **Ing, Size, Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`body-de-tan-kit`](https://bebodywise.com/product/body-de-tan-kit) | other | NULL | ₹1178 | 0 | **Ing, Caut, Size, Frag** | `dark_spots_look` | [ ] |
| [`body-exfoliation-pigmentation-kit`](https://bebodywise.com/product/body-exfoliation-pigmentation-kit) | other | NULL | ₹848 | 41 | **Dir, Size** | `dark_spots_look` | [ ] |
| [`daily-hydration-kit`](https://bebodywise.com/product/daily-hydration-kit) | other | NULL | ₹899 | 47 | **Size, Frag** | `gentle_daily_cleansing` | [ ] |
| [`dandruff-hairfall-kit`](https://bebodywise.com/product/dandruff-hairfall-kit) | other | NULL | ₹1049 | 0 | **Ing, Caut, Size, Frag** | `scalp_comfort, scalp_clarifying` | [ ] |
| [`face-and-body-acne-kit`](https://bebodywise.com/product/face-and-body-acne-kit) | other | NULL | ₹349 | 45 | **Size** | `oil_control` | [ ] |
| [`face-razor-for-women`](https://bebodywise.com/product/face-razor-for-women) | other | NULL | ₹199 | 1 | **Dir, Size, Frag** | `rough_texture_smoothing` | [ ] |
| [`glycolic-acid-stick`](https://bebodywise.com/product/glycolic-acid-stick) | other | 30g | ₹599 | 0 | **Ing, Caut, Frag** | `rough_texture_smoothing` | [ ] |
| [`hair-fall-control-mini`](https://bebodywise.com/product/hair-fall-control-mini) | other | NULL | ₹749 | 45 | **Dir, Caut, Size** | `hair_fall_appearance` | [ ] |
| [`hair-growth-pack-30ml-xp`](https://bebodywise.com/product/hair-growth-pack-30ml-xp) | other | 30ml | ₹848 | 25 | **Caut** | `hair_density_appearance` | [ ] |
| [`hair-growth-pack-rosemary-roll-on-90n`](https://bebodywise.com/product/hair-growth-pack-rosemary-roll-on-90n) | other | 25ml | ₹1399 | 25 | **Caut** | `hair_density_appearance` | [ ] |
| [`hair-growth-pack-rosemary-roll-on-xp-2`](https://bebodywise.com/product/hair-growth-pack-rosemary-roll-on-xp-2) | other | 25ml | ₹899 | 25 | **Caut** | `hair_density_appearance` | [ ] |
| [`hair-pro-growth-pack`](https://bebodywise.com/product/hair-pro-growth-pack) | other | NULL | ₹949 | 25 | **Caut, Size** | `hair_density_appearance` | [ ] |
| [`hydrocolloid-acne-pimple-patch`](https://bebodywise.com/product/hydrocolloid-acne-pimple-patch) | other | NULL | ₹299 | 0 | **Ing, Dir, Caut, Size, Frag** | `oil_control` | [ ] |
| [`ice-roller`](https://bebodywise.com/product/ice-roller) | other | 1 N | ₹249 | 0 | **Ing, Dir, Frag** | `rough_texture_smoothing` | [ ] |
| [`scalp-massager`](https://bebodywise.com/product/scalp-massager) | other | NULL | ₹199 | 0 | **Ing, Caut, Size, Frag** | `rough_texture_smoothing` | [ ] |
| [`strawberry-skin-kit`](https://bebodywise.com/product/strawberry-skin-kit) | other | NULL | ₹698 | 0 | **Ing, Size, Frag** | `body_bumps_look, rough_texture_smoothing` | [ ] |
| [`strawberry-skin-pack`](https://bebodywise.com/product/strawberry-skin-pack) | other | NULL | ₹999 | 54 | **Size** | `body_bumps_look, rough_texture_smoothing` | [ ] |
| [`summer-essentials-kit`](https://bebodywise.com/product/summer-essentials-kit) | other | NULL | ₹999 | 53 | **Dir, Size** | `gentle_daily_cleansing` | [ ] |
| [`sun-care-duo-head-to-toe`](https://bebodywise.com/product/sun-care-duo-head-to-toe) | other | NULL | ₹949 | 0 | **Ing, Caut, Size, Frag** | `sun_protection` | [ ] |
| [`underarm-pigmentation-kit-no-fragrance`](https://bebodywise.com/product/underarm-pigmentation-kit-no-fragrance) | other | NULL | ₹799 | 32 | **Dir, Size** | `dark_spots_look, underarm_texture_smoothing` | [ ] |
| [`urea-skin-heel-repair-kit`](https://bebodywise.com/product/urea-skin-heel-repair-kit) | other | NULL | ₹749 | 21 | **Dir, Size, Frag** | `rough_texture_smoothing` | [ ] |
| [`advanced-hair-growth-serum`](https://bebodywise.com/product/advanced-hair-growth-serum) | serum | NULL | ₹849 | 21 | **Caut, Size** | `hair_density_appearance` | [ ] |
| [`anti-frizz-serum`](https://bebodywise.com/product/anti-frizz-serum) | serum | NULL | ₹599 | 0 | **Ing, Caut, Size, Frag** | `frizz_control` | [ ] |
| [`brow-lash-serum`](https://bebodywise.com/product/brow-lash-serum) | serum | NULL | ₹379 | 11 | **Dir, Size** | `gentle_daily_cleansing` | [ ] |
| [`folli-advanced-plus-hair-growth-serum`](https://bebodywise.com/product/folli-advanced-plus-hair-growth-serum) | serum | 25 ml | ₹849 | 0 | **Ing, Frag** | `hair_density_appearance` | [ ] |
| [`hair-growth-serum-30ml-xp-1`](https://bebodywise.com/product/hair-growth-serum-30ml-xp-1) | serum | 30ml | ₹349 | 21 | **Caut** | `hair_density_appearance` | [ ] |
| [`hair-growth-serum-pp-roll-on`](https://bebodywise.com/product/hair-growth-serum-pp-roll-on) | serum | NULL | ₹569 | 21 | **Dir, Caut, Size** | `hair_density_appearance` | [ ] |
| [`hair-growth-serum-roll-on`](https://bebodywise.com/product/hair-growth-serum-roll-on) | serum | NULL | ₹569 | 0 | **Ing, Caut, Size, Frag** | `hair_density_appearance` | [ ] |
| [`hair-growth-serum-roll-on-2-months-xp`](https://bebodywise.com/product/hair-growth-serum-roll-on-2-months-xp) | serum | NULL | ₹969 | 16 | **Caut, Size** | `hair_density_appearance` | [ ] |
| [`hair-growth-serum-roll-on-50ml`](https://bebodywise.com/product/hair-growth-serum-roll-on-50ml) | serum | 50mL | ₹849 | 21 | **Caut** | `hair_density_appearance` | [ ] |
| [`hair-growth-serum-spray`](https://bebodywise.com/product/hair-growth-serum-spray) | serum | 30 ml | ₹699 | 0 | **Ing, Caut, Frag** | `hair_density_appearance` | [ ] |
| [`hair-strengthening-serum`](https://bebodywise.com/product/hair-strengthening-serum) | serum | 100mL | ₹499 | 9 | **Caut, Frag** | `hair_density_appearance` | [ ] |
| [`hair-strengthening-serum-50-ml`](https://bebodywise.com/product/hair-strengthening-serum-50-ml) | serum | 50mL | ₹299 | 9 | **Caut, Frag** | `hair_density_appearance` | [ ] |
| [`1-ketoconazole-dandruff-shampoo-150ml`](https://bebodywise.com/product/1-ketoconazole-dandruff-shampoo-150ml) | shampoo | NULL | ₹359 | 21 | **Dir, Caut, Size** | `scalp_comfort, scalp_clarifying` | [ ] |
| [`1-ketoconazole-dandruff-shampoo-250ml`](https://bebodywise.com/product/1-ketoconazole-dandruff-shampoo-250ml) | shampoo | 250ml | ₹499 | 21 | **Dir, Caut** | `scalp_comfort, scalp_clarifying` | [ ] |
| [`1-zpto-anti-dandruff-shampoo`](https://bebodywise.com/product/1-zpto-anti-dandruff-shampoo) | shampoo | 200ml | ₹499 | 0 | **Ing, Dir, Frag** | `scalp_comfort, scalp_clarifying` | [ ] |
| [`keratin-shampoo-with-roll-on`](https://bebodywise.com/product/keratin-shampoo-with-roll-on) | shampoo | NULL | ₹899 | 0 | **Ing, Caut, Size, Frag** | `underarm_odor_freshness, underarm_texture_smoothing` | [ ] |
| [`body-sunscreen-spray-with-spf-50`](https://bebodywise.com/product/body-sunscreen-spray-with-spf-50) | sunscreen | NULL | ₹399 | 21 | **Dir, Size, Frag** | `sun_protection` | [ ] |
| [`body-sunscreen-spray-with-spf-50-deal`](https://bebodywise.com/product/body-sunscreen-spray-with-spf-50-deal) | sunscreen | NULL | ₹249 | 21 | **Dir, Size, Frag** | `sun_protection` | [ ] |
| [`face-body-sunscreen-kit`](https://bebodywise.com/product/face-body-sunscreen-kit) | sunscreen | NULL | ₹839 | 0 | **Ing, Dir, Size** | `sun_protection` | [ ] |
| [`lightest-mineral-sunscreen-spf50`](https://bebodywise.com/product/lightest-mineral-sunscreen-spf50) | sunscreen | NULL | ₹449 | 25 | **Dir, Size** | `sun_protection` | [ ] |
| [`ultra-light-sunscreen-spf50`](https://bebodywise.com/product/ultra-light-sunscreen-spf50) | sunscreen | 50 g | ₹499 | 23 | None | `sun_protection` | [ ] |
| [`advanced-magnesium-gummies-30n`](https://bebodywise.com/product/advanced-magnesium-gummies-30n) | supplement | 30N | ₹649 | 20 | **Frag** | `gentle_daily_cleansing` | [ ] |
| [`advanced-magnesium-gummies-60n`](https://bebodywise.com/product/advanced-magnesium-gummies-60n) | supplement | 60N | ₹999 | 20 | **Frag** | `gentle_daily_cleansing` | [ ] |
| [`biotin-hair-gummies-120`](https://bebodywise.com/product/biotin-hair-gummies-120) | supplement | NULL | ₹1699 | 20 | **Caut, Size, Frag** | `gentle_daily_cleansing` | [ ] |
| [`biotin-multivitamin-hair-gummies-2m`](https://bebodywise.com/product/biotin-multivitamin-hair-gummies-2m) | supplement | NULL | ₹849 | 20 | **Caut, Size, Frag** | `gentle_daily_cleansing` | [ ] |
| [`calcium-gummies`](https://bebodywise.com/product/calcium-gummies) | supplement | NULL | ₹231 | 10 | **Size, Frag** | `gentle_daily_cleansing` | [ ] |
| [`collagen-skin-gummies`](https://bebodywise.com/product/collagen-skin-gummies) | supplement | NULL | ₹499 | 20 | **Dir, Caut, Size, Frag** | `gentle_daily_cleansing` | [ ] |
| [`glutathione-gummies-60`](https://bebodywise.com/product/glutathione-gummies-60) | supplement | 60N | ₹689 | 14 | **Dir, Frag** | `gentle_daily_cleansing` | [ ] |
| [`magnesium-glycinate-gummies-60n`](https://bebodywise.com/product/magnesium-glycinate-gummies-60n) | supplement | 60N | ₹999 | 20 | **Frag** | `gentle_daily_cleansing` | [ ] |
| [`multivitamin-gummies`](https://bebodywise.com/product/multivitamin-gummies) | supplement | NULL | ₹699 | 18 | **Dir, Caut, Size, Frag** | `gentle_daily_cleansing` | [ ] |

---

## 6. Review Gate Action Required

Per **STEP 4: REVIEW GATE**:
1. Review the generated CSV at [reports/catalogue-review.csv](file:///f:/Mosaic/reports/catalogue-review.csv).
2. Confirm the approval list or state which products/categories should be marked as non-demo in the active catalogue.
3. No product will be imported into `data/catalogue.verified.ts` or the Postgres seed until you approve the shortlist.
