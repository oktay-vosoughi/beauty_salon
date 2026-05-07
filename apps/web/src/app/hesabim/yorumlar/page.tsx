"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Review {
  id: number;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
  product: {
    title: string;
    slug: string;
    images: { url: string; alt: string }[];
  };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:  { label: "İncelemede",  color: "#e67e22" },
  APPROVED: { label: "Yayında",     color: "#27ae60" },
  REJECTED: { label: "Reddedildi",  color: "#c0392b" },
};

function Stars({ n }: { n: number }) {
  return <span style={{ color: "#c8a87e" }}>{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
}

export default function YorumlarPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/reviews/mine", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) throw new Error("auth");
        if (!r.ok) throw new Error("api");
        return r.json();
      })
      .then(setReviews)
      .catch((e) => setError(e.message === "auth" ? "Giriş yapmanız gerekiyor." : "Yorumlar yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>Yükleniyor…</p>;
  if (error) return <p style={{ color: "#c0392b", fontSize: "0.9rem" }}>{error}</p>;

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: "1.5rem" }}>Yorumlarım</h2>

      {reviews.length === 0 ? (
        <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
          Henüz yorum yapmadınız.{" "}
          <Link href="/urunler" style={{ color: "var(--color-primary)" }}>
            Satın aldığınız ürünleri değerlendirin.
          </Link>
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {reviews.map((r) => {
            const st = STATUS_LABEL[r.status] ?? { label: r.status, color: "#666" };
            return (
              <div key={r.id} style={{ background: "var(--color-bg-light,#fafafa)", borderRadius: 8, padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  <Link
                    href={`/urunler/${r.product.slug}`}
                    style={{ fontWeight: 600, color: "var(--color-text)", textDecoration: "none", fontSize: "0.95rem" }}
                  >
                    {r.product.title}
                  </Link>
                  <Stars n={r.rating} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: st.color, marginLeft: "auto" }}>
                    {st.label}
                  </span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text)", margin: 0, lineHeight: 1.6 }}>{r.comment}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.5rem" }}>
                  {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
