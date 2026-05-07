"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gönderim sırasında hata oluştu.");
        return;
      }
      setSuccess(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className={styles.form} style={{ textAlign: "center" }}>
        <p style={{ fontSize: "1.1rem", color: "#27ae60", marginBottom: "0.75rem" }}>
          ✓ Mesajınız başarıyla gönderildi!
        </p>
        <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
          En kısa sürede sizinle iletişime geçeceğiz.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Adınız Soyadınız</label>
        <input
          type="text" id="name" name="name" className="form-control"
          required minLength={2} maxLength={100}
          value={form.name} onChange={handleChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="email">E-posta Adresiniz</label>
        <input
          type="email" id="email" name="email" className="form-control"
          required maxLength={191}
          value={form.email} onChange={handleChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="phone">Telefon (isteğe bağlı)</label>
        <input
          type="tel" id="phone" name="phone" className="form-control"
          maxLength={30}
          value={form.phone} onChange={handleChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="message">Mesajınız</label>
        <textarea
          id="message" name="message" rows={5} className="form-control"
          required minLength={10} maxLength={3000}
          value={form.message} onChange={handleChange}
        />
      </div>
      {error && <p style={{ color: "#c0392b", fontSize: "0.85rem" }}>{error}</p>}
      <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
        {submitting ? "Gönderiliyor…" : "Mesaj Gönder"}
      </button>
    </form>
  );
}
