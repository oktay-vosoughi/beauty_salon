"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

interface KEStatus {
  hasApiKey: boolean;
  hasWarehouseId: boolean;
  hasCargoIntegrationId: boolean;
  baseUrl: string;
  defaultDesi: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function KEStatusClient() {
  const [status, setStatus] = useState<KEStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch(`${API}/api/admin/settings/ke`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: KEStatus) => setStatus(d))
      .catch(() => null);
  }, []);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API}/api/admin/settings/ke/test`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json() as { ok: boolean; message: string };
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, message: "Sunucuya ulaşılamadı." });
    } finally {
      setTesting(false);
    }
  }

  const allConfigured = status?.hasApiKey && status?.hasWarehouseId && status?.hasCargoIntegrationId;

  return (
    <div className={styles.card} style={{ marginBottom: "1.75rem" }}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Kargo Entegratör</h2>
        <span className={allConfigured ? styles.badgeOk : styles.badgeWarn}>
          {allConfigured ? "Yapılandırıldı" : "Eksik Yapılandırma"}
        </span>
      </div>

      <p className={styles.hint}>
        Kargo gönderileri .env dosyasındaki değişkenlerle yönetilir.
        Aşağıdaki durumu kontrol edin ve bağlantıyı test edin.
      </p>

      {status && (
        <div className={styles.keEnvGrid}>
          <KEEnvRow label="KARGO_ENTEGRATOR_API_KEY" ok={status.hasApiKey} />
          <KEEnvRow label="KARGO_ENTEGRATOR_WAREHOUSE_ID" ok={status.hasWarehouseId} />
          <KEEnvRow label="KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID" ok={status.hasCargoIntegrationId} />
          <div className={styles.keEnvRow}>
            <span className={styles.keEnvLabel}>KARGO_ENTEGRATOR_BASE_URL</span>
            <code className={styles.keEnvValue}>{status.baseUrl}</code>
          </div>
          <div className={styles.keEnvRow}>
            <span className={styles.keEnvLabel}>KARGO_ENTEGRATOR_DEFAULT_DESI</span>
            <code className={styles.keEnvValue}>{status.defaultDesi}</code>
          </div>
        </div>
      )}

      {testResult && (
        <div className={testResult.ok ? styles.alertSuccess : styles.alertError} style={{ marginTop: "1rem" }}>
          {testResult.message}
        </div>
      )}

      <div className={styles.actions} style={{ paddingTop: "1rem" }}>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleTest}
          disabled={testing}
        >
          {testing ? "Test ediliyor…" : "Bağlantıyı Test Et"}
        </button>
      </div>

      {/* ── Test Flow Guide ───────────────────────────────────────── */}
      <div className={styles.keDivider} />
      <h3 className={styles.keGuideTitle}>Kargo entegrasyonu nasıl test edilir?</h3>

      <ol className={styles.keSteps}>
        <li className={styles.keStep}>
          <span className={styles.stepNum}>1</span>
          <div>
            <strong>.env değişkenlerini doldurun</strong>
            <p>
              <a href="https://app.kargoentegrator.com" target="_blank" rel="noopener noreferrer">
                app.kargoentegrator.com
              </a>{" "}
              adresine giriş yapın.{" "}
              <em>Ayarlar → API</em> bölümünden API anahtarınızı alın.
              <em>Ayarlar → Depolar</em> bölümünden <code>WAREHOUSE_ID</code>'yi,{" "}
              <em>Entegrasyonlar → Kargo</em> bölümünden <code>CARGO_INTEGRATION_ID</code>'yi bulun.
              Bunları sunucunuzdaki <code>.env</code> dosyasına yazın ve API sunucusunu yeniden başlatın.
            </p>
          </div>
        </li>

        <li className={styles.keStep}>
          <span className={styles.stepNum}>2</span>
          <div>
            <strong>"Bağlantıyı Test Et" butonuna tıklayın</strong>
            <p>
              Yukarıdaki buton Kargo Entegratör sunucusuna gerçek bir istek gönderir.
              "Bağlantı başarılı" mesajı görürseniz API anahtarı doğru çalışıyor demektir.
            </p>
          </div>
        </li>

        <li className={styles.keStep}>
          <span className={styles.stepNum}>3</span>
          <div>
            <strong>Test siparişi oluşturun</strong>
            <p>
              PayTR test modu açıkken test kartıyla ödeme yapın. Ödeme başarılı olduğunda
              sistem otomatik olarak Kargo Entegratör'de bir gönderi oluşturur ve sipariş
              durumunu <em>SHIPPED</em> olarak günceller.
            </p>
          </div>
        </li>

        <li className={styles.keStep}>
          <span className={styles.stepNum}>4</span>
          <div>
            <strong>Sipariş detay sayfasından doğrulayın</strong>
            <p>
              <a href="/admin/siparisler">Siparişler</a> listesinden ilgili siparişe tıklayın.
              Sayfanın alt kısmındaki <em>Kargo Paneli</em>'nde gönderi durumunu,
              takip numarasını ve kargo etiketini görebilirsiniz.
            </p>
          </div>
        </li>

        <li className={styles.keStep}>
          <span className={styles.stepNum}>5</span>
          <div>
            <strong>Manuel gönderi oluşturun (isteğe bağlı)</strong>
            <p>
              Otomatik oluşturma başarısız olursa sipariş detay sayfasındaki Kargo Paneli'nden
              manuel olarak "Gönderi Oluştur" butonuna basabilirsiniz.
              Opsiyonel not girebilir, etiket PDF'ini indirebilirsiniz.
            </p>
          </div>
        </li>

        <li className={styles.keStep}>
          <span className={styles.stepNum}>6</span>
          <div>
            <strong>Müşteri takip görünümü</strong>
            <p>
              Müşteri{" "}
              <a href="/hesabim/siparisler" target="_blank" rel="noopener noreferrer">
                /hesabim/siparisler
              </a>{" "}
              sayfasında kargo durumunu ve takip numarasını görebilir.
              Kargo Entegratör'den yeni durumu çekmek için Kargo Paneli'nden
              "Durumu Yenile" butonunu kullanın.
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
}

function KEEnvRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={styles.keEnvRow}>
      <span className={styles.keEnvLabel}>{label}</span>
      <span className={ok ? styles.keEnvOk : styles.keEnvMissing}>
        {ok ? "Ayarlandı" : "Eksik"}
      </span>
    </div>
  );
}
