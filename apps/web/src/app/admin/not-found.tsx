import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div style={{ padding: "2rem 0", maxWidth: 600 }}>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", marginBottom: "0.75rem" }}>
        Sayfa Bulunamadı
      </h1>
      <p style={{ color: "var(--color-muted)", marginBottom: "1.5rem" }}>
        Aradığınız admin sayfası mevcut değil ya da kaldırıldı.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/admin" className="btn btn-primary">Admin Özet</Link>
        <Link href="/admin/urunler" className="btn btn-outline">Ürünler</Link>
      </div>
    </div>
  );
}
