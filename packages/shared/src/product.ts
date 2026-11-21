import { z } from "zod";
import { GoalIdSchema } from "./goals";

export const ProductCategorySchema = z.enum([
  "body_wash",
  "face_wash",
  "serum",
  "shampoo",
  "conditioner",
  "hair_oil",
  "supplement",
  "sunscreen",
  "moisturizer",
  "roll_on",
  "kit",
  "accessory",
  "other",
]);

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const ProductRecordSchema = z
  .object({
    id: z.string().uuid({ message: "Product ID must be a valid UUID" }),
    slug: z
      .string()
      .min(2)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: "Slug must be lowercase alphanumeric with hyphens",
      }),
    official_name: z.string().min(2),
    brand_line: z.string().min(2),
    category: ProductCategorySchema,
    supported_goals: z
      .array(GoalIdSchema)
      .min(1, { message: "Product must support at least one controlled goal" }),
    format: z.string().min(2),
    size: z.string().min(1),
    official_description: z.string().min(10),
    label_directions: z.string().min(5),
    ingredients: z.array(z.string()).nullable(),
    cautions: z.array(z.string()).nullable(),
    fragrance_free: z.boolean().nullable(),
    suitable_for: z.array(z.string()).nullable(),
    price_inr: z.number().positive().nullable(),
    price_source: z.string().nullable(),
    price_checked_at: z.string().datetime({ offset: true }).nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).nullable()),
    image_url: z.string().url().nullable().or(z.string().regex(/^\/[^/].*/).nullable()),
    image_source: z.string().nullable(),
    image_license: z.string().nullable(),
    source_url: z.string().url().nullable().or(z.literal("").nullable()),
    last_verified_at: z.string().regex(/^\d{4}-\d{2}-\d{2}/).nullable(),
    catalog_version: z.string().min(1),
    is_demo: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Non-negotiable fact integrity rule (Rule 3)
    // Non-demo products must carry verifiable provenance
    if (!data.is_demo) {
      if (!data.source_url || data.source_url.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Non-demo products MUST have a valid source_url from official catalogue",
          path: ["source_url"],
        });
      }
      if (!data.last_verified_at || data.last_verified_at.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Non-demo products MUST have a valid last_verified_at timestamp",
          path: ["last_verified_at"],
        });
      }
    }
  });

export type ProductRecord = z.infer<typeof ProductRecordSchema>;
