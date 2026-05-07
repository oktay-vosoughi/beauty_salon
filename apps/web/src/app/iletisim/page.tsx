import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Güzellik Merkezi ile iletişime geçin. Adres, telefon ve e-posta bilgilerimiz.",
};

export default function IletisimPage() {
  return (
    <div className="section">
      <div className="container">
        <div className="section-title">
          <h2>İletişim</h2>
          <p>Sorularınız için bize ulaşın</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.info}>
            <h3>İletişim Bilgileri</h3>
            <ul className={styles.list}>
              <li>
                <strong>Adres:</strong> Bağcılar, İstanbul
              </li>
              <li>
                <strong>Telefon:</strong> +90 (212) 000 00 00
              </li>
              <li>
                <strong>E-posta:</strong> info@guzellikmerkezi.com.tr
              </li>
              <li>
                <strong>Çalışma Saatleri:</strong> Pzt–Cmt 09:00–20:00
              </li>
            </ul>
          </div>

          <ContactForm />
        </div>
      </div>
    </div>
  );
}
