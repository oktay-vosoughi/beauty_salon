"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OrderItem { id: number; titleSnapshot: string; quantity: number; unitPrice: string }
interface Order {
  id: number;
  status: string;
  totalAmount: string;
  createdAt: string;
  items: OrderItem[];
  payment: { status: string; amount: string } | null;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Bekliyor",       color: "#e67e22" },
  PAID:      { label: "Ödendi",         color: "#27ae60" },
  SHIPPED:   { label: "Kargoya Verildi", color: "#2980b9" },
  DELIVERED: { label: "Teslim Edildi",  color: "#27ae60" },
  CANCELLED: { label: "İptal Edildi",   color: "#c0392b" },
};

export default function SiparislerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/orders", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) throw new Error("auth");
        if (!r.ok) throw new Error("api");
        return r.json();
      })
      .then(setOrders)
      .catch((e) => setError(e.message === "auth" ? "Giriş yapmanız gerekiyor." : "Siparişler yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>Yükleniyor…</p>;
  if (error) return <p style={{ color: "#c0392b", fontSize: "0.9rem" }}>{error}</p>;

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: "1.5rem" }}>Siparişlerim</h2>

      {orders.length === 0 ? (
        <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
          Henüz siparişiniz bulunmuyor.{" "}
          <Link href="/urunler" style={{ color: "var(--color-primary)" }}>Alışverişe başlayın.</Link>
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {orders.map((order) => {
            const st = STATUS_LABEL[order.status] ?? { label: order.status, color: "#666" };
            return (
              <div key={order.id} style={{ background: "var(--color-bg-light,#fafafa)", borderRadius: 8, padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Sipariş #{order.id}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginLeft: "0.75rem" }}>
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: st.color }}>{st.label}</span>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--color-muted)" }}>
                  {order.items.map((item) => (
                    <li key={item.id}>{item.titleSnapshot} × {item.quantity}</li>
                  ))}
                </ul>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 700 }}>
                    {Number(order.totalAmount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </span>
                  {order.status === "PENDING" && (
                    <Link href={`/odeme/${order.id}`} className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}>
                      Ödemeye Geç
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
