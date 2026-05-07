import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "İletişim",
  description:
    "Niltellioglu cilt bakım ve kozmetik ürünleri için iletişim bilgileri. Çekmeköy İstanbul adresi ve info@niltellioglu.com e-posta desteği.",
  path: "/iletisim",
});

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
                <strong>Firma:</strong> {site.legalName}
              </li>
              <li>
                <strong>Adres:</strong> {site.address}
              </li>
              <li>
                <strong>E-posta:</strong> {site.email}
              </li>
            </ul>
          </div>

          <ContactForm />
        </div>
      </div>
    </div>
  );
}
