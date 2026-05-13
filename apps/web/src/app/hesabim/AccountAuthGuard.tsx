"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/state/AppStateProvider";

export default function AccountAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authStatus } = useAppState();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/giris");
    }
  }, [authStatus, router]);

  if (authStatus !== "authenticated") {
    return <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>Yükleniyor...</p>;
  }

  return <>{children}</>;
}
