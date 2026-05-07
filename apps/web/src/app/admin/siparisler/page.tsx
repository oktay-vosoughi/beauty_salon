import type { Metadata } from "next";
import AdminOrdersClient from "./AdminOrdersClient";

export const metadata: Metadata = { title: "Admin — Siparişler" };

export default function AdminSiparislerPage() {
  return <AdminOrdersClient />;
}
