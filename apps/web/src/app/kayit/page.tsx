import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Güzellik Merkezi'ne üye olun.",
};

export default function KayitPage() {
  return (
    <div className="section">
      <div className="container">
        <RegisterForm />
      </div>
    </div>
  );
}
