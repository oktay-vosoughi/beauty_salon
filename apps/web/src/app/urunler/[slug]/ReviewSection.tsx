"use client";

import { useState } from "react";
import styles from "./ReviewSection.module.css";

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: number; name: string };
}

function Stars({ n }: { n: number }) {
  return <span className={styles.stars}>{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

export default function ReviewSection({ productId, initialReviews }: { productId: number; initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "Hata oluştu");
        return;
      }
      setMsg("Yorumunuz inceleme için gönderildi.");
      setComment("");
      setRating(5);
      setShowForm(false);
    } catch {
      setMsg("Bağlantı hatası");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Müşteri Yorumları ({reviews.length})</h2>

      {reviews.length === 0 ? (
        <p className={styles.empty}>Bu ürün için henüz yorum yapılmamış.</p>
      ) : (
        <div className={styles.list}>
          {reviews.map((r) => (
            <div key={r.id} className={styles.item}>
              <div className={styles.meta}>
                <Stars n={r.rating} />
                <span className={styles.author}>{r.user.name}</span>
                <span className={styles.date}>{formatDate(r.createdAt)}</span>
              </div>
              <p className={styles.comment}>{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      <div className={styles.formArea}>
        {!showForm ? (
          <button className="btn btn-outline" onClick={() => setShowForm(true)}>
            Yorum Yaz
          </button>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h3>Yorum Yaz</h3>

            <div className="form-group">
              <label>Puanınız</label>
              <div className={styles.ratingPicker}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={styles.starBtn}
                    style={{ color: n <= rating ? "#c8a87e" : "#ccc" }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="review-comment">Yorumunuz</label>
              <textarea
                id="review-comment"
                className="form-control"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                minLength={5}
                placeholder="Ürün hakkında deneyimlerinizi paylaşın…"
              />
            </div>

            {msg && (
              <p style={{ fontSize: "0.85rem", color: msg.includes("gönderildi") ? "#27ae60" : "#c0392b" }}>
                {msg}
              </p>
            )}

            <div className={styles.actions}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Gönderiliyor…" : "Yorumu Gönder"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                İptal
              </button>
            </div>
          </form>
        )}
        {msg && !showForm && (
          <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "#27ae60" }}>{msg}</p>
        )}
      </div>
    </section>
  );
}
