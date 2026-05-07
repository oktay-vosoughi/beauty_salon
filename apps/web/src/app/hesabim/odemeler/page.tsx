"use client";

import { useEffect, useState } from "react";

interface Payment {
  id: number;
  status: string;
  amount: string;
  createdAt: string;
  order: { id: number; totalAmount: string; status: string };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  INIT:    { label: "Başlatıldı",  color: "#e67e22" },
  PENDING: { label: "Bekliyor",    color: "#e67e22" },
  SUCCESS: { label: "Başarılı",    color: "#27ae60" },
  FAILED:  { label: "Başarısız",   color: "#c0392b" },
};

export default function OdemelerPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/payments", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) throw new Error("auth");
        if (!r.ok) throw new Error("api");
        return r.json();
      })
      .then(setPayments)
      .catch((e) => setError(e.message === "auth" ? "Giriş yapmanız gerekiyor." : "Ödemeler yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>Yükleniyor…</p>;
  if (error) return <p style={{ color: "#c0392b", fontSize: "0.9rem" }}>{error}</p>;

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: "1.5rem" }}>Ödemelerim</h2>

      {payments.length === 0 ? (
        <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>Geçmiş ödeme kaydınız bulunmuyor.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {payments.map((pay) => {
            const st = STATUS_LABEL[pay.status] ?? { label: pay.status, color: "#666" };
            return (
              <div key={pay.id} style={{ background: "var(--color-bg-light,#fafafa)", borderRadius: 8, padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem", margin: 0 }}>Sipariş #{pay.order.id}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-muted)", margin: "0.2rem 0 0" }}>
                    {new Date(pay.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>
                    {Number(pay.amount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </p>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: st.color }}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
