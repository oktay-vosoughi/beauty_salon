"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

function SonucContent() {
  const params = useSearchParams();
  const status = params.get("status") ?? "success";
  const orderId = params.get("orderId");

  const isSuccess = status === "success";

  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>{isSuccess ? "✓" : "✗"}</div>
      <h1 className={styles.title}>
        {isSuccess ? "Ödeme Başarılı!" : "Ödeme Başarısız"}
      </h1>
      <p className={styles.desc}>
        {isSuccess
          ? `Siparişiniz (${orderId ? `#${orderId}` : ""}) alındı. Kargoya verildiğinde e-posta ile bilgilendirileceksiniz.`
          : "Ödemeniz işlenemedi. Lütfen tekrar deneyin veya başka bir ödeme yöntemi kullanın."}
      </p>
      <div className={styles.buttons}>
        {isSuccess ? (
          <Link href="/hesabim/siparisler" className="btn btn-primary">Siparişlerimi Gör</Link>
        ) : (
          <Link href="/sepet" className="btn btn-primary">Sepete Dön</Link>
        )}
        <Link href="/" className="btn btn-outline">Ana Sayfaya Dön</Link>
      </div>
    </div>
  );
}

export default function OdemeSonucPage() {
  return (
    <div className="section">
      <div className="container">
        <Suspense fallback={<p>Yükleniyor…</p>}>
          <SonucContent />
        </Suspense>
      </div>
    </div>
  );
}
