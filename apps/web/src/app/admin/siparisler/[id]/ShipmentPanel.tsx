"use client";

import { useEffect, useState } from "react";
import styles from "./detail.module.css";

interface Shipment {
  id: number;
  orderId: number;
  keShipmentId: number | null;
  trackingNumber: string | null;
  status: string;
  cargoCompanyName: string | null;
  note: string | null;
  syncedAt: string | null;
  createdAt: string;
}

const KE_STATUS: Record<string, { label: string; cls: string }> = {
  NEW:              { label: "Oluşturuldu",    cls: styles.badgeNew  },
  PREPARING:        { label: "Hazırlanıyor",   cls: styles.badgeNew  },
  READY_TO_SHIP:    { label: "Kargoya Hazır",  cls: styles.badgeNew  },
  SHIPPED:          { label: "Kargoda",        cls: styles.badgeShip },
  OUT_FOR_DELIVERY: { label: "Dağıtımda",      cls: styles.badgeShip },
  DELIVERED:        { label: "Teslim Edildi",  cls: styles.badgeDone },
  COMPLETED:        { label: "Teslim Edildi",  cls: styles.badgeDone },
  RETURNING:        { label: "İade Sürecinde", cls: styles.badgeFail },
  RETURNED:         { label: "İade Edildi",    cls: styles.badgeFail },
};

export default function ShipmentPanel({ orderId }: { orderId: number }) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [labelError, setLabelError] = useState("");

  async function loadShipment() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        credentials: "include",
      });
      if (res.status === 404) { setShipment(null); return; }
      if (!res.ok) throw new Error("Yükleme hatası");
      setShipment(await res.json());
    } catch {
      setError("Kargo bilgisi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadShipment(); }, [orderId]);

  async function handleCreate() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Kargo oluşturulamadı."); return; }
      setShipment(data);
      setNote("");
    } catch {
      setError("Kargo oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/shipment/refresh`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Durum güncellenemedi."); return; }
      setShipment(data);
    } catch {
      setError("Durum güncellenemedi.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Bu kargoyu iptal etmek istediğinize emin misiniz?")) return;
    setCancelling(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 204) { setShipment(null); return; }
      const data = await res.json();
      setError(data.error ?? "Kargo iptal edilemedi.");
    } catch {
      setError("Kargo iptal edilemedi.");
    } finally {
      setCancelling(false);
    }
  }

  async function handleLabel() {
    setLabelLoading(true);
    setLabelError("");
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/shipment/label`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, string>).error ?? "Etiket alınamadı");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kargo-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setLabelError(err instanceof Error ? err.message : "Etiket alınamadı");
    } finally {
      setLabelLoading(false);
    }
  }

  if (loading) return (
    <div className={styles.shipmentPanel}>
      <p className={styles.shipmentTitle}>Kargo</p>
      <p style={{ color: "var(--color-muted)", fontSize: "0.875rem" }}>Yükleniyor…</p>
    </div>
  );

  const statusInfo = shipment
    ? KE_STATUS[shipment.status] ?? { label: shipment.status, cls: styles.badge }
    : null;

  return (
    <div className={styles.shipmentPanel}>
      <p className={styles.shipmentTitle}>Kargo Yönetimi</p>

      {shipment ? (
        <>
          <div className={styles.trackingBox}>
            {shipment.trackingNumber && (
              <div className={styles.trackingNumber}>
                Takip No: {shipment.trackingNumber}
              </div>
            )}
            <span className={`${styles.badge} ${statusInfo?.cls ?? ""}`}>
              {statusInfo?.label ?? shipment.status}
            </span>
            {shipment.syncedAt && (
              <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.5rem" }}>
                Son güncelleme:{" "}
                {new Date(shipment.syncedAt).toLocaleString("tr-TR")}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button
              className="btn btn-outline"
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ fontSize: "0.8rem" }}
            >
              {refreshing ? "Güncelleniyor…" : "Durumu Yenile"}
            </button>
            <button
              className="btn btn-outline"
              onClick={handleLabel}
              disabled={labelLoading}
              style={{ fontSize: "0.8rem" }}
            >
              {labelLoading ? "İndiriliyor…" : "Etiket İndir (PDF)"}
            </button>
            <button
              className="btn"
              onClick={handleCancel}
              disabled={cancelling}
              style={{
                fontSize: "0.8rem",
                background: "#dc3545",
                color: "#fff",
                borderColor: "#dc3545",
              }}
            >
              {cancelling ? "İptal ediliyor…" : "Kargoyu İptal Et"}
            </button>
          </div>

          {labelError && <p className={styles.error}>{labelError}</p>}
          {error && <p className={styles.error}>{error}</p>}
        </>
      ) : (
        <>
          <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", marginBottom: "0.75rem" }}>
            Bu sipariş için henüz kargo oluşturulmamış.
          </p>
          <textarea
            className={styles.noteInput}
            placeholder="Not (isteğe bağlı)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={creating}
          />
          <div className={styles.actions}>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={creating}
              style={{ fontSize: "0.875rem" }}
            >
              {creating ? "Oluşturuluyor…" : "Kargo Oluştur"}
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </>
      )}
    </div>
  );
}
