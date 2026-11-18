# Multi-Need RAG Evaluation Report

*Generated at: 2026-11-18T19:35:33.916Z*
*Total Queries Evaluated: 30*
*Catalogue Size: 107 verified products*
*Rules Version: 2.0.0*

> [!NOTE]
> This report presents deterministic evaluation outputs for manual review.
> As per safety guidelines, products are NOT marked as 'correct' or 'incorrect' automatically.

---

## Query q01: "I want blackhead removal and oily skin treatment"
**Scenario:** Primary acceptance test: multi-need (blackheads + oily skin)  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "I want blackhead removal" | `blackhead_look` | face_wash | primary |
| `need_2` | "oily skin treatment" | `oil_control` | *any suitable* | secondary |

### Shortlisted Matches per Need
#### For Reduce the look of blackheads (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **2% Salicylic Acid Face Wash** | `face_wash` | Gel / Foaming cleanser | ₹232 | `GOAL_FIT` | *"Buy 2% Salicylic Acid Face Wash for Acne, Blackheads, Whiteheads Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For Mild Occasional Acne - Oily Skin Type - Suitable for 13+ yrs 2% Salicylic Acid Face Wash ₹232 ₹299 22% off Incl of all taxes 4"* |
| 2 | **1% Salicylic Acid Face Wash (Foam-Based)** | `face_wash` | Gel / Foaming cleanser | ₹239 | `GOAL_FIT` | *"1% Salicylic Acid Face Wash (Foam-Based) unclogs pores, gently removes build-up & blackheads and treats acne-prone skin without drying out the skin of its natural oils"* |
| 3 | **Body Exfoliation & Pigmentation Kit** | `other` | Product | ₹848 | `GOAL_FIT` | *"� 7% Glycolic Acid Stick - gently exfoliates, unclogs pores, and smoothens rough, bumpy skin - in a mess-free, travel-friendly format"* |

#### For Oil & sebum balance (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Folli Advanced+ Hair Growth Serum Roll On - 3% Redensyl, 3% Rosemary (25 ml)** | `serum` | Leave-on hair serum | ₹849 | `GOAL_FIT` | *"4 508 Reviews 5 274 4 159 3 75 2 1 Finally a serum that doesn’t feel like a serum I’ve always avoided hair serums because they drip and make my hair greasy"* |
| 2 | **Frizz Control and Damage Repair Hair Serum** | `serum` | Topical skin serum | ₹599 | `GOAL_FIT` | *"🪶Lightweight finish : Non-oily, non-greasy care that won’t weigh your hair down"* |
| 3 | **2.5% Benzoyl Peroxide Facewash** | `face_wash` | Gel / Foaming cleanser | ₹199 | `GOAL_FIT` | *"5% Benzoyl Peroxide An antibacterial agent which helps treat and prevent acne by killing bacteria and control sebum production Learn More Aloe Vera Extract Helps in reducing inflammation and hydrating the skin Learn More Full list of ingredients Ingredient Names Aqua, Decyl Glucoside, Cocamidopropyl Betaine, Isopropyl Myristate, Benzoyl Peroxide, Glycerin, Propylene Glycol, Polysorbate-20, Glyceryl Monostearate, Cetostearyl Alcohol, PEG-40 Hydrogenated Castor Oil, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Phenoxyethanol, Triethanolamine, Tocopheryl Acetate, Aloe barbadensis (Aloe vera) Extract, D-Panthenol, Disodium EDTA"* |

---

## Query q02: "face wash for oily skin"
**Scenario:** Category + single concept  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "face wash for oily skin" | `oil_control` | face_wash | primary |

### Shortlisted Matches per Need
#### For Oil & sebum balance (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **2% Salicylic Acid Face Wash** | `face_wash` | Gel / Foaming cleanser | ₹232 | `GOAL_FIT` | *"Buy 2% Salicylic Acid Face Wash for Acne, Blackheads, Whiteheads Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For Mild Occasional Acne - Oily Skin Type - Suitable for 13+ yrs 2% Salicylic Acid Face Wash ₹232 ₹299 22% off Incl of all taxes 4"* |
| 2 | **2.5% Benzoyl Peroxide Facewash** | `face_wash` | Gel / Foaming cleanser | ₹199 | `GOAL_FIT` | *"5% Benzoyl Peroxide An antibacterial agent which helps treat and prevent acne by killing bacteria and control sebum production Learn More Aloe Vera Extract Helps in reducing inflammation and hydrating the skin Learn More Full list of ingredients Ingredient Names Aqua, Decyl Glucoside, Cocamidopropyl Betaine, Isopropyl Myristate, Benzoyl Peroxide, Glycerin, Propylene Glycol, Polysorbate-20, Glyceryl Monostearate, Cetostearyl Alcohol, PEG-40 Hydrogenated Castor Oil, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Phenoxyethanol, Triethanolamine, Tocopheryl Acetate, Aloe barbadensis (Aloe vera) Extract, D-Panthenol, Disodium EDTA"* |
| 3 | **1% Salicylic Acid Face Wash (Foam-Based)** | `face_wash` | Gel / Foaming cleanser | ₹239 | `GOAL_FIT` | *"Sebum Reduction Ingredients: Aqua, C14-16 Olefin Sulfonate, Decyl Glucoside, Sodium Lauroyl Sarcosinate, Maltooligosyl Glucoside and Hydrogenated Starch Hydrolysate, Sodium Hydroxide, Allantoin, Glycerin, Propylene Glycol, Sodium Benzoate and Potassium Sorbate, Glycolic Acid, Salicylic Acid, Polysorbate 20, Coco-Glucoside and Glyceryl Oleate, Cocamidopropyl hydroxysultaine, PEG-120 Methyl Glucose Dioleate"* |

---

## Query q03: "something for open pores and shine"
**Scenario:** Synonym-heavy multi-concept (pore look + oil control)  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "something for open pores" | `pore_look` | *any suitable* | primary |
| `need_2` | "shine" | `oil_control` | *any suitable* | secondary |

### Shortlisted Matches per Need
#### For Refine visible pore appearance (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **2% Salicylic Acid Face Wash** | `face_wash` | Gel / Foaming cleanser | ₹232 | `GOAL_FIT` | *"Tightening Pores : Prevents future breakouts & shrinks pores"* |
| 2 | **Body Exfoliation & Pigmentation Kit** | `other` | Product | ₹848 | `GOAL_FIT` | *"� 7% Glycolic Acid Stick - gently exfoliates, unclogs pores, and smoothens rough, bumpy skin - in a mess-free, travel-friendly format"* |
| 3 | **1% Salicylic Acid Face Wash (Foam-Based)** | `face_wash` | Gel / Foaming cleanser | ₹239 | `GOAL_FIT` | *"Tightens Pores: Our anti-acne face wash for women unclogs pores and destroys acne-causing bacteria, preventing future breakouts and shrinking open pores"* |

#### For Oil & sebum balance (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Advanced Hair Growth Serum Roll-On (Pack of 2)** | `serum` | Leave-on hair serum | ₹969 | `GOAL_FIT` | *"Priti Lokesh 05/09/2025 Longer Hair It makes my hair a little greasy, but I am happy seeing new growth and I will continue to apply"* |
| 2 | **Folli Advanced+ Hair Growth Serum Roll On - 3% Redensyl, 3% Rosemary (25 ml)** | `serum` | Leave-on hair serum | ₹849 | `GOAL_FIT` | *"4 508 Reviews 5 274 4 159 3 75 2 1 Finally a serum that doesn’t feel like a serum I’ve always avoided hair serums because they drip and make my hair greasy"* |
| 3 | **Frizz Control and Damage Repair Hair Serum** | `serum` | Topical skin serum | ₹599 | `GOAL_FIT` | *"🪶Lightweight finish : Non-oily, non-greasy care that won’t weigh your hair down"* |

---

## Query q04: "dry flaky scalp and frizz"
**Scenario:** Multi-domain: scalp comfort + hair frizz control  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "dry flaky scalp" | `dandruff_clarifying` | shampoo | primary |
| `need_2` | "frizz" | `frizz_control` | *any suitable* | secondary |

### Shortlisted Matches per Need
#### For Flake & dandruff clarifying (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **1% Ketoconazole Dandruff Shampoo** | `shampoo` | Liquid shampoo | ₹359 | `GOAL_FIT` | *"1% Ketoconazole Dandruff Shampoo shampoo Liquid shampoo Liquid shampoo designed for regular personal care and surface skin maintenance"* |
| 2 | **1% Ketoconazole Anti-Dandruff Shampoo (250ml)** | `shampoo` | Liquid shampoo | ₹499 | `GOAL_FIT` | *"1% Ketoconazole Anti-Dandruff Shampoo (250ml) shampoo Liquid shampoo Liquid shampoo designed for regular personal care and surface skin maintenance"* |
| 3 | **1% ZPTO Anti-Dandruff Shampoo (200ml)** | `shampoo` | Liquid shampoo | ₹499 | `GOAL_FIT` | *"1% ZPTO Anti-Dandruff Shampoo (200ml) shampoo Liquid shampoo Liquid shampoo designed for regular personal care and surface skin maintenance"* |

#### For Frizz control & strand softness (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Keratin Conditioner** | `conditioner` | Cream rinse-off conditioner | ₹399 | `GOAL_FIT` | *"Women’s Hair Conditioner for Dry & Frizzy Hair Reduces Frizz: This Hair Conditioner for women is one of the best hair conditioners in India enriched with Silk protein, biotin & niacinamide that helps repair dry, frizzy, and unruly hair"* |
| 2 | **Hair Cleansing and Conditioning Kit** | `other` | Product | ₹749 | `GOAL_FIT` | *"Buy Hair Cleansing & Conditioning Kit for Hair Fall - Bodywise Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login FOR: Hair Fall & Frizz Control Hair Cleansing and Conditioning Kit ₹749 ₹998 24% off Incl of all taxes 4"* |
| 3 | **Hair Strengthening Serum (100mL)** | `serum` | Leave-on hair serum | ₹499 | `GOAL_FIT` | *"Reduction in Frizz"* |

---

## Query q05: "body wash for rough bumpy skin"
**Scenario:** Category + body bumps concept  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "body wash for rough bumpy skin" | `none` | body_wash | primary |

### Shortlisted Matches per Need
#### For Body wash for rough bumpy skin (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for body wash for rough bumpy skin.

---

## Query q06: "acne scars"
**Scenario:** Medical flag trigger query  
**Medical Boundary Flag:** `TRUE (Caution banner shown)`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "acne scars" | `none` | *any suitable* | primary |

### Shortlisted Matches per Need
#### For Acne scars (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for acne scars.

---

## Query q07: "fragrance free"
**Scenario:** Avoidance-first query  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** fragrance  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "fragrance free" | `fragrance_free` | *any suitable* | primary |

### Shortlisted Matches per Need
#### For Fragrance-free formula (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **6% AHA BHA Underarm Roll On - 50 ml - Fragrance free** | `other` | Topical roll-on applicator | ₹399 | `GOAL_FIT` | *"6% AHA BHA Underarm Roll On - 50 ml - Fragrance free other Topical roll-on applicator Topical roll-on applicator designed for regular personal care and surface skin maintenance"* |
| 2 | **Brow & Lash Growth Serum** | `serum` | Topical skin serum | ₹379 | `GOAL_FIT` | *"Fragrance-free: true, unscented formula without added perfume"* |
| 3 | **4% AHA BHA Underarm Roll On - 50 mL - No Fragrance** | `other` | Topical roll-on applicator | ₹329 | `GOAL_FIT` | *"4% AHA BHA Underarm Roll On - 50 mL - No Fragrance other Topical roll-on applicator Topical roll-on applicator designed for regular personal care and surface skin maintenance"* |

---

## Query q08: "xyzabc blip florp 992837"
**Scenario:** Nonsense / gibberish query (tests NO_FIT handling)  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "xyzabc blip florp" | `none` | *any suitable* | primary |

### Shortlisted Matches per Need
#### For Xyzabc blip florp (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for xyzabc blip florp.

---

## Query q09: "sunscreen that leaves no white cast and controls shine"
**Scenario:** Sun protection + oil control  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "sunscreen that leaves no white cast" | `sun_protection` | sunscreen | primary |
| `need_2` | "controls shine" | `oil_control` | *any suitable* | secondary |

### Shortlisted Matches per Need
#### For Daily broad-spectrum sun protection (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Lightest Mineral Sunscreen SPF 50+** | `sunscreen` | Sunscreen lotion | ₹449 | `GOAL_FIT` | *"Buy Lightest Mineral Sunscreen SPF50+ Be Bodywise Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login 100% Mineral Sunscreen - Pregnancy & Lactating Safe Lightest Mineral Sunscreen SPF 50+ ₹449 ₹899 50% off Incl of all taxes 4"* |
| 2 | **Ultra Light Sunscreen SPF50+** | `sunscreen` | Sunscreen lotion | ₹499 | `GOAL_FIT` | *"Buy Safest Ultra Light Sunscreen with SPF 50+ with Korean Anti-Acne Technology - Be Bodywise Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For broad-spectrum sun protection Ultra Light Sunscreen SPF50+ ₹499 Incl of all taxes 4"* |
| 3 | **Body Sunscreen Spray with SPF 50** | `sunscreen` | Sunscreen spray | ₹399 | `GOAL_FIT` | *"Buy Body Sunscreen Spray with SPF 50- Be Bodywise Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For easy, mess-free sun protection Body Sunscreen Spray with SPF 50 ₹399 ₹499 20% off Incl of all taxes 4"* |

#### For Oil & sebum balance (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **2% Salicylic Acid Face Wash** | `face_wash` | Gel / Foaming cleanser | ₹232 | `GOAL_FIT` | *"Buy 2% Salicylic Acid Face Wash for Acne, Blackheads, Whiteheads Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For Mild Occasional Acne - Oily Skin Type - Suitable for 13+ yrs 2% Salicylic Acid Face Wash ₹232 ₹299 22% off Incl of all taxes 4"* |
| 2 | **2.5% Benzoyl Peroxide Facewash** | `face_wash` | Gel / Foaming cleanser | ₹199 | `GOAL_FIT` | *"5% Benzoyl Peroxide An antibacterial agent which helps treat and prevent acne by killing bacteria and control sebum production Learn More Aloe Vera Extract Helps in reducing inflammation and hydrating the skin Learn More Full list of ingredients Ingredient Names Aqua, Decyl Glucoside, Cocamidopropyl Betaine, Isopropyl Myristate, Benzoyl Peroxide, Glycerin, Propylene Glycol, Polysorbate-20, Glyceryl Monostearate, Cetostearyl Alcohol, PEG-40 Hydrogenated Castor Oil, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Phenoxyethanol, Triethanolamine, Tocopheryl Acetate, Aloe barbadensis (Aloe vera) Extract, D-Panthenol, Disodium EDTA"* |
| 3 | **1% Salicylic Acid Face Wash (Foam-Based)** | `face_wash` | Gel / Foaming cleanser | ₹239 | `GOAL_FIT` | *"Sebum Reduction Ingredients: Aqua, C14-16 Olefin Sulfonate, Decyl Glucoside, Sodium Lauroyl Sarcosinate, Maltooligosyl Glucoside and Hydrogenated Starch Hydrolysate, Sodium Hydroxide, Allantoin, Glycerin, Propylene Glycol, Sodium Benzoate and Potassium Sorbate, Glycolic Acid, Salicylic Acid, Polysorbate 20, Coco-Glucoside and Glyceryl Oleate, Cocamidopropyl hydroxysultaine, PEG-120 Methyl Glucose Dioleate"* |

---

## Query q10: "hair fall shampoo and conditioner for thin hair"
**Scenario:** Hair fall look + hair thinning across multiple product types  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "hair fall shampoo" | `hair_fall_look` | shampoo | primary |
| `need_2` | "conditioner for thin hair" | `none` | conditioner | secondary |

### Shortlisted Matches per Need
#### For Reduce visible hair fall & shedding (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **1% Ketoconazole Dandruff Shampoo** | `shampoo` | Liquid shampoo | ₹359 | `STRONG_FORMAT_FIT` | *"New Hair Growth Advanced Hair Growth Serum ₹569 ₹599 5% Off For Hair Thinning Hair Thinning & Hair Fall Advanced Hair Growth Pack with Roll On 25ml ₹899 ₹1148 21% Off For Hair fall control & new baby hair growth Key Ingredients Powerful ingredients backed by science Ketoconazole An antifungal agent used in the prevention and treatment of a variety of fungal infections"* |
| 2 | **1% Ketoconazole Anti-Dandruff Shampoo (250ml)** | `shampoo` | Liquid shampoo | ₹499 | `STRONG_FORMAT_FIT` | *"Persistent dandruff can leave your scalp itchy, inflamed, and even prone to infections, and may trigger hair fall"* |
| 3 | **1% ZPTO Anti-Dandruff Shampoo (200ml)** | `shampoo` | Liquid shampoo | ₹499 | `STRONG_FORMAT_FIT` | *"2k units sold 58 Reviewed Select your severity:👇 Moderate Severe Choose your concern:👇 Dandruff Dandruff & Hair fall Details How to Use"* |

#### For Conditioner for thin hair (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for conditioner for thin hair.

---

## Query q11: "underarm roll-on that stops sweat smell without aluminum or perfume"
**Scenario:** Underarm odor + fragrance avoidance  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "underarm roll-on that stops sweat smell without aluminum or perfume" | `underarm_odor_freshness` | serum | primary |

### Shortlisted Matches per Need
#### For Underarm odor freshness & confidence (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **4% AHA BHA Underarm Roll On - 50 mL - Flora** | `other` | Topical roll-on applicator | ₹329 | `STRONG_FORMAT_FIT` | *"4% AHA BHA Underarm Roll On - 50 mL - Flora other Topical roll-on applicator Topical roll-on applicator designed for regular personal care and surface skin maintenance"* |
| 2 | **4% AHA BHA Underarm Roll On - Fragrance Free - 75 ml** | `other` | Topical roll-on applicator | ₹499 | `STRONG_FORMAT_FIT` | *"4% AHA BHA Underarm Roll On - Fragrance Free - 75 ml other Topical roll-on applicator Topical roll-on applicator designed for regular personal care and surface skin maintenance"* |
| 3 | **4% AHA BHA Underarm Roll On - 50 mL - Aqua** | `other` | Topical roll-on applicator | ₹329 | `STRONG_FORMAT_FIT` | *"4% AHA BHA Underarm Roll On - 50 mL - Aqua other Topical roll-on applicator Topical roll-on applicator designed for regular personal care and surface skin maintenance"* |

---

## Query q12: "salicylic acid body wash for back bumps and strawberry legs"
**Scenario:** Body wash + body bumps synonyms  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "salicylic acid body wash for back bumps" | `body_bumps_look` | body_wash | primary |
| `need_2` | "strawberry legs" | `body_bumps_look` | body_wash | secondary |

### Shortlisted Matches per Need
#### For Reduce the look of body bumps (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **1% Salicylic Acid Body Wash - 250 mL** | `body_wash` | Liquid body wash | ₹329 | `STRONG_FORMAT_FIT` | *"Buy Salicylic Acid Body Wash For Women - Be Bodywise Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For Body Acne 1% Salicylic Acid Body Wash - 250 mL ₹329 ₹349 5% off Incl of all taxes 4"* |
| 2 | **1% Salicylic Acid Body Wash - 375 mL** | `body_wash` | Liquid body wash | ₹399 | `STRONG_FORMAT_FIT` | *"Buy Salicylic Acid Body Wash For Women - Be Bodywise Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login FOR: Body Acne & Strawberry Skin 1% Salicylic Acid Body Wash - 375 mL ₹399 ₹489 18% off Incl of all taxes 4"* |
| 3 | **5% AHA BHA Exfoliating Body Wash - Flora (250ml)** | `body_wash` | Liquid body wash | ₹399 | `STRONG_FORMAT_FIT` | *"� Fights Body Acne & Strawberry Skin: Powered by Glycolic Acid, Lactic Acid & Salicylic Acid to gently exfoliate and unclog pores"* |

#### For Reduce the look of body bumps (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Strawberry Skin Exfoliation kit** | `body_wash` | Liquid body wash | ₹649 | `GOAL_FIT` | *"the bodywash is also so refreshing Ruta T 26/10/2025 My skin loves it Mere pair me strawberry legs ka hamesha issue hota tha mai dresses wagerah avoid karti thi kyuki bilkul acha nahi lagta tha"* |
| 2 | **5% AHA BHA Exfoliating Body Wash - 250 mL** | `body_wash` | Liquid body wash | ₹399 | `GOAL_FIT` | *"� Fights Body Acne & Strawberry Skin: Powered by Glycolic Acid, Lactic Acid & Salicylic Acid to gently exfoliate and unclog pores"* |
| 3 | **5% AHA BHA Exfoliating Body Wash (700ml)** | `body_wash` | Liquid body wash | ₹699 | `GOAL_FIT` | *"Aditi Sharma 19/10/2026 No strawberry legs It has really helped with my strawberry skin after using consistently"* |

---

## Query q13: "hair gummies for thinning hairline and nail strength"
**Scenario:** Supplement format + hair density  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "hair gummies for thinning hairline" | `none` | supplement | primary |
| `need_2` | "nail strength" | `none` | *any suitable* | secondary |

### Shortlisted Matches per Need
#### For Hair gummies for thinning hairline (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for hair gummies for thinning hairline.

#### For Nail strength (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for nail strength.

---

## Query q14: "gentle foaming cleanser for dry sensitive face that feels tight"
**Scenario:** Gentle cleansing + sensitive skin + face wash  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "gentle foaming cleanser for dry sensitive face that feels tight" | `none` | face_wash | primary |

### Shortlisted Matches per Need
#### For Gentle foaming cleanser for dry sensitive face that feels tight (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for gentle foaming cleanser for dry sensitive face that feels tight.

---

## Query q15: "exfoliating body wash and nourishing body lotion for keratosis pilaris"
**Scenario:** Multi-need body care  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "exfoliating body wash" | `exfoliation` | body_wash | primary |
| `need_2` | "nourishing body lotion for keratosis pilaris" | `none` | *any suitable* | secondary |

### Shortlisted Matches per Need
#### For Gentle surface exfoliation (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Strawberry Skin Exfoliation kit** | `body_wash` | Liquid body wash | ₹649 | `STRONG_FORMAT_FIT` | *"🌟 Our Strawberry Skin Exfoliation Kit contains: 1% Salicylic Acid Body Wash: Exfoliates and removes dead skin cells around and on top of ingrown hair 10% AHA Body Scrub: It has 10% Lactic Acid which helps to provide deep exfoliation and boost cell turnover"* |
| 2 | **5% AHA BHA Exfoliating Body Wash - 250 mL** | `body_wash` | Liquid body wash | ₹399 | `STRONG_FORMAT_FIT` | *"� Fights Body Acne & Strawberry Skin: Powered by Glycolic Acid, Lactic Acid & Salicylic Acid to gently exfoliate and unclog pores"* |
| 3 | **5% AHA BHA Exfoliating Body Wash - Flora (250ml)** | `body_wash` | Liquid body wash | ₹399 | `STRONG_FORMAT_FIT` | *"� Fights Body Acne & Strawberry Skin: Powered by Glycolic Acid, Lactic Acid & Salicylic Acid to gently exfoliate and unclog pores"* |

#### For Nourishing body lotion for keratosis pilaris (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for nourishing body lotion for keratosis pilaris.

---

## Query q16: "scalp serum for itchy dandruff flakes and dry scalp comfort"
**Scenario:** Scalp care + dandruff clarifying + scalp comfort  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "scalp serum for itchy dandruff flakes" | `dandruff_clarifying` | serum | primary |
| `need_2` | "dry scalp comfort" | `scalp_comfort` | shampoo | secondary |

### Shortlisted Matches per Need
#### For Flake & dandruff clarifying (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Advanced Hair Growth Serum Roll-On (Pack of 2)** | `serum` | Leave-on hair serum | ₹969 | `STRONG_FORMAT_FIT` | *"5 Dandruff Control 1% Ketoconazole Dandruff Shampoo ₹359 ADD 4"* |
| 2 | **1% Ketoconazole Dandruff Shampoo** | `shampoo` | Liquid shampoo | ₹359 | `GOAL_FIT` | *"1% Ketoconazole Dandruff Shampoo shampoo Liquid shampoo Liquid shampoo designed for regular personal care and surface skin maintenance"* |
| 3 | **1% Ketoconazole Anti-Dandruff Shampoo (250ml)** | `shampoo` | Liquid shampoo | ₹499 | `GOAL_FIT` | *"1% Ketoconazole Anti-Dandruff Shampoo (250ml) shampoo Liquid shampoo Liquid shampoo designed for regular personal care and surface skin maintenance"* |

#### For Scalp comfort & itch relief (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **1% ZPTO Anti-Dandruff Shampoo (200ml)** | `shampoo` | Liquid shampoo | ₹499 | `GOAL_FIT` | *"New Hair Growth Advanced Hair Growth Serum ₹569 ₹599 5% Off For Hair Thinning Hair Thinning & Hair Fall Advanced Hair Growth Pack with Roll On 25ml ₹899 ₹1148 21% Off For Hair fall control & new baby hair growth Key Ingredients Powerful ingredients backed by science 1% ZPTO: Fights dandruff-causing fungus effectively Learn More Salicylic Acid: Exfoliates flakes and clears buildup Learn More Pentavitin: Locks in long-lasting scalp hydration Learn More Allantoin: Repairs and calms dry scalp Learn More Full list of ingredients Aqua, Sodium Lauroyl Sarcosinate, Cocamidopropyl betaine, Sodium Cocoyl Isethionate, Sodium Cocoamphoacetate, Dimethiconol (and) TEA-Dodecylbenzenesulfonate, Glycerin , Tea Tree (Melaleuca Alternifolia) Leaf Extract, Zinc Pyrithione (50% active), Amodimethicone (and) Trideceth-12 (and) Cetrimonium Chloride, Glycol Stearate, Erythritol, Perfume, Piroctone Olamine, Styrene/Acrylates Copolymer (and) Coco-Glucoside, Allantoin, Climbazole, Panthenol, Polyquaternium-73, Saccharide Isomerate , Salicylic Acid, Cyamopsis Tetragonoloba (Guar) Gum, Polyquaternium-10, Menthol , Disodium EDTA, Methylchloroisothiazolinone (and) Methylisothiazolinone, Citric acid How to Use This 1% ZPTO Anti Dandruff Shampoo Apply to wet hair and massage into the scalp"* |

---

## Query q17: "dark spot serum for uneven pigmentation and dullness"
**Scenario:** Dark spots + brightening look  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "dark spot serum for uneven pigmentation" | `dark_spot_look` | serum | primary |
| `need_2` | "dullness" | `none` | *any suitable* | secondary |

### Shortlisted Matches per Need
#### For Reduce the look of dark spots (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Advanced Hair Growth Serum Roll-On (Pack of 2)** | `serum` | Leave-on hair serum | ₹969 | `STRONG_FORMAT_FIT` | *"7 Underarm Odour/ Pigmentation 4% AHA BHA Underarm Roll On - 50 mL - Flora ₹329 ₹349 ADD 4"* |
| 2 | **2% Salicylic Acid Face Wash** | `face_wash` | Gel / Foaming cleanser | ₹232 | `GOAL_FIT` | *"Does Salicylic Acid work on dark spots"* |
| 3 | **Body Exfoliation & Pigmentation Kit** | `other` | Product | ₹848 | `GOAL_FIT` | *"� Pigmentation Repair Cream - powered by 2% Urea to fade dark spots, 2"* |

#### For Dullness (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for dullness.

---

## Query q18: "frizz control hair serum and split end nourishment"
**Scenario:** Hair frizz + hair nourishment  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "frizz control hair serum" | `frizz_control` | serum | primary |
| `need_2` | "split end nourishment" | `none` | *any suitable* | secondary |

### Shortlisted Matches per Need
#### For Frizz control & strand softness (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Advanced Hair Growth Serum Roll-On (Pack of 2)** | `serum` | Leave-on hair serum | ₹969 | `STRONG_FORMAT_FIT` | *"5 Dry & Frizzy Hair Keratin Shampoo for Hair Fall ₹449 ₹499 ADD 4"* |
| 2 | **Hair Strengthening Serum (100mL)** | `serum` | Leave-on hair serum | ₹499 | `STRONG_FORMAT_FIT` | *"Reduction in Frizz"* |
| 3 | **Hair Strengthening Serum (50mL)** | `serum` | Leave-on hair serum | ₹299 | `STRONG_FORMAT_FIT` | *"Reduction in Frizz"* |

#### For Split end nourishment (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for split end nourishment.

---

## Query q19: "niacinamide serum for open pores and oily t-zone"
**Scenario:** Pores + oil control in serum format  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "niacinamide serum for open pores" | `pore_look` | serum | primary |
| `need_2` | "oily t-zone" | `none` | *any suitable* | secondary |

### Shortlisted Matches per Need
#### For Refine visible pore appearance (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **2% Salicylic Acid Face Wash** | `face_wash` | Gel / Foaming cleanser | ₹232 | `GOAL_FIT` | *"Tightening Pores : Prevents future breakouts & shrinks pores"* |
| 2 | **Body Exfoliation & Pigmentation Kit** | `other` | Product | ₹848 | `GOAL_FIT` | *"� 7% Glycolic Acid Stick - gently exfoliates, unclogs pores, and smoothens rough, bumpy skin - in a mess-free, travel-friendly format"* |
| 3 | **1% Salicylic Acid Face Wash (Foam-Based)** | `face_wash` | Gel / Foaming cleanser | ₹239 | `GOAL_FIT` | *"Tightens Pores: Our anti-acne face wash for women unclogs pores and destroys acne-causing bacteria, preventing future breakouts and shrinking open pores"* |

#### For Oily t-zone (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for oily t-zone.

---

## Query q20: "underarm roll on and body wash for summer freshness"
**Scenario:** Multi-need underarm + body cleansing  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "underarm roll on" | `underarm_odor_freshness` | *any suitable* | primary |
| `need_2` | "body wash for summer freshness" | `none` | body_wash | secondary |

### Shortlisted Matches per Need
#### For Underarm odor freshness & confidence (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **4% AHA BHA Underarm Roll On - 50 mL - Flora** | `other` | Topical roll-on applicator | ₹329 | `GOAL_FIT` | *"4% AHA BHA Underarm Roll On - 50 mL - Flora other Topical roll-on applicator Topical roll-on applicator designed for regular personal care and surface skin maintenance"* |
| 2 | **4% AHA BHA Underarm Roll On - Fragrance Free - 75 ml** | `other` | Topical roll-on applicator | ₹499 | `GOAL_FIT` | *"4% AHA BHA Underarm Roll On - Fragrance Free - 75 ml other Topical roll-on applicator Topical roll-on applicator designed for regular personal care and surface skin maintenance"* |
| 3 | **4% AHA BHA Underarm Roll On - 50 mL - Aqua** | `other` | Topical roll-on applicator | ₹329 | `GOAL_FIT` | *"4% AHA BHA Underarm Roll On - 50 mL - Aqua other Topical roll-on applicator Topical roll-on applicator designed for regular personal care and surface skin maintenance"* |

#### For Body wash for summer freshness (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for body wash for summer freshness.

---

## Query q21: "daily non-sticky sun protection spf 50 for sensitive skin"
**Scenario:** Sun protection + sensitive friendly  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "daily non-sticky sun protection spf 50 for sensitive skin" | `sun_protection, sensitive_friendly` | sunscreen | primary |

### Shortlisted Matches per Need
#### For Daily broad-spectrum sun protection (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Lightest Mineral Sunscreen SPF 50+** | `sunscreen` | Sunscreen lotion | ₹449 | `GOAL_FIT` | *"Buy Lightest Mineral Sunscreen SPF50+ Be Bodywise Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login 100% Mineral Sunscreen - Pregnancy & Lactating Safe Lightest Mineral Sunscreen SPF 50+ ₹449 ₹899 50% off Incl of all taxes 4"* |
| 2 | **Body Sunscreen Spray with SPF 50** | `sunscreen` | Sunscreen spray | ₹399 | `GOAL_FIT` | *"Buy Body Sunscreen Spray with SPF 50- Be Bodywise Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For easy, mess-free sun protection Body Sunscreen Spray with SPF 50 ₹399 ₹499 20% off Incl of all taxes 4"* |
| 3 | **Body Sunscreen Spray with SPF 50** | `sunscreen` | Sunscreen spray | ₹249 | `GOAL_FIT` | *"Buy Body Sunscreen Spray with SPF 50- Be Bodywise Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For easy, mess-free sun protection Body Sunscreen Spray with SPF 50 ₹249 ₹499 50% off Incl of all taxes 4"* |

---

## Query q22: "sulfate free clarifying shampoo for oily scalp"
**Scenario:** Shampoo + sulfate avoidance + scalp oil control  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** sulphates  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "sulfate free clarifying shampoo for oily scalp" | `none` | shampoo | primary |

### Shortlisted Matches per Need
#### For Sulfate free clarifying shampoo for oily scalp (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for sulfate free clarifying shampoo for oily scalp.

---

## Query q23: "hair density serum with redensyl and biotin gummies"
**Scenario:** Topical serum + ingestible supplement multi-format  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "hair density serum with redensyl" | `hair_density_look` | serum | primary |
| `need_2` | "biotin gummies" | `none` | supplement | secondary |

### Shortlisted Matches per Need
#### For Visible hairline & parting density (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Advanced Hair Growth Serum** | `serum` | Leave-on hair serum | ₹849 | `STRONG_FORMAT_FIT` | *"Buy Hair Growth Pack For Women - Bodywise Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For Hair Thinning & New Hair Regrowth (50mL) Advanced Hair Growth Serum ₹849 ₹899 5% off Incl of all taxes 4"* |
| 2 | **Advanced Hair Growth Serum (30ml)** | `serum` | Leave-on hair serum | ₹349 | `STRONG_FORMAT_FIT` | *"Buy Hair Growth Pack For Women - Bodywise Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For Hair Thinning & New Hair Regrowth Advanced Hair Growth Serum (30ml) ₹349 ₹699 50% off Incl of all taxes 4"* |
| 3 | **Advanced Hair Growth Serum Roll-On for Post-Pregnancy Hair Thinning** | `serum` | Leave-on hair serum | ₹569 | `STRONG_FORMAT_FIT` | *"Specially made for 👩🏻‍🍼breastfeeding mothers suffering from post-pregnancy hair loss Hair Growth Serum Roll-On is India's first hair treatment with a roll-on applicator for precise application 5X Faster Hair Growth with 23% Hair Growth Actives This serum is infused with 2% Aminexil,1% Rosemary, 3% Redensyl & 2% Anagain 🌱 📈Boosts Hair Growth 💯Promotes Hair Density ⬆️Increases Hair Thickness"* |

#### For Biotin gummies (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for biotin gummies.

---

## Query q24: "body lotion for very dry itchy winter skin"
**Scenario:** Hydration + sensitive body care  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "body lotion for very dry itchy winter skin" | `none` | *any suitable* | primary |

### Shortlisted Matches per Need
#### For Body lotion for very dry itchy winter skin (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for body lotion for very dry itchy winter skin.

---

## Query q25: "cystic acne infection with pus and painful inflammation"
**Scenario:** Severe medical symptom query (medical flag required)  
**Medical Boundary Flag:** `TRUE (Caution banner shown)`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "cystic acne infection with pus" | `none` | *any suitable* | primary |
| `need_2` | "painful inflammation" | `none` | *any suitable* | secondary |

### Shortlisted Matches per Need
#### For Cystic acne infection with pus (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for cystic acne infection with pus.

#### For Painful inflammation (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for painful inflammation.

---

## Query q26: "severe eczema bleeding rash on hands"
**Scenario:** Eczema bleeding condition (medical flag required)  
**Medical Boundary Flag:** `TRUE (Caution banner shown)`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "severe eczema bleeding rash on hands" | `none` | *any suitable* | primary |

### Shortlisted Matches per Need
#### For Severe eczema bleeding rash on hands (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for severe eczema bleeding rash on hands.

---

## Query q27: "underarm roll on without fragrance"
**Scenario:** Category + avoidance combination  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** fragrance  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "underarm roll on without fragrance" | `underarm_odor_freshness` | *any suitable* | primary |

### Shortlisted Matches per Need
#### For Underarm odor freshness & confidence (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **6% AHA BHA Underarm Roll On - 50 ml - Fragrance free** | `other` | Topical roll-on applicator | ₹399 | `GOAL_FIT` | *"6% AHA BHA Underarm Roll On - 50 ml - Fragrance free other Topical roll-on applicator Topical roll-on applicator designed for regular personal care and surface skin maintenance"* |
| 2 | **4% AHA BHA Underarm Roll On - 50 mL - No Fragrance** | `other` | Topical roll-on applicator | ₹329 | `GOAL_FIT` | *"4% AHA BHA Underarm Roll On - 50 mL - No Fragrance other Topical roll-on applicator Topical roll-on applicator designed for regular personal care and surface skin maintenance"* |
| 3 | **4% AHA BHA Underarm Roll On - Fragrance Free - 75 ml** | `other` | Topical roll-on applicator | ₹499 | `GOAL_FIT` | *"4% AHA BHA Underarm Roll On - Fragrance Free - 75 ml other Topical roll-on applicator Topical roll-on applicator designed for regular personal care and surface skin maintenance"* |

---

## Query q28: "lightweight water gel moisturizer for oily skin and shine"
**Scenario:** Moisturizer + oil control  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "lightweight water gel moisturizer for oily skin" | `oil_control` | *any suitable* | primary |
| `need_2` | "shine" | `oil_control` | *any suitable* | secondary |

### Shortlisted Matches per Need
#### For Oil & sebum balance (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **2% Salicylic Acid Face Wash** | `face_wash` | Gel / Foaming cleanser | ₹232 | `GOAL_FIT` | *"Buy 2% Salicylic Acid Face Wash for Acne, Blackheads, Whiteheads Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For Mild Occasional Acne - Oily Skin Type - Suitable for 13+ yrs 2% Salicylic Acid Face Wash ₹232 ₹299 22% off Incl of all taxes 4"* |
| 2 | **2.5% Benzoyl Peroxide Facewash** | `face_wash` | Gel / Foaming cleanser | ₹199 | `GOAL_FIT` | *"5% Benzoyl Peroxide An antibacterial agent which helps treat and prevent acne by killing bacteria and control sebum production Learn More Aloe Vera Extract Helps in reducing inflammation and hydrating the skin Learn More Full list of ingredients Ingredient Names Aqua, Decyl Glucoside, Cocamidopropyl Betaine, Isopropyl Myristate, Benzoyl Peroxide, Glycerin, Propylene Glycol, Polysorbate-20, Glyceryl Monostearate, Cetostearyl Alcohol, PEG-40 Hydrogenated Castor Oil, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Phenoxyethanol, Triethanolamine, Tocopheryl Acetate, Aloe barbadensis (Aloe vera) Extract, D-Panthenol, Disodium EDTA"* |
| 3 | **1% Salicylic Acid Face Wash (Foam-Based)** | `face_wash` | Gel / Foaming cleanser | ₹239 | `GOAL_FIT` | *"Sebum Reduction Ingredients: Aqua, C14-16 Olefin Sulfonate, Decyl Glucoside, Sodium Lauroyl Sarcosinate, Maltooligosyl Glucoside and Hydrogenated Starch Hydrolysate, Sodium Hydroxide, Allantoin, Glycerin, Propylene Glycol, Sodium Benzoate and Potassium Sorbate, Glycolic Acid, Salicylic Acid, Polysorbate 20, Coco-Glucoside and Glyceryl Oleate, Cocamidopropyl hydroxysultaine, PEG-120 Methyl Glucose Dioleate"* |

#### For Oil & sebum balance (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Advanced Hair Growth Serum Roll-On (Pack of 2)** | `serum` | Leave-on hair serum | ₹969 | `GOAL_FIT` | *"Priti Lokesh 05/09/2025 Longer Hair It makes my hair a little greasy, but I am happy seeing new growth and I will continue to apply"* |
| 2 | **Folli Advanced+ Hair Growth Serum Roll On - 3% Redensyl, 3% Rosemary (25 ml)** | `serum` | Leave-on hair serum | ₹849 | `GOAL_FIT` | *"4 508 Reviews 5 274 4 159 3 75 2 1 Finally a serum that doesn’t feel like a serum I’ve always avoided hair serums because they drip and make my hair greasy"* |
| 3 | **Frizz Control and Damage Repair Hair Serum** | `serum` | Topical skin serum | ₹599 | `GOAL_FIT` | *"🪶Lightweight finish : Non-oily, non-greasy care that won’t weigh your hair down"* |

---

## Query q29: "gentle intimate wash for daily feminine hygiene"
**Scenario:** Intimate care + gentle cleansing  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "gentle intimate wash for daily feminine hygiene" | `none` | *any suitable* | primary |

### Shortlisted Matches per Need
#### For Gentle intimate wash for daily feminine hygiene (`NO_FIT`)
> **NO_FIT:** No products in the catalogue met the verified fit requirements for gentle intimate wash for daily feminine hygiene.

---

## Query q30: "shampoo for hair fall and hair growth oil"
**Scenario:** Multi-need: hair fall shampoo + hair oil format  
**Medical Boundary Flag:** `FALSE`  
**Avoidances Detected:** None  

### Understood Needs
| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `need_1` | "shampoo for hair fall" | `hair_fall_look` | shampoo | primary |
| `need_2` | "hair growth oil" | `hair_density_look` | *any suitable* | secondary |

### Shortlisted Matches per Need
#### For Reduce visible hair fall & shedding (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **1% Ketoconazole Dandruff Shampoo** | `shampoo` | Liquid shampoo | ₹359 | `STRONG_FORMAT_FIT` | *"New Hair Growth Advanced Hair Growth Serum ₹569 ₹599 5% Off For Hair Thinning Hair Thinning & Hair Fall Advanced Hair Growth Pack with Roll On 25ml ₹899 ₹1148 21% Off For Hair fall control & new baby hair growth Key Ingredients Powerful ingredients backed by science Ketoconazole An antifungal agent used in the prevention and treatment of a variety of fungal infections"* |
| 2 | **1% Ketoconazole Anti-Dandruff Shampoo (250ml)** | `shampoo` | Liquid shampoo | ₹499 | `STRONG_FORMAT_FIT` | *"Persistent dandruff can leave your scalp itchy, inflamed, and even prone to infections, and may trigger hair fall"* |
| 3 | **1% ZPTO Anti-Dandruff Shampoo (200ml)** | `shampoo` | Liquid shampoo | ₹499 | `STRONG_FORMAT_FIT` | *"2k units sold 58 Reviewed Select your severity:👇 Moderate Severe Choose your concern:👇 Dandruff Dandruff & Hair fall Details How to Use"* |

#### For Visible hairline & parting density (`MATCHED`)
| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | **Advanced Hair Growth Serum** | `serum` | Leave-on hair serum | ₹849 | `GOAL_FIT` | *"Buy Hair Growth Pack For Women - Bodywise Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For Hair Thinning & New Hair Regrowth (50mL) Advanced Hair Growth Serum ₹849 ₹899 5% off Incl of all taxes 4"* |
| 2 | **Advanced Hair Growth Serum Roll-On for Post-Pregnancy Hair Thinning** | `serum` | Leave-on hair serum | ₹569 | `GOAL_FIT` | *"Specially made for 👩🏻‍🍼breastfeeding mothers suffering from post-pregnancy hair loss Hair Growth Serum Roll-On is India's first hair treatment with a roll-on applicator for precise application 5X Faster Hair Growth with 23% Hair Growth Actives This serum is infused with 2% Aminexil,1% Rosemary, 3% Redensyl & 2% Anagain 🌱 📈Boosts Hair Growth 💯Promotes Hair Density ⬆️Increases Hair Thickness"* |
| 3 | **Advanced Hair Growth Roll On 50mL** | `serum` | Leave-on hair serum | ₹849 | `GOAL_FIT` | *"Hair Growth Serum with Redensyl, Procapil, Baicapil (Paraben Free) Build Your Own Kit Shop By Category Hair Body Care Winter Care Health & Fitness Special Offers Unlocked Sun Protection Face Shop All Honest Reports Login For Hair Thinning & New Hair Growth Advanced Hair Growth Roll On 50mL ₹849 ₹999 15% off Incl of all taxes 4"* |

---
