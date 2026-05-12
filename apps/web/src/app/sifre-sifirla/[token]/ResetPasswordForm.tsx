"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setStatus("error");
      setMessage("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("Şifreler eşleşmiyor.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Bir hata oluştu.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "Şifreniz güncellendi.");
      setTimeout(() => router.push("/giris"), 2000);
    } catch {
      setStatus("error");
      setMessage("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>Şifre Güncellendi</h1>
        <div className="alert alert-success" style={{ textAlign: "center" }}>{message}</div>
        <p className={styles.footer}>Giriş sayfasına yönlendiriliyorsunuz…</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Yeni Şifre Belirle</h1>

      {status === "error" && <div className="alert alert-error">{message}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password">Yeni Şifre</label>
          <input
            type="password"
            id="password"
            className="form-control"
            placeholder="En az 8 karakter"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm">Şifre Tekrar</label>
          <input
            type="password"
            id="confirm"
            className="form-control"
            placeholder="Şifrenizi tekrar girin"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%" }}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Kaydediliyor…" : "Şifremi Güncelle"}
        </button>
      </form>

      <p className={styles.footer}>
        <Link href="/giris">← Giriş sayfasına dön</Link>
      </p>
    </div>
  );
}
