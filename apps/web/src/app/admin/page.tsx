import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Admin — Özet" };

export default function AdminDashboard() {
  return (
    <div>
      <h1 className={styles.title}>Admin Paneli</h1>
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>📦</div>
          <div className={styles.cardLabel}>Ürünler</div>
          <div className={styles.cardLink}><Link href="/admin/urunler">Yönet →</Link></div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>🛒</div>
          <div className={styles.cardLabel}>Siparişler</div>
          <div className={styles.cardLink}><Link href="/admin/siparisler">Yönet →</Link></div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>⭐</div>
          <div className={styles.cardLabel}>Yorumlar</div>
          <div className={styles.cardLink}><Link href="/admin/yorumlar">Yönet →</Link></div>
        </div>
      </div>
    </div>
  );
}
