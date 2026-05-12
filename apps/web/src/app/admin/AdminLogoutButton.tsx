"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./layout.module.css";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className={styles.logoutBtn}
    >
      {busy ? "Çıkılıyor…" : "Çıkış Yap"}
    </button>
  );
}
