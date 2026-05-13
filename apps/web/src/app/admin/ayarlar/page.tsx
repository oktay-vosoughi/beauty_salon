import PayTRSettingsClient from "./PayTRSettingsClient";
import KEStatusClient from "./KEStatusClient";
import styles from "./page.module.css";

export const metadata = { title: "PayTR Ayarları — Admin" };

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className={styles.pageTitle}>Ödeme Ayarları</h1>

      {/* ── Kurulum Rehberi ─────────────────────────────────────────── */}
      <div className={styles.guide}>
        <h2 className={styles.guideTitle}>PayTR Kurulum Rehberi</h2>

        <ol className={styles.steps}>
          <li className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <div>
              <strong>PayTR hesabı oluşturun</strong>
              <p>
                <a href="https://www.paytr.com" target="_blank" rel="noopener noreferrer">
                  paytr.com
                </a>{" "}
                adresine gidin ve ücretsiz üye olun. Başvurunuz onaylandıktan
                sonra merchant panelinize erişebilirsiniz.
              </p>
            </div>
          </li>

          <li className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <div>
              <strong>API bilgilerinizi alın</strong>
              <p>
                PayTR panelinizde sol menüden{" "}
                <em>Entegrasyon → iFrame API</em> sayfasına gidin.
                Orada üç bilgi göreceksiniz:
              </p>
              <ul className={styles.subList}>
                <li>
                  <strong>Merchant ID</strong> — hesabınızın herkese açık
                  kimlik numarası
                </li>
                <li>
                  <strong>Merchant Key</strong> — ödeme token imzalamak için
                  kullanılan gizli anahtar
                </li>
                <li>
                  <strong>Merchant Salt</strong> — hash doğrulaması için
                  kullanılan ikinci gizli değer
                </li>
              </ul>
            </div>
          </li>

          <li className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <div>
              <strong>Callback URL'yi PayTR paneline ekleyin</strong>
              <p>
                PayTR panelinizde <em>Entegrasyon → iFrame API → Başarı/Hata
                URL</em> alanlarına sitenizin adresini girin:
              </p>
              <div className={styles.codeBlock}>
                <div>
                  <span className={styles.codeLabel}>Callback (S2S):</span>
                  <code>https://ALAN_ADINIZ/api/payments/paytr/callback</code>
                </div>
                <div>
                  <span className={styles.codeLabel}>Başarı sayfası:</span>
                  <code>https://ALAN_ADINIZ/odeme/sonuc?status=success</code>
                </div>
                <div>
                  <span className={styles.codeLabel}>Hata sayfası:</span>
                  <code>https://ALAN_ADINIZ/odeme/sonuc?status=fail</code>
                </div>
              </div>
            </div>
          </li>

          <li className={styles.step}>
            <span className={styles.stepNum}>4</span>
            <div>
              <strong>Bilgileri aşağıdaki forma girin ve kaydedin</strong>
              <p>
                Merchant ID, Key ve Salt değerlerini alttaki alanlara yapıştırın.
                Key ve Salt şifreli olarak veritabanında saklanır, hiçbir zaman
                açık metin olarak görüntülenmez.
              </p>
            </div>
          </li>

          <li className={styles.step}>
            <span className={styles.stepNum}>5</span>
            <div>
              <strong>Test ödemesi yapın</strong>
              <p>
                Test Modu <em>Açık</em> iken PayTR'ın test kartını kullanabilirsiniz:
              </p>
              <ul className={styles.subList}>
                <li>Kart No: <code>4355 0843 5508 4358</code></li>
                <li>SKT: <code>12/26</code> — CVV: <code>000</code></li>
                <li>3D Şifre: <code>1</code></li>
              </ul>
              <p>
                Sepete bir ürün ekleyin, ödemeye geçin ve testi tamamlayın.
                Sipariş durumunun <em>PAID</em> olarak güncellendiğini
                <a href="/admin/siparisler"> siparişler sayfasında</a> kontrol edin.
              </p>
            </div>
          </li>

          <li className={styles.step}>
            <span className={styles.stepNum}>6</span>
            <div>
              <strong>Canlıya geçin</strong>
              <p>
                Test başarılıysa aşağıdan <em>Test Modu → Kapalı</em> seçin ve
                kaydedin. Artık gerçek ödemeler işlenecektir.
              </p>
              <p className={styles.noteText}>
                Not: PayTR canlı hesap aktivasyonu için kimlik/vergi belgesi
                onayı gerektirebilir. PayTR destek ekibiyle iletişime geçin.
              </p>
            </div>
          </li>
        </ol>
      </div>
      {/* ────────────────────────────────────────────────────────────── */}

      <KEStatusClient />

      <PayTRSettingsClient />
    </div>
  );
}
