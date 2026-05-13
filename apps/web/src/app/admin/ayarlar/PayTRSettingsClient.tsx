"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

interface PayTRStatus {
  merchantId: string;
  hasMerchantKey: boolean;
  hasMerchantSalt: boolean;
  testMode: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function PayTRSettingsClient() {
  const [status, setStatus] = useState<PayTRStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [merchantId, setMerchantId] = useState("");
  const [merchantKey, setMerchantKey] = useState("");
  const [merchantSalt, setMerchantSalt] = useState("");
  const [testMode, setTestMode] = useState<"0" | "1">("1");
  const [showKey, setShowKey] = useState(false);
  const [showSalt, setShowSalt] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/admin/settings/paytr`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: PayTRStatus) => {
        setStatus(data);
        setMerchantId(data.merchantId);
        setTestMode(data.testMode === "0" ? "0" : "1");
      })
      .catch(() => setMessage({ type: "error", text: "Ayarlar yüklenemedi." }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    const body: Record<string, string> = { testMode };
    if (merchantId.trim()) body.merchantId = merchantId.trim();
    if (merchantKey.trim()) body.merchantKey = merchantKey.trim();
    if (merchantSalt.trim()) body.merchantSalt = merchantSalt.trim();

    try {
      const res = await fetch(`${API}/api/admin/settings/paytr`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Sunucu hatası");
      setMessage({ type: "success", text: "PayTR ayarları kaydedildi." });
      setMerchantKey("");
      setMerchantSalt("");
      // refresh status
      const updated: PayTRStatus = await fetch(`${API}/api/admin/settings/paytr`, {
        credentials: "include",
      }).then((r) => r.json());
      setStatus(updated);
      setMerchantId(updated.merchantId);
      setTestMode(updated.testMode === "0" ? "0" : "1");
    } catch {
      setMessage({ type: "error", text: "Kaydedilemedi. Tekrar deneyin." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className={styles.loading}>Yükleniyor…</p>;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>PayTR Entegrasyonu</h2>
        <span className={status?.hasMerchantKey && status?.hasMerchantSalt ? styles.badgeOk : styles.badgeWarn}>
          {status?.hasMerchantKey && status?.hasMerchantSalt ? "Yapılandırıldı" : "Yapılandırılmadı"}
        </span>
      </div>

      <p className={styles.hint}>
        PayTR Merchant bilgilerinizi buradan kaydedin. Key ve Salt değerleri şifreli saklanır.
        Mevcut değerleri değiştirmek istemiyorsanız ilgili alanları boş bırakın.
      </p>

      {message && (
        <div className={message.type === "success" ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="merchantId">Merchant ID</label>
          <input
            id="merchantId"
            type="text"
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            placeholder="PayTR merchant ID"
            autoComplete="off"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="merchantKey">
            Merchant Key
            {status?.hasMerchantKey && <span className={styles.setTag}>Kayıtlı</span>}
          </label>
          <div className={styles.passwordWrap}>
            <input
              id="merchantKey"
              type={showKey ? "text" : "password"}
              value={merchantKey}
              onChange={(e) => setMerchantKey(e.target.value)}
              placeholder={status?.hasMerchantKey ? "Değiştirmek için yazın" : "PayTR merchant key"}
              autoComplete="new-password"
            />
            <button type="button" className={styles.toggleBtn} onClick={() => setShowKey((v) => !v)}>
              {showKey ? "Gizle" : "Göster"}
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="merchantSalt">
            Merchant Salt
            {status?.hasMerchantSalt && <span className={styles.setTag}>Kayıtlı</span>}
          </label>
          <div className={styles.passwordWrap}>
            <input
              id="merchantSalt"
              type={showSalt ? "text" : "password"}
              value={merchantSalt}
              onChange={(e) => setMerchantSalt(e.target.value)}
              placeholder={status?.hasMerchantSalt ? "Değiştirmek için yazın" : "PayTR merchant salt"}
              autoComplete="new-password"
            />
            <button type="button" className={styles.toggleBtn} onClick={() => setShowSalt((v) => !v)}>
              {showSalt ? "Gizle" : "Göster"}
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label>Test Modu</label>
          <div className={styles.radioGroup}>
            <label className={styles.radio}>
              <input
                type="radio"
                name="testMode"
                value="1"
                checked={testMode === "1"}
                onChange={() => setTestMode("1")}
              />
              Açık (test ödemeleri)
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                name="testMode"
                value="0"
                checked={testMode === "0"}
                onChange={() => setTestMode("0")}
              />
              Kapalı (gerçek ödemeler)
            </label>
          </div>
          {testMode === "0" && (
            <p className={styles.warnText}>
              Gerçek ödeme modu aktif — canlı işlemler gerçekleşir.
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
