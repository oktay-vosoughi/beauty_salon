import type { Metadata } from "next";
import Link from "next/link";
import AccountAuthGuard from "./AccountAuthGuard";
import LogoutButton from "./LogoutButton";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Hesabım",
};

export default function HesabimLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccountAuthGuard>
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
                  <li><Link href="/hesabim/adreslerim">Adreslerim</Link></li>
                  <li><Link href="/hesabim/kartlarim">Kayıtlı Kartlarım</Link></li>
                  <li><Link href="/hesabim/yorumlar">Yorumlarım</Link></li>
                </ul>
              </nav>
              <div className={styles.logout}>
                <LogoutButton />
              </div>
            </aside>
            <main className={styles.main}>{children}</main>
          </div>
        </div>
      </div>
    </AccountAuthGuard>
  );
}
