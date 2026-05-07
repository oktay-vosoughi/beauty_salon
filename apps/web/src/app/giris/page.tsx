import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Hesabınıza giriş yapın.",
};

export default function GirisPage() {
  return (
    <div className="section">
      <div className="container">
        <LoginForm />
      </div>
    </div>
  );
}
