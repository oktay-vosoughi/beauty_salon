"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../urunler/page.module.css";

interface Review {
  id: number;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  product: { title: string; slug: string };
}

export default function AdminReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?page=${page}&limit=20&status=${filter}`, { credentials: "include" });
      if (res.status === 401 || res.status === 403) { setError("Yetki yok"); return; }
      const data = await res.json();
      setReviews(data.items);
      setTotal(data.total);
    } catch { setError("Yorumlar yüklenemedi"); }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  async function moderate(id: number, status: "APPROVED" | "REJECTED") {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    fetchReviews();
  }

  async function deleteReview(id: number) {
    if (!confirm("Bu yorumu silmek istediğinizden emin misiniz?")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE", credentials: "include" });
    fetchReviews();
  }

  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Yorumlar ({total})</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setPage(1); }}
              className={filter === s ? "btn btn-primary" : "btn btn-outline"}
              style={{ fontSize: "0.8rem" }}
            >
              {{ PENDING: "Bekleyen", APPROVED: "Onaylı", REJECTED: "Reddedilmiş" }[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p style={{ color: "var(--color-muted)" }}>Yükleniyor…</p> : reviews.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>Bu kategoride yorum yok.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Ürün</th>
                <th>Puan</th>
                <th>Yorum</th>
                <th>Tarih</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div>{r.user.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{r.user.email}</div>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>{r.product.title}</td>
                  <td>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                  <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                    {r.comment}
                  </td>
                  <td style={{ fontSize: "0.8rem" }}>{new Date(r.createdAt).toLocaleDateString("tr-TR")}</td>
                  <td className={styles.actions}>
                    {r.status === "PENDING" && (
                      <>
                        <button onClick={() => moderate(r.id, "APPROVED")} className={styles.actionBtn} style={{ borderColor: "#27ae60", color: "#27ae60" }}>Onayla</button>
                        <button onClick={() => moderate(r.id, "REJECTED")} className={`${styles.actionBtn} ${styles.dangerBtn}`}>Reddet</button>
                      </>
                    )}
                    <button onClick={() => deleteReview(r.id)} className={`${styles.actionBtn} ${styles.dangerBtn}`}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline" style={{ fontSize: "0.8rem" }}>← Önceki</button>
          <span>Sayfa {page} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn btn-outline" style={{ fontSize: "0.8rem" }}>Sonraki →</button>
        </div>
      )}
    </div>
  );
}
