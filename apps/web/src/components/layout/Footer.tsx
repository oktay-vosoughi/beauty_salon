import Link from "next/link";
import { legalLinks, site } from "@/lib/site";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div>
            <span className={styles.brand}>✦ {site.name}</span>
            <p className={styles.tagline}>
              Nil Tellioğlu Beauty seçkisiyle cilt bakım ve kozmetik ürünlerini
              güvenli alışveriş deneyimiyle keşfedin.
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
            <p className={styles.heading}>Yasal</p>
            <ul className={styles.links}>
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={styles.heading}>İletişim</p>
            <ul className={styles.links}>
              <li>{site.legalName}</li>
              <li>{site.address}</li>
              <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
              <li><a href={`tel:${site.phone}`}>{site.phoneDisplay}</a></li>
              <li>
                <a
                  className={styles.whatsappButton}
                  href={`https://wa.me/${site.whatsappPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp Mesaj Gönder
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            © {new Date().getFullYear()} {site.name}. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
