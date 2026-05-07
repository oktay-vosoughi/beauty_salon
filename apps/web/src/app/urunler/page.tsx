import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { buildMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Cilt Bakım ve Kozmetik Ürünleri",
  description:
    "Niltellioglu cilt bakım, kozmetik, makyaj, güneş ürünleri ve Nil Tellioğlu Beauty seçkisini online keşfedin.",
  path: "/urunler",
  images: [{ url: "/image_1.jpg", alt: "Niltellioglu ürünleri" }],
});

interface ProductImage {
  url: string;
  alt: string;
}

interface Product {
  id: number;
  slug: string;
  title: string;
  description: string;
  price: string;
  stock: number;
  category: { name: string };
  images: ProductImage[];
}

interface ProductsResponse {
  items: Product[];
  total: number;
  pages: number;
}

async function getProducts(page: number, categoryId?: string, search?: string): Promise<ProductsResponse> {
  const apiBase = process.env.API_BASE_URL ?? "http://localhost:4000";
  const params = new URLSearchParams({ page: String(page), limit: "12" });
  if (categoryId) params.set("categoryId", categoryId);
  if (search) params.set("search", search);
  try {
    const res = await fetch(`${apiBase}/api/products?${params}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("API error");
    return res.json();
  } catch {
    return { items: [], total: 0, pages: 0 };
  }
}

interface PageProps {
  searchParams: Promise<{ page?: string; categoryId?: string; search?: string }>;
}

export default async function UrunlerPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total, pages } = await getProducts(page, sp.categoryId, sp.search);

  return (
    <div className="section">
      <div className="container">
        <div className="section-title">
          <h2>Ürünlerimiz</h2>
          <p>Niltellioglu cilt bakım, kozmetik ve makyaj ürünlerini keşfedin</p>
        </div>

        {items.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--color-muted)" }}>
            Ürün bulunamadı.
          </p>
        ) : (
          <>
            <p className={styles.count}>{total} ürün listeleniyor</p>
            <div className={styles.grid}>
              {items.map((p, index) => {
                const imgUrl = p.images[0]?.url ?? "/images/placeholder.jpg";
                return (
                  <Link key={p.id} href={`/urunler/${p.slug}`} className={styles.card}>
                    <div className={styles.imgWrap}>
                      <Image
                        src={imgUrl}
                        alt={p.images[0]?.alt ?? p.title}
                        fill
                        sizes="(max-width: 480px) 100vw, (max-width: 900px) 50vw, 25vw"
                        style={{ objectFit: "cover" }}
                        priority={index === 0}
                      />
                    </div>
                    <div className={styles.body}>
                      <span className={styles.cat}>{p.category.name}</span>
                      <h3 className={styles.title}>{p.title}</h3>
                      <p className={styles.price}>
                        {Number(p.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                      </p>
                      {p.stock === 0 && <span className={styles.outOfStock}>Stok tükendi</span>}
                    </div>
                  </Link>
                );
              })}
            </div>

            {pages > 1 && (
              <div className={styles.pagination}>
                {page > 1 && (
                  <Link href={`/urunler?page=${page - 1}`} className="btn btn-outline">
                    ← Önceki
                  </Link>
                )}
                <span>{page} / {pages}</span>
                {page < pages && (
                  <Link href={`/urunler?page=${page + 1}`} className="btn btn-outline">
                    Sonraki →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
