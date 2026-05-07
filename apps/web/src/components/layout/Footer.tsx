import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div>
            <span className={styles.brand}>✦ Güzellik Merkezi</span>
            <p className={styles.tagline}>
              Profesyonel güzellik ve bakım hizmetleriyle kendinizi şımartın.
              Doğal ürünler, uzman eller.
            </p>
          </div>

          <div>
            <p className={styles.heading}>Bağlantılar</p>
            <ul className={styles.links}>
              <li><Link href="/">Ana Sayfa</Link></li>
              <li><Link href="/urunler">Ürünler</Link></li>
              <li><Link href="/iletisim">İletişim</Link></li>
              <li><Link href="/giris">Giriş Yap</Link></li>
              <li><Link href="/kayit">Kayıt Ol</Link></li>
            </ul>
          </div>

          <div>
            <p className={styles.heading}>İletişim</p>
            <ul className={styles.links}>
              <li>Bağcılar, İstanbul</li>
              <li>+90 (212) 000 00 00</li>
              <li>info@guzellikmerkezi.com.tr</li>
              <li>Pzt–Cmt: 09:00–20:00</li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            © {new Date().getFullYear()} Güzellik Merkezi. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
