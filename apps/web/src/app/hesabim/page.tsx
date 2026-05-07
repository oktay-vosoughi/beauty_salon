import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profilim",
};

export default function ProfilPage() {
  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: "1.5rem" }}>
        Profilim
      </h2>
      <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
        Profil bilgilerinizi buradan güncelleyebilirsiniz. Bu özellik yakında aktif olacak.
      </p>
    </div>
  );
}
