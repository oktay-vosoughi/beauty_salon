"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

declare global {
  interface Window {
    iFrameResize?: (opts: object, target: string) => void;
  }
}

export default function PaymentClient({ orderId }: { orderId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getToken() {
      try {
        const res = await fetch(`/api/payments/paytr/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ orderId: Number(orderId) }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Ödeme token alınamadı"); return; }
        setToken(data.token);
      } catch {
        setError("Ödeme başlatılamadı. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    }
    getToken();
  }, [orderId]);

  // PayTR's iframeResizer auto-grows the iframe to its full content height so
  // the pay button at the bottom is always reachable (the form is taller than
  // a fixed height, and scrolling="no" prevents internal scrolling).
  useEffect(() => {
    if (!token) return;
    const init = () => window.iFrameResize?.({}, "#paytriframe");
    if (window.iFrameResize) {
      init();
      return;
    }
    const existing = document.getElementById("paytr-iframe-resizer");
    if (existing) {
      existing.addEventListener("load", init);
      return;
    }
    const s = document.createElement("script");
    s.id = "paytr-iframe-resizer";
    s.src = "https://www.paytr.com/js/iframeResizer.min.js";
    s.onload = init;
    document.body.appendChild(s);
  }, [token]);

  if (loading) {
    return (
      <div className={styles.center}>
        <p>Ödeme sayfası hazırlanıyor…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.center}>
        <div className="alert alert-error">{error}</div>
        <a href="/sepet" className="btn btn-outline" style={{ marginTop: "1rem" }}>
          Sepete Dön
        </a>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Güvenli Ödeme</h1>
      <p className={styles.subtitle}>
        Ödemeniz PayTR güvencesiyle işlenmektedir.
      </p>
      {token && (
        <div className={styles.iframeWrap}>
          <iframe
            src={`https://www.paytr.com/odeme/guvenli/${token}`}
            id="paytriframe"
            frameBorder="0"
            scrolling="no"
            className={styles.iframe}
            title="PayTR Ödeme"
          />
        </div>
      )}
    </div>
  );
}
