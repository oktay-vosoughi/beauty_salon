import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminOrderDetailClient from "./AdminOrderDetailClient";

export const metadata: Metadata = { title: "Admin — Sipariş Detayı" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();
  return <AdminOrderDetailClient id={id} />;
}
