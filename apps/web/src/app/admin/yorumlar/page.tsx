import type { Metadata } from "next";
import AdminReviewsClient from "./AdminReviewsClient";

export const metadata: Metadata = { title: "Admin — Yorumlar" };

export default function AdminYorumlarPage() {
  return <AdminReviewsClient />;
}
