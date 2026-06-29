import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kayıtlı Kartlarım",
};

export default function KartlarimPage() {
  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: "1.5rem" }}>
        Kayıtlı Kartlarım
      </h2>
      <div
        style={{
          background: "var(--color-bg-light,#fafafa)",
          borderRadius: 8,
          padding: "1.5rem",
          fontSize: "0.9rem",
          color: "var(--color-muted)",
          lineHeight: 1.6,
        }}
      >
        <p style={{ margin: 0 }}>
          Güvenliğiniz için kart bilgileriniz sitemizde <strong>saklanmaz</strong>.
          Tüm ödeme işlemleri, güvenli ödeme altyapısı{" "}
          <strong>PayTR</strong> tarafından işlenir ve kart verileriniz
          doğrudan PayTR&apos;nin PCI-DSS sertifikalı sistemlerinde korunur.
        </p>
        <p style={{ margin: "1rem 0 0" }}>
          Her ödemede kart bilgilerinizi ödeme ekranında yeniden
          girmeniz gerekir.
        </p>
      </div>
    </div>
  );
}
