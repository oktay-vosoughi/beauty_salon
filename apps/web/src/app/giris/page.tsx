import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Hesabınıza giriş yapın.",
};

export default function GirisPage() {
  return (
    <div className="section">
      <div className="container">
        <Suspense fallback={<div style={{ maxWidth: 440, margin: "0 auto", padding: "2.5rem", textAlign: "center" }}>Yükleniyor…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
