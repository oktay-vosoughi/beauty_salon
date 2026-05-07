import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(2000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
