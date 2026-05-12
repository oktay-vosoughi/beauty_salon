"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    setDevResetUrl("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Bir hata oluştu.");
        return;
      }

      setStatus("sent");
      setMessage(data.message ?? "E-posta gönderildi. Lütfen gelen kutunuzu kontrol edin.");
      if (typeof data.devResetUrl === "string") {
        setDevResetUrl(data.devResetUrl);
      }
    } catch {
      setStatus("error");
      setMessage("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  }

  if (status === "sent") {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>E-posta Gönderildi</h1>
        <div className="alert alert-success" style={{ textAlign: "center" }}>
          {message}
        </div>
        {devResetUrl && (
          <p className={styles.footer}>
            <a href={devResetUrl}>Geliştirme sıfırlama bağlantısını aç</a>
          </p>
        )}
        <p className={styles.footer}>
          <Link href="/giris">← Giriş sayfasına dön</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Şifremi Unuttum</h1>
      <p style={{ textAlign: "center", color: "var(--color-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        Kayıtlı e-posta adresinizi girin. Şifre sıfırlama bağlantısı gönderilecektir.
      </p>

      {status === "error" && <div className="alert alert-error">{message}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">E-posta Adresi</label>
          <input
            type="email"
            id="email"
            className="form-control"
            placeholder="ornek@mail.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%" }}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Gönderiliyor…" : "Sıfırlama Bağlantısı Gönder"}
        </button>
      </form>

      <p className={styles.footer}>
        <Link href="/giris">← Giriş sayfasına dön</Link>
      </p>
    </div>
  );
}
