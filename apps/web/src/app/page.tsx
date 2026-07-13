import type { Metadata } from "next";
import Image from "next/image";
import Hero from "@/components/layout/Hero";
import styles from "./page.module.css";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Niltellioglu Cilt Bakım ve Kozmetik Ürünleri",
  description:
    "Niltellioglu ve Nil Tellioğlu Beauty cilt bakım, kozmetik, makyaj ve güneş ürünleri. Çekmeköy İstanbul merkezli güvenli online alışveriş.",
  path: "/",
  images: [{ url: "/bg_1.jpg", alt: "Niltellioglu cilt bakım ve kozmetik" }],
});

const categories = [
  {
    icon: "🌿",
    title: "Cilt Bakım",
    desc: "Serum, peeling ve günlük bakım ürünleri",
    href: "/kategori/cilt-bakim",
  },
  {
    icon: "☀️",
    title: "Güneş Ürünleri",
    desc: "SPF ve ışıltılı vücut bakım ürünleri",
    href: "/kategori/gunes-urunleri",
  },
  {
    icon: "💄",
    title: "Lip & Cheek",
    desc: "Dudak ve yanak için çok amaçlı renkler",
    href: "/kategori/lip-cheek",
  },
  {
    icon: "✨",
    title: "Makyaj",
    desc: "Concealer, göz farı ve multi-pen ürünleri",
    href: "/kategori/makyaj",
  },
];

interface FeaturedProduct {
  id: number;
  slug: string;
  title: string;
  price: string;
  category: { name: string };
  images: { url: string; alt: string; blurDataUrl?: string | null }[];
}

async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  const apiBase = process.env.API_BASE_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${apiBase}/api/products?limit=4`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      <Hero />

      {/* Kategoriler */}
      <section className={`section ${styles.categories}`}>
        <div className="container">
          <div className="section-title">
            <h2>Kategoriler</h2>
            <p>Cilt bakım ve kozmetik rutininiz için Niltellioglu seçkisini keşfedin</p>
          </div>
          <div className={styles.catGrid}>
            {categories.map((cat) => (
              <div key={cat.title} className={styles.catCard}>
                <div className={styles.catIcon}>{cat.icon}</div>
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
                <Link href={cat.href} className={`btn btn-outline ${styles.catBtn}`}>
                  İncele
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hakkımızda */}
      <section className={`section ${styles.about}`}>
        <Image
          src="/intro.jpg"
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
          loading="lazy"
          quality={80}
        />
        <div className={styles.aboutOverlay} />
        <div className="container">
          <div className={styles.aboutContent}>
            <h2>Neden Bizi Seçmelisiniz?</h2>
            <p>
              Niltellioglu, Nil Tellioğlu Beauty ürün seçkisini modern ve güvenli
              bir online alışveriş deneyimiyle sunar. Cilt bakım, makyaj ve
              kozmetik ürünlerini net içerik bilgisi ve sade alışveriş akışıyla
              inceleyebilirsiniz.
            </p>
            <ul className={styles.benefits}>
              <li>✓ Çekmeköy İstanbul merkezli marka bilgisi</li>
              <li>✓ Cilt bakım ve kozmetik odaklı ürün seçkisi</li>
              <li>✓ Güvenli ödeme ve sipariş altyapısı</li>
              <li>✓ KVKK, iade ve satış koşulları açıkça erişilebilir</li>
            </ul>
            <Link href="/urunler" className="btn btn-primary">
              Alışverişe Başla
            </Link>
          </div>
        </div>
      </section>

      {/* Öne Çıkan Ürünler */}
      <section className={`section ${styles.featured}`}>
        <div className="container">
          <div className="section-title">
            <h2>Öne Çıkan Ürünler</h2>
            <p>Cilt bakım ve kozmetik kategorilerinde öne çıkan Niltellioglu ürünleri</p>
          </div>

          {featured.length > 0 ? (
            <>
              <div className={styles.featuredGrid}>
                {featured.map((p, index) => {
                  const imgUrl = p.images[0]?.url ?? "/placeholder.jpg";
                  const blur = p.images[0]?.blurDataUrl;
                  // First card is likely above the fold — preload it.
                  const isFirst = index === 0;
                  return (
                    <Link key={p.id} href={`/urunler/${p.slug}`} className={styles.featuredCard}>
                      <div className={styles.featuredImgWrap}>
                        <Image
                          src={imgUrl}
                          alt={p.images[0]?.alt ?? p.title}
                          fill
                          sizes="(max-width: 480px) 100vw, (max-width: 900px) 50vw, 25vw"
                          style={{ objectFit: "contain" }}
                          priority={isFirst}
                          loading={isFirst ? undefined : "lazy"}
                          placeholder={blur ? "blur" : "empty"}
                          blurDataURL={blur ?? undefined}
                        />
                      </div>
                      <div className={styles.featuredBody}>
                        <span className={styles.featuredCat}>{p.category.name}</span>
                        <h3 className={styles.featuredTitle}>{p.title}</h3>
                        <p className={styles.featuredPrice}>
                          {Number(p.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                <Link href="/urunler" className="btn btn-primary">
                  Tüm Ürünleri Gör
                </Link>
              </div>
            </>
          ) : (
            <div className={styles.productsPlaceholder}>
              <Link href="/urunler" className="btn btn-primary">
                Tüm Ürünler
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
