import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import AddToCartButton from "./AddToCartButton";
import ReviewSection from "./ReviewSection";
import styles from "./page.module.css";

interface ProductImage { url: string; alt: string }
interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: number; name: string };
}
interface Product {
  id: number;
  slug: string;
  title: string;
  description: string;
  price: string;
  stock: number;
  category: { id: number; name: string; slug: string };
  images: ProductImage[];
  reviews: Review[];
}

const API = process.env.API_BASE_URL ?? "http://localhost:4000";
const WEB = process.env.WEB_BASE_URL ?? "http://localhost:3000";

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API}/api/products/${slug}`, { next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("API error");
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Ürün Bulunamadı" };

  const canonical = `${WEB}/urunler/${p.slug}`;
  const imgUrl = p.images[0]?.url;

  return {
    title: p.title,
    description: `${p.description.slice(0, 150)} — ${Number(p.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}`,
    alternates: { canonical },
    openGraph: {
      title: p.title,
      description: p.description.slice(0, 200),
      url: canonical,
      type: "website",
      ...(imgUrl ? { images: [{ url: imgUrl, alt: p.title }] } : {}),
    },
  };
}

export default async function UrunDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const mainImg = product.images[0]?.url ?? "/placeholder.jpg";
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: String(product.id),
    url: `${WEB}/urunler/${product.slug}`,
    ...(product.images[0] ? { image: product.images[0].url } : {}),
    brand: { "@type": "Brand", name: "Güzellik Merkezi" },
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: Number(product.price).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Güzellik Merkezi" },
    },
    ...(avgRating !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: product.reviews.length,
          },
        }
      : {}),
  };

  return (
    <div className="section">
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container">
        <nav className={styles.breadcrumb}>
          <Link href="/urunler">Ürünler</Link>
          <span>/</span>
          <Link href={`/urunler?categoryId=${product.category.id}`}>{product.category.name}</Link>
          <span>/</span>
          <span>{product.title}</span>
        </nav>

        <div className={styles.detail}>
          <div className={styles.gallery}>
            <div className={styles.mainImgWrap}>
              <Image
                src={mainImg}
                alt={product.images[0]?.alt ?? product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
            {product.images.length > 1 && (
              <div className={styles.thumbs}>
                {product.images.map((img, i) => (
                  <div key={i} className={styles.thumbWrap}>
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      sizes="70px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.info}>
            <span className={styles.cat}>{product.category.name}</span>
            <h1 className={styles.title}>{product.title}</h1>

            {avgRating !== null && (
              <div className={styles.rating}>
                {"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}
                <span>({product.reviews.length} yorum)</span>
              </div>
            )}

            <p className={styles.price}>
              {Number(product.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
            </p>

            <p className={styles.desc}>{product.description}</p>

            <p className={product.stock > 0 ? styles.inStock : styles.outOfStock}>
              {product.stock > 0 ? `Stokta: ${product.stock} adet` : "Stok tükendi"}
            </p>

            <AddToCartButton productId={product.id} inStock={product.stock > 0} />
          </div>
        </div>

        <ReviewSection productId={product.id} initialReviews={product.reviews} />
      </div>
    </div>
  );
}
