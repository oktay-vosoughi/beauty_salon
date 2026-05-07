import Link from "next/link";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.icon}>✦</div>
        <h1 className={styles.title}>
          Güzelliğinizi Keşfedin
        </h1>
        <p className={styles.subtitle}>
          Doğal içeriklerle hazırlanmış profesyonel güzellik ürünleri.
          Cilt bakımından saç bakımına, spa deneyiminizi eve taşıyın.
        </p>
        <div className={styles.buttons}>
          <Link href="/urunler" className="btn btn-primary">
            Ürünleri İncele
          </Link>
          <Link href="/iletisim" className="btn btn-outline" style={{ color: "#fff", borderColor: "#fff" }}>
            İletişime Geç
          </Link>
        </div>
      </div>
    </section>
  );
}
