import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EditProductClient from "./EditProductClient";

export const metadata: Metadata = { title: "Admin — Ürün Düzenle" };

export default function AdminUrunDuzenlePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <EditProductClient id={id} />;
}
