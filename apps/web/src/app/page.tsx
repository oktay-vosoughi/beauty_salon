import type { Metadata } from "next";
import Hero from "@/components/layout/Hero";
import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  description:
    "Güzellik Merkezi — Doğal güzellik ürünleri ve profesyonel cilt bakımı. Online sipariş verin.",
};

const categories = [
  { icon: "🌿", title: "Cilt Bakımı", desc: "Nemlendirici, serum ve maskeler" },
  { icon: "💆", title: "Saç Bakımı", desc: "Şampuan, saç maskesi ve yağlar" },
  { icon: "🌸", title: "Vücut Bakımı", desc: "Losyon, peeling ve banyo ürünleri" },
  { icon: "💄", title: "Makyaj", desc: "Doğal içerikli makyaj ürünleri" },
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
            <p>İhtiyacınıza göre en uygun güzellik ürünlerini keşfedin</p>
          </div>
          <div className={styles.catGrid}>
            {categories.map((cat) => (
              <div key={cat.title} className={styles.catCard}>
                <div className={styles.catIcon}>{cat.icon}</div>
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
                <Link href="/urunler" className={`btn btn-outline ${styles.catBtn}`}>
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
              10 yılı aşkın deneyimimizle, en kaliteli doğal güzellik ürünlerini
              kapınıza getiriyoruz. Uzman ekibimiz tarafından seçilen her ürün,
              cilt güvenliği testlerinden geçmektedir.
            </p>
            <ul className={styles.benefits}>
              <li>✓ %100 Doğal İçerikler</li>
              <li>✓ Hayvan Deneyi Yapılmaz</li>
              <li>✓ Hızlı ve Güvenli Kargo</li>
              <li>✓ 30 Gün İade Garantisi</li>
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
            <p>En çok tercih edilen güzellik ürünlerimiz</p>
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
