import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { categoryLinks } from "@/lib/site";
import styles from "../../urunler/page.module.css";

interface Category {
  id: number;
  name: string;
  slug: string;
  _count?: { products: number };
}

interface ProductImage {
  url: string;
  alt: string;
}

interface Product {
  id: number;
  slug: string;
  title: string;
  price: string;
  stock: number;
  category: { name: string };
  images: ProductImage[];
}

interface ProductsResponse {
  items: Product[];
  total: number;
}

const API = process.env.API_BASE_URL ?? "http://localhost:4000";

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API}/api/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("API error");
    return res.json();
  } catch {
    return [];
  }
}

async function getCategory(slug: string) {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

async function getProducts(categoryId: number): Promise<ProductsResponse> {
  try {
    const params = new URLSearchParams({
      page: "1",
      limit: "50",
      categoryId: String(categoryId),
    });
    const res = await fetch(`${API}/api/products?${params}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("API error");
    return res.json();
  } catch {
    return { items: [], total: 0 };
  }
}

export async function generateStaticParams() {
  return categoryLinks.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Kategori Bulunamadı" };

  return buildMetadata({
    title: `${category.name} Ürünleri`,
    description: `Niltellioglu ${category.name.toLocaleLowerCase("tr-TR")} kategorisindeki cilt bakım ve kozmetik ürünlerini keşfedin.`,
    path: `/kategori/${category.slug}`,
    images: [{ url: "/image_1.jpg", alt: `${category.name} ürünleri` }],
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const { items, total } = await getProducts(category.id);

  return (
    <div className="section">
      <div className="container">
        <div className="section-title">
          <h2>{category.name}</h2>
          <p>Niltellioglu {category.name} kategorisindeki ürünleri inceleyin</p>
        </div>

        {items.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--color-muted)" }}>
            Bu kategoride ürün bulunamadı.
          </p>
        ) : (
          <>
            <p className={styles.count}>{total} ürün listeleniyor</p>
            <div className={styles.grid}>
              {items.map((p, index) => {
                const imgUrl = p.images[0]?.url ?? "/placeholder.jpg";
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
                        {Number(p.price).toLocaleString("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        })}
                      </p>
                      {p.stock === 0 && (
                        <span className={styles.outOfStock}>Stok tükendi</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
