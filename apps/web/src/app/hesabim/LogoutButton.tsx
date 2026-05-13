"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/state/AppStateProvider";

export default function LogoutButton() {
  const router = useRouter();
  const { logout } = useAppState();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await logout();
    } finally {
      setLoading(false);
      router.push("/giris");
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={handleLogout} className="btn btn-outline" disabled={loading}>
      {loading ? "Çıkış yapılıyor…" : "Çıkış Yap"}
    </button>
  );
}
