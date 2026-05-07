import { z } from "zod";

export const createProductSchema = z.object({
  slug: z.string().min(1).max(191),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  isActive: z.boolean().default(true),
  categoryId: z.number().int().positive(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
