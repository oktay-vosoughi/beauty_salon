import type { Metadata } from "next";
import Link from "next/link";
import ProductForm from "../ProductForm";
import styles from "../form.module.css";

export const metadata: Metadata = { title: "Admin — Yeni Ürün" };

export default function YeniUrunPage() {
  return (
    <div>
      <Link href="/admin/urunler" className={styles.backLink}>
        ← Ürün listesine dön
      </Link>
      <h1 className={styles.pageTitle}>Yeni Ürün</h1>
      <ProductForm mode="create" />
    </div>
  );
}
