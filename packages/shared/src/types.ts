export type Role = "USER" | "ADMIN";
export type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
export type PaymentStatus = "INIT" | "PENDING" | "SUCCESS" | "FAILED";
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}
