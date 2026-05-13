"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./detail.module.css";
import ShipmentPanel from "./ShipmentPanel";

interface OrderItem {
  id: number;
  titleSnapshot: string;
  quantity: number;
  unitPrice: string;
}

interface Order {
  id: number;
  status: string;
  totalAmount: string;
  createdAt: string;
  shippingAddressJson: {
    fullName: string;
    phone: string;
    line1: string;
    district: string;
    city: string;
    postalCode: string;
  };
  user: { id: number; name: string; email: string; phone: string | null };
  items: OrderItem[];
  payment: {
    id: number;
    provider: string;
    merchantOid: string;
    status: string;
    amount: string;
    createdAt: string;
  } | null;
}

const ORDER_STATUS: Record<string, string> = {
  PENDING: "Beklemede",
  PAID: "Ödendi",
  SHIPPED: "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal",
  REFUNDED: "İade",
};

export default function AdminOrderDetailClient({ id }: { id: number }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/admin/orders/${id}`, {
          credentials: "include",
        });
        if (res.status === 404) {
          if (!cancelled) setError("Sipariş bulunamadı.");
          return;
        }
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) setError("Bu sayfaya erişim yetkiniz yok.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError("Sipariş yüklenemedi.");
          return;
        }
        if (!cancelled) setOrder(await res.json());
      } catch {
        if (!cancelled) setError("Sipariş yüklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading)
    return <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>Yükleniyor…</p>;

  if (error)
    return (
      <div>
        <Link href="/admin/siparisler" className={styles.back}>← Siparişlere dön</Link>
        <p style={{ color: "#c0392b" }}>{error}</p>
      </div>
    );

  if (!order) return null;

  const addr = order.shippingAddressJson;
  const st = ORDER_STATUS[order.status] ?? order.status;

  return (
    <div>
      <Link href="/admin/siparisler" className={styles.back}>← Siparişler</Link>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", margin: 0 }}>
          Sipariş #{order.id}
        </h1>
        <span className="badge badge-primary" style={{ fontSize: "0.8rem" }}>
          {st}
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
          {new Date(order.createdAt).toLocaleDateString("tr-TR")}
        </span>
      </div>

      <ShipmentPanel orderId={id} />

      <div className={styles.grid}>
        <div className={styles.card}>
          <p className={styles.cardTitle}>Müşteri</p>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Ad Soyad</span>
            <span className={styles.rowValue}>{order.user.name}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>E-posta</span>
            <span className={styles.rowValue}>{order.user.email}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Telefon</span>
            <span className={styles.rowValue}>{order.user.phone ?? "—"}</span>
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>Teslimat Adresi</p>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Alıcı</span>
            <span className={styles.rowValue}>{addr.fullName}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Telefon</span>
            <span className={styles.rowValue}>{addr.phone}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Adres</span>
            <span className={styles.rowValue}>{addr.line1}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>İlçe / Şehir</span>
            <span className={styles.rowValue}>{addr.district} / {addr.city}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Posta Kodu</span>
            <span className={styles.rowValue}>{addr.postalCode}</span>
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: "1.25rem" }}>
        <p className={styles.cardTitle}>Ürünler</p>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>Ürün</th>
              <th style={{ textAlign: "right" }}>Adet</th>
              <th style={{ textAlign: "right" }}>Birim Fiyat</th>
              <th style={{ textAlign: "right" }}>Toplam</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.titleSnapshot}</td>
                <td style={{ textAlign: "right" }}>{item.quantity}</td>
                <td style={{ textAlign: "right" }}>
                  {Number(item.unitPrice).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>
                  {(Number(item.unitPrice) * item.quantity).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: "right", paddingTop: "0.75rem", fontWeight: 700 }}>Genel Toplam</td>
              <td style={{ textAlign: "right", paddingTop: "0.75rem", fontWeight: 700 }}>
                {Number(order.totalAmount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {order.payment && (
        <div className={styles.card}>
          <p className={styles.cardTitle}>Ödeme</p>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Sağlayıcı</span>
            <span className={styles.rowValue}>{order.payment.provider}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Durum</span>
            <span className={styles.rowValue}>{order.payment.status}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Tutar</span>
            <span className={styles.rowValue}>
              {Number(order.payment.amount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Merchant OID</span>
            <span className={styles.rowValue} style={{ fontSize: "0.75rem" }}>{order.payment.merchantOid}</span>
          </div>
        </div>
      )}
    </div>
  );
}
