import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminLogoutButton from "./AdminLogoutButton";
import styles from "./layout.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname") ?? "";

  // Let the login page through without an auth check — otherwise we'd create
  // an infinite redirect loop (/admin/* → /admin/login → auth check → /admin/login → …).
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Server-side authentication for all other admin pages.
  const cookieStore = cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const apiBase = process.env.API_BASE_URL ?? "http://localhost:4000";

  try {
    const res = await fetch(`${apiBase}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) redirect("/admin/login");
    const data = (await res.json()) as { user: { role: string } };
    if (data.user?.role !== "ADMIN") redirect("/");
  } catch {
    redirect("/admin/login");
  }

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>⚙ Admin Panel</div>
        <nav>
          <ul className={styles.nav}>
            <li><Link href="/admin">Özet</Link></li>
            <li><Link href="/admin/urunler">Ürünler</Link></li>
            <li><Link href="/admin/siparisler">Siparişler</Link></li>
            <li><Link href="/admin/yorumlar">Yorumlar</Link></li>
            <li><Link href="/admin/kampanyalar">Kampanyalar</Link></li>
            <li><Link href="/admin/ayarlar">Ayarlar</Link></li>
          </ul>
        </nav>
        <div className={styles.navBottom}>
          <Link href="/" className={styles.siteLink}>← Siteye Dön</Link>
          <AdminLogoutButton />
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
