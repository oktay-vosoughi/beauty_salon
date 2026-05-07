import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı",
  description: "Aradığınız sayfa mevcut değil.",
};

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <p style={{ fontSize: "5rem", lineHeight: 1, color: "var(--color-primary)", marginBottom: "1rem" }}>
        404
      </p>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "1rem" }}>
        Sayfa Bulunamadı
      </h1>
      <p style={{ color: "var(--color-muted)", marginBottom: "2rem", maxWidth: 400 }}>
        Aradığınız sayfa kaldırılmış, taşınmış ya da hiç var olmamış olabilir.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" className="btn btn-primary">Ana Sayfaya Dön</Link>
        <Link href="/urunler" className="btn btn-outline">Ürünlere Gözat</Link>
      </div>
    </div>
  );
}
