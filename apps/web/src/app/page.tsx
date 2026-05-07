import type { Metadata } from "next";
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

export default function HomePage() {
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
      <section className={`section ${styles.about}`} style={{ backgroundImage: "url('/intro.jpg')" }}>
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

      {/* Öne Çıkan Ürünler placeholder */}
      <section className={`section ${styles.featured}`}>
        <div className="container">
          <div className="section-title">
            <h2>Öne Çıkan Ürünler</h2>
            <p>Cilt bakım ve kozmetik kategorilerinde öne çıkan Niltellioglu ürünleri</p>
          </div>
          <div className={styles.productsPlaceholder}>
            <p>Ürünler yükleniyor…</p>
            <Link href="/urunler" className="btn btn-primary" style={{ marginTop: "1rem" }}>
              Tüm Ürünler
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
