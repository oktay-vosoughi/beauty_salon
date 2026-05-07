import type { Metadata } from "next";
import Link from "next/link";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Hesabım",
};

export default function HesabimLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="section">
      <div className="container">
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Hesabım</h3>
            <nav>
              <ul className={styles.nav}>
                <li><Link href="/hesabim">Profilim</Link></li>
                <li><Link href="/hesabim/siparisler">Siparişlerim</Link></li>
                <li><Link href="/hesabim/odemeler">Ödemelerim</Link></li>
                <li><Link href="/hesabim/yorumlar">Yorumlarım</Link></li>
              </ul>
            </nav>
            <form action="/api/auth/logout" method="post" style={{ marginTop: "2rem" }}>
              <button type="submit" className="btn btn-outline" style={{ width: "100%", fontSize: "0.8rem" }}>
                Çıkış Yap
              </button>
            </form>
          </aside>
          <main className={styles.main}>{children}</main>
        </div>
      </div>
    </div>
  );
}
