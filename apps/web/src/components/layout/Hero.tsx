import Link from "next/link";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.icon}>✦</div>
        <h1 className={styles.title}>
          Niltellioglu Cilt Bakım ve Kozmetik
        </h1>
        <p className={styles.subtitle}>
          Nil Tellioğlu Beauty ürün seçkisiyle cilt bakım, makyaj ve kozmetik
          rutininizi sade ve güvenli bir alışveriş deneyimiyle tamamlayın.
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
