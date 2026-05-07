import type { Metadata } from "next";
import AdminProductsClient from "./AdminProductsClient";

export const metadata: Metadata = { title: "Admin — Ürünler" };

export default function AdminUrunlerPage() {
  return <AdminProductsClient />;
}
