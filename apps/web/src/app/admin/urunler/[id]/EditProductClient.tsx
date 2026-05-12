"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductForm, { type ProductFormValues, type ProductImageInput } from "../ProductForm";
import styles from "../form.module.css";

interface ApiProduct {
  id: number;
  slug: string;
  title: string;
  description: string;
  price: string | number;
  stock: number;
  isActive: boolean;
  categoryId: number;
  images?: { url: string; alt: string; sortOrder: number }[];
}

export default function EditProductClient({ id }: { id: number }) {
  const [initial, setInitial] = useState<Partial<ProductFormValues> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/products/${id}`, { credentials: "include" });
        if (res.status === 404) {
          if (!cancelled) setError("Bu ID ile bir ürün bulunamadı.");
          return;
        }
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) setError("Bu sayfaya erişim yetkiniz yok.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError("Ürün yüklenemedi.");
          return;
        }
        const p: ApiProduct = await res.json();
        if (cancelled) return;
        const images: ProductImageInput[] = (p.images ?? []).map((im, i) => ({
          url: im.url,
          alt: im.alt,
          sortOrder: im.sortOrder ?? i,
        }));
        setInitial({
          slug: p.slug,
          title: p.title,
          description: p.description,
          price: String(p.price),
          stock: String(p.stock),
          isActive: p.isActive,
          categoryId: String(p.categoryId),
          images,
        });
      } catch {
        if (!cancelled) setError("Ürün yüklenirken bir hata oluştu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div>
      <Link href="/admin/urunler" className={styles.backLink}>
        ← Ürün listesine dön
      </Link>
      <h1 className={styles.pageTitle}>Ürünü Düzenle (#{id})</h1>

      {loading && <p style={{ color: "var(--color-muted)" }}>Yükleniyor…</p>}
      {error && (
        <div className="alert alert-error">
          {error}
          <div style={{ marginTop: "0.75rem" }}>
            <Link href="/admin/urunler" className="btn btn-outline" style={{ fontSize: "0.85rem" }}>
              Ürün listesine dön
            </Link>
          </div>
        </div>
      )}
      {!loading && !error && initial && (
        <ProductForm mode="edit" productId={id} initial={initial} />
      )}
    </div>
  );
}
