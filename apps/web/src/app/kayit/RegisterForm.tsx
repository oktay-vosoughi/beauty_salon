"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Kayıt başarısız");
        return;
      }

      router.push("/hesabim");
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Kayıt Ol</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Ad Soyad</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            placeholder="Adınız Soyadınız"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">E-posta Adresi</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-control"
            placeholder="ornek@mail.com"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Telefon (isteğe bağlı)</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="form-control"
            placeholder="+90 5xx xxx xx xx"
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Şifre</label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-control"
            placeholder="En az 8 karakter"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Kayıt yapılıyor…" : "Kayıt Ol"}
        </button>
      </form>

      <p className={styles.footer}>
        Zaten hesabınız var mı?{" "}
        <Link href="/giris">Giriş Yap</Link>
      </p>
    </div>
  );
}
