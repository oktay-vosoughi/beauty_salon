import { z } from "zod";

export const shippingAddressSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  line1: z.string().min(1).max(255),
  district: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  postalCode: z.string().min(5).max(10),
});

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
