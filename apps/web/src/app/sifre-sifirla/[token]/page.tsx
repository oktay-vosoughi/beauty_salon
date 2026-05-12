import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Yeni Şifre Belirle",
  description: "Yeni şifrenizi belirleyin.",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <div className="section">
      <div className="container">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
