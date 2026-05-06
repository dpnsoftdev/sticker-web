import { z } from "zod";

export const variantSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Variant name is required"),
  description: z.string().optional().default(""),
  price: z.coerce.number().int().min(0, "Price must be ≥ 0"),
  stock: z.coerce.number().int().min(0, "Stock must be a whole number ≥ 0"),
});

export const productSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    categoryId: z.string().min(1, "Select a category"),
    productType: z.enum(["in_stock", "preorder"]),
    price: z.coerce
      .number()
      .int()
      .min(0, "Price must be ≥ 0")
      .nullable()
      .optional(),
    currency: z.string().default("VND"),
    priceNote: z.string().optional(),
    shippingNote: z.string().optional(),
    stock: z.coerce.number().int().min(0, "Stock must be a whole number ≥ 0"),
    sellerName: z.string().min(1, "Seller name is required"),
    description: z.string().optional().default(""),
    sizeDescription: z.string().optional(),
    packageDescription: z.string().optional(),
    preorderDescription: z.string().optional(),
    preorderStartDate: z.string().optional().default(""),
    preorderEndDate: z.string().optional().default(""),
    hasVariants: z.boolean().default(false),
    /** Index of the variant to use as default when hasVariants is true (0-based). */
    defaultVariantIndex: z.number().int().min(0).default(0),
    variants: z.array(variantSchema).default([]),
  })
  .superRefine((val, ctx) => {
    if (val.hasVariants) {
      if (val.variants.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message: "Add at least one variant when using With variants.",
        });
      }
    } else {
      if (val.variants.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message: "Remove variants when using Single product.",
        });
      }
    }
    if (val.productType === "preorder") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().slice(0, 10);
      if (!val.preorderStartDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["preorderStartDate"],
          message: "Start date is required for preorder.",
        });
      } else if (val.preorderStartDate < todayStr) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["preorderStartDate"],
          message: "Start date must be today or later.",
        });
      }
      if (!val.preorderEndDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["preorderEndDate"],
          message: "End date is required for preorder.",
        });
      } else if (val.preorderStartDate) {
        const start = new Date(val.preorderStartDate + "T00:00:00");
        const minEnd = new Date(start);
        minEnd.setDate(minEnd.getDate() + 1);
        const minEndStr = minEnd.toISOString().slice(0, 10);
        if (val.preorderEndDate < minEndStr) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["preorderEndDate"],
            message: "End date must be at least 1 day after start date.",
          });
        }
      }
    }
  });

export type ProductFormValues = z.infer<typeof productSchema>;

export const defaultFormValues: ProductFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  productType: "in_stock",
  price: 0,
  stock: 0,
  currency: "VND",
  priceNote: "",
  shippingNote: "",
  sellerName: "",
  description: "",
  sizeDescription: "",
  packageDescription: "",
  preorderDescription: "",
  preorderStartDate: "",
  preorderEndDate: "",
  hasVariants: false,
  defaultVariantIndex: 0,
  variants: [],
};
