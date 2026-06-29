"use client";

import { useEffect, useState } from "react";

interface Address {
  id: number;
  fullName: string;
  phone: string;
  line1: string;
  district: string;
  city: string;
  postalCode: string;
}

type FormData = Omit<Address, "id">;

const EMPTY: FormData = {
  fullName: "",
  phone: "",
  line1: "",
  district: "",
  city: "",
  postalCode: "",
};

const cardStyle: React.CSSProperties = {
  background: "var(--color-bg-light,#fafafa)",
  borderRadius: 8,
  padding: "1.25rem 1.5rem",
  marginBottom: "1rem",
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

export default function AdreslerimPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function load() {
    fetch("/api/addresses", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) throw new Error("auth");
        if (!r.ok) throw new Error("api");
        return r.json();
      })
      .then(setAddresses)
      .catch((e) =>
        setError(e.message === "auth" ? "Giriş yapmanız gerekiyor." : "Adresler yüklenemedi.")
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startNew() {
    setForm(EMPTY);
    setFormError("");
    setEditingId("new");
  }

  function startEdit(a: Address) {
    const { id, ...rest } = a;
    void id;
    setForm(rest);
    setFormError("");
    setEditingId(a.id);
  }

  function set<K extends keyof FormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (form.fullName.trim().length < 1) return "Ad soyad gerekli.";
    if (form.phone.trim().length < 10) return "Geçerli bir telefon girin.";
    if (form.line1.trim().length < 1) return "Adres gerekli.";
    if (form.district.trim().length < 1) return "İlçe gerekli.";
    if (form.city.trim().length < 1) return "Şehir gerekli.";
    if (form.postalCode.trim().length < 5) return "Posta kodu gerekli.";
    return null;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const isNew = editingId === "new";
      const res = await fetch(isNew ? "/api/addresses" : `/api/addresses/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Adres kaydedilemedi.");
      setEditingId(null);
      setLoading(true);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/addresses/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) setAddresses((list) => list.filter((a) => a.id !== id));
  }

  if (loading)
    return <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>Yükleniyor…</p>;
  if (error)
    return <p style={{ color: "#c0392b", fontSize: "0.9rem" }}>{error}</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", margin: 0 }}>Adreslerim</h2>
        {editingId === null && (
          <button className="btn btn-primary" onClick={startNew} style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}>
            + Yeni Adres
          </button>
        )}
      </div>

      {editingId !== null && (
        <form style={cardStyle} onSubmit={save}>
          <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>
            {editingId === "new" ? "Yeni Adres" : "Adresi Düzenle"}
          </h3>

          <label style={labelStyle}>Ad Soyad</label>
          <input style={inputStyle} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} maxLength={100} />

          <label style={labelStyle}>Telefon</label>
          <input style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={20} placeholder="05XX XXX XX XX" />

          <label style={labelStyle}>Adres</label>
          <input style={inputStyle} value={form.line1} onChange={(e) => set("line1", e.target.value)} maxLength={255} />

          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>İlçe</label>
              <input style={inputStyle} value={form.district} onChange={(e) => set("district", e.target.value)} maxLength={100} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Şehir</label>
              <input style={inputStyle} value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={100} />
            </div>
          </div>

          <label style={labelStyle}>Posta Kodu</label>
          <input style={inputStyle} value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} maxLength={10} />

          {formError && <p style={{ fontSize: "0.85rem", color: "#c0392b", marginBottom: "0.75rem" }}>{formError}</p>}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button type="button" className="btn" onClick={() => setEditingId(null)} disabled={saving}>
              İptal
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && editingId === null ? (
        <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>Henüz kayıtlı adresiniz yok.</p>
      ) : (
        addresses.map((a) => (
          <div key={a.id} style={cardStyle}>
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{a.fullName}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
              {a.line1}
              <br />
              {a.district} / {a.city} {a.postalCode}
              <br />
              {a.phone}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
              <button className="btn" style={{ fontSize: "0.8rem", padding: "0.3rem 0.9rem" }} onClick={() => startEdit(a)}>
                Düzenle
              </button>
              <button
                className="btn"
                style={{ fontSize: "0.8rem", padding: "0.3rem 0.9rem", color: "#c0392b" }}
                onClick={() => remove(a.id)}
              >
                Sil
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
