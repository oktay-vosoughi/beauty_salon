"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../urunler/page.module.css";

interface Order {
  id: number;
  status: string;
  totalAmount: string;
  createdAt: string;
  user: { name: string; email: string };
  payment: { status: string } | null;
  _count: { items: number };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  PAID: "Ödendi",
  CANCELLED: "İptal",
  REFUNDED: "İade",
};

export default function AdminOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?page=${page}&limit=20`, { credentials: "include" });
      if (res.status === 401 || res.status === 403) { setError("Yetki yok"); return; }
      const data = await res.json();
      setOrders(data.items);
      setTotal(data.total);
    } catch { setError("Siparişler yüklenemedi"); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  }

  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Siparişler ({total})</h1>
      </div>

      {loading ? <p style={{ color: "var(--color-muted)" }}>Yükleniyor…</p> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Müşteri</th>
                <th>Tutar</th>
                <th>Ürün Sayısı</th>
                <th>Durum</th>
                <th>Tarih</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>
                    <div>{o.user.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{o.user.email}</div>
                  </td>
                  <td>₺{Number(o.totalAmount).toFixed(2)}</td>
                  <td>{o._count.items}</td>
                  <td>
                    <span className="badge badge-primary" style={{
                      background: o.status === "PAID" ? "#27ae60" : o.status === "CANCELLED" ? "#e74c3c" : o.status === "REFUNDED" ? "#f39c12" : "#c8a87e"
                    }}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem" }}>
                    {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className={styles.actions}>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="form-control"
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", width: "120px" }}
                    >
                      <option value="PENDING">Beklemede</option>
                      <option value="PAID">Ödendi</option>
                      <option value="CANCELLED">İptal</option>
                      <option value="REFUNDED">İade</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline" style={{ fontSize: "0.8rem" }}>← Önceki</button>
          <span>Sayfa {page} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn btn-outline" style={{ fontSize: "0.8rem" }}>Sonraki →</button>
        </div>
      )}
    </div>
  );
}
