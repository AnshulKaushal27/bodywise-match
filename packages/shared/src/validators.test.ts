import { describe, it, expect } from "vitest";
import {
  ProductRecordSchema,
  ParsedNeedsSchema,
  FeedbackSchema,
  CustomerExperienceRecordSchema,
  ExperienceSubmissionSchema,
  GoalIdSchema,
  CONTROLLED_GOALS,
  OFFICIAL_SUPPORT_CHANNELS,
} from "./index";

describe("Shared Zod Validators & Schemas", () => {
  describe("ProductRecordSchema (Rule 3 & Rule 5 Fact Integrity)", () => {
    const validProduct = {
      id: "a0000000-0000-0000-0000-000000000001",
      slug: "salicylic-body-wash",
      official_name: "1% Salicylic Acid Body Wash",
      brand_line: "Bodywise Care",
      category: "body_wash",
      supported_goals: ["body_bumps_look"],
      format: "gel body wash",
      size: "250 ml",
      official_description: "Gentle daily foaming cleanser for body skin texture and bumps.",
      label_directions: "Apply onto wet skin, lather gently, rinse thoroughly with water.",
      ingredients: ["Aqua", "Sodium Lauroyl Sarcosinate", "Salicylic Acid"],
      cautions: ["For external use only. Avoid contact with eyes."],
      fragrance_free: true,
      suitable_for: ["All skin types"],
      price_inr: 499,
      price_source: "Official web store",
      price_checked_at: "2026-11-18",
      image_url: "/placeholder-product.svg",
      image_source: "Official packshot",
      image_license: "Internal use",
      source_url: "https://bebodywise.com/product/salicylic-wash",
      last_verified_at: "2026-11-18",
      catalog_version: "2026.11",
      is_demo: true,
    };

    it("accepts fully specified valid demo product", () => {
      const result = ProductRecordSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID for product id", () => {
      const result = ProductRecordSchema.safeParse({
        ...validProduct,
        id: "not-a-valid-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Product ID must be a valid UUID");
      }
    });

    it("rejects uppercase or invalid characters in slug", () => {
      const result = ProductRecordSchema.safeParse({
        ...validProduct,
        slug: "Salicylic_Wash!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Slug must be lowercase alphanumeric");
      }
    });

    it("rejects empty supported_goals array", () => {
      const result = ProductRecordSchema.safeParse({
        ...validProduct,
        supported_goals: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Product must support at least one controlled goal");
      }
    });

    it("enforces verifiable provenance for non-demo products (Rule 3)", () => {
      const nonDemoMissingSource = {
        ...validProduct,
        is_demo: false,
        source_url: "",
      };
      const result = ProductRecordSchema.safeParse(nonDemoMissingSource);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages.some((m) => m.includes("Non-demo products MUST have a valid source_url"))).toBe(true);
      }
    });

    it("allows null for unverified fields without failing validation (Fact Integrity)", () => {
      const unverifiedProduct = {
        ...validProduct,
        ingredients: null,
        cautions: null,
        fragrance_free: null,
        price_inr: null,
        last_verified_at: null,
      };
      const result = ProductRecordSchema.safeParse(unverifiedProduct);
      expect(result.success).toBe(true);
    });
  });

  describe("ParsedNeedsSchema (Rule 2 AI Intent Extraction)", () => {
    it("accepts minimal valid parsed needs with defaults", () => {
      const result = ParsedNeedsSchema.safeParse({
        goal: "hair_density_appearance",
        confidence: "high",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.format_preferences).toEqual([]);
        expect(result.data.avoidances).toEqual([]);
        expect(result.data.uncertainties).toEqual([]);
        expect(result.data.routine_context).toBeNull();
      }
    });

    it("rejects invalid confidence value", () => {
      const result = ParsedNeedsSchema.safeParse({
        goal: "hair_density_appearance",
        confidence: "very_high",
      });
      expect(result.success).toBe(false);
    });

    it("accepts complex routine context structure", () => {
      const result = ParsedNeedsSchema.safeParse({
        goal: "body_skin_roughness",
        confidence: "medium",
        routine_context: {
          frequency: "daily",
          current_actives: ["niacinamide"],
          shower_timing: "evening",
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("FeedbackSchema", () => {
    it("accepts valid shortlist feedback with rating enum and default aggregate_consent false", () => {
      const result = FeedbackSchema.safeParse({
        session_id: "session-abc-123",
        rating: "yes",
        reason: "Matched format preference",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.aggregate_consent).toBe(false);
      }
    });

    it("rejects feedback missing both request_id and session_id", () => {
      const result = FeedbackSchema.safeParse({
        rating: "somewhat",
        notes: "Good options",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Either request_id or session_id must be provided");
      }
    });

    it("rejects notes exceeding 500 characters", () => {
      const result = FeedbackSchema.safeParse({
        session_id: "sess-1",
        notes: "x".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Customer Experience Schemas", () => {
    const validExpRecord = {
      id: "exp-001",
      product_id: "a0000000-0000-0000-0000-000000000001",
      product_slug: "salicylic-body-wash",
      duration_bucket: "1-3 months",
      usage_consistency: "daily",
      self_reported_outcome: "better",
      comfort_reaction: "no issue",
      moderated_text: "Texture felt noticeably smoother by week 4.",
      moderation_status: "published",
      publication_consent: true,
      created_at: "2026-11-10",
      source: "Post-trial follow-up",
      is_demo: true,
    };

    it("accepts valid published customer experience record", () => {
      const result = CustomerExperienceRecordSchema.safeParse(validExpRecord);
      expect(result.success).toBe(true);
    });

    it("validates ExperienceSubmission with 300 char note limit and defaults consent to false", () => {
      const result = ExperienceSubmissionSchema.safeParse({
        product_slug: "salicylic-body-wash",
        duration_bucket: "2-4 weeks",
        usage_consistency: "few times a week",
        self_reported_outcome: "no change",
        comfort_reaction: "mild irritation",
        optional_text: "Experienced slight tingling on dry areas.",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.consent_recommendations).toBe(false);
        expect(result.data.consent_publication).toBe(false);
      }
    });

    it("rejects ExperienceSubmission with text over 300 characters", () => {
      const result = ExperienceSubmissionSchema.safeParse({
        product_slug: "salicylic-body-wash",
        duration_bucket: "2-4 weeks",
        usage_consistency: "daily",
        self_reported_outcome: "better",
        comfort_reaction: "no issue",
        optional_text: "A".repeat(301),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Controlled Goals & Support Channels", () => {
    it("validates every goal in CONTROLLED_GOALS conforms to valid schema and categories", () => {
      expect(CONTROLLED_GOALS.length).toBeGreaterThan(0);
      for (const goal of CONTROLLED_GOALS) {
        const idParse = GoalIdSchema.safeParse(goal.id);
        expect(idParse.success).toBe(true);
        expect(goal.label.length).toBeGreaterThan(3);
        expect(["hair", "scalp", "underarm", "body", "skincare"]).toContain(goal.category);
      }
    });

    it("validates official support channels with last_checked date and source", () => {
      expect(OFFICIAL_SUPPORT_CHANNELS.length).toBeGreaterThan(0);
      for (const channel of OFFICIAL_SUPPORT_CHANNELS) {
        expect(channel.id).toBeDefined();
        expect(channel.name).toBeDefined();
        expect(channel.source.length).toBeGreaterThan(3);
        expect(channel.last_checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(["email", "chat", "portal", "phone"]).toContain(channel.type);
      }
    });
  });
});
