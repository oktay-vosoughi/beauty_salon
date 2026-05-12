import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  description: "Şifrenizi sıfırlamak için e-posta adresinizi girin.",
};

export default function SifreSifirlaPage() {
  return (
    <div className="section">
      <div className="container">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
