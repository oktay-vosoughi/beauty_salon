"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  hasPassword: boolean;
}

const cardStyle: React.CSSProperties = {
  background: "var(--color-bg-light,#fafafa)",
  borderRadius: 8,
  padding: "1.5rem",
  marginBottom: "1.5rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 600,
  marginBottom: "0.35rem",
  color: "var(--color-muted)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  borderRadius: 6,
  border: "1px solid #ddd",
  fontSize: "0.9rem",
  marginBottom: "1rem",
  fontFamily: "inherit",
};

export default function ProfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) throw new Error("auth");
        if (!r.ok) throw new Error("api");
        return r.json();
      })
      .then((data) => {
        setUser(data.user);
        setName(data.user.name ?? "");
        setPhone(data.user.phone ?? "");
      })
      .catch((e) =>
        setError(
          e.message === "auth" ? "Giriş yapmanız gerekiyor." : "Bilgiler yüklenemedi."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    setInfoMsg(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Güncellenemedi.");
      setUser(data.user);
      setInfoMsg({ ok: true, text: "Bilgileriniz güncellendi." });
    } catch (err) {
      setInfoMsg({ ok: false, text: err instanceof Error ? err.message : "Hata oluştu." });
    } finally {
      setSavingInfo(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg({ ok: false, text: "Yeni şifre en az 8 karakter olmalıdır." });
      return;
    }
    if (newPassword !== newPassword2) {
      setPwMsg({ ok: false, text: "Yeni şifreler eşleşmiyor." });
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Şifre değiştirilemedi.");
      setPwMsg({ ok: true, text: "Şifreniz güncellendi." });
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (err) {
      setPwMsg({ ok: false, text: err instanceof Error ? err.message : "Hata oluştu." });
    } finally {
      setSavingPw(false);
    }
  }

  if (loading)
    return <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>Yükleniyor…</p>;
  if (error)
    return <p style={{ color: "#c0392b", fontSize: "0.9rem" }}>{error}</p>;
  if (!user) return null;

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: "1.5rem" }}>Profilim</h2>

      {/* Account info */}
      <form style={cardStyle} onSubmit={saveInfo}>
        <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Hesap Bilgilerim</h3>

        <label style={labelStyle}>Ad Soyad</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
        />

        <label style={labelStyle}>E-posta</label>
        <input
          style={{ ...inputStyle, background: "#eee", color: "var(--color-muted)" }}
          value={user.email}
          disabled
        />

        <label style={labelStyle}>Telefon</label>
        <input
          style={inputStyle}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05XX XXX XX XX"
          maxLength={20}
        />

        {infoMsg && (
          <p style={{ fontSize: "0.85rem", color: infoMsg.ok ? "#27ae60" : "#c0392b", marginBottom: "0.75rem" }}>
            {infoMsg.text}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={savingInfo}>
          {savingInfo ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>

      {/* Change password */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Şifre Değiştir</h3>
        {!user.hasPassword ? (
          <p style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>
            Google ile giriş yaptığınız için şifre belirleyemezsiniz.
          </p>
        ) : (
          <form onSubmit={changePassword}>
            <label style={labelStyle}>Mevcut Şifre</label>
            <input
              type="password"
              style={inputStyle}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <label style={labelStyle}>Yeni Şifre</label>
            <input
              type="password"
              style={inputStyle}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />

            <label style={labelStyle}>Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              style={inputStyle}
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              minLength={8}
              required
            />

            {pwMsg && (
              <p style={{ fontSize: "0.85rem", color: pwMsg.ok ? "#27ae60" : "#c0392b", marginBottom: "0.75rem" }}>
                {pwMsg.text}
              </p>
            )}
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              {savingPw ? "Güncelleniyor…" : "Şifreyi Değiştir"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
