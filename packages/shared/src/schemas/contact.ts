import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(191),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(2000),
});

export type ContactInput = z.infer<typeof contactSchema>;
