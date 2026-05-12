import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminLoginForm from "./AdminLoginForm";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Admin Girişi" };

export default async function AdminLoginPage() {
  // Already authenticated admins should be sent straight to the panel.
  const cookieStore = cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const apiBase = process.env.API_BASE_URL ?? "http://localhost:4000";

  try {
    const res = await fetch(`${apiBase}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { user: { role: string } };
      if (data.user?.role === "ADMIN") redirect("/admin");
    }
  } catch {
    // API unreachable — show the login form anyway.
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.logo}>⚙ Güzellik Merkezi</div>
        <h1 className={styles.title}>Admin Girişi</h1>
        <p className={styles.subtitle}>Yalnızca yetkili personel erişebilir.</p>
        <AdminLoginForm />
        <Link href="/" className={styles.backLink}>← Siteye Dön</Link>
      </div>
    </div>
  );
}
