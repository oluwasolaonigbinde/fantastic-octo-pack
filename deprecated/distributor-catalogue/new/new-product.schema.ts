import { z } from "zod";

export const newProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Product name is required" })
    .min(2, { message: "Please provide a valid product name" }),

  category: z.string().trim().min(1, { message: "Category is required" }),

  quantityAvailable: z
    .number()
    .min(1, { message: "Quantity must be at least 1" }),

  priceMode: z
    .enum(["fixed", "negotiable"])
    .refine((val) => !!val, { message: "Price mode is required" }),


  pricePerUnit: z
    .number()
    .min(1, { message: "Price must be at least 1" }),

  countries: z
    .array(z.string())
    .min(1, { message: "Please select at least one country" }),

  isRfqAvailable: z.boolean(),

  keySpecifications: z
    .string()
    .trim()
    .min(1, { message: "Key specifications is required" }),
});

export type NewProductForm = z.infer<typeof newProductSchema>;