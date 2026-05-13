"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/state/AppStateProvider";

export default function AddToCartButton({ productId, inStock }: { productId: number; inStock: boolean }) {
  const router = useRouter();
  const { setCart } = useAppState();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleAdd() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.status === 401) {
        router.push("/giris");
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d.error ?? "Hata oluştu");
        return;
      }
      const cart = await res.json();
      setCart(cart);
      setMsg("Sepete eklendi ✓");
    } catch {
      setMsg("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleAdd}
        disabled={!inStock || loading}
        className="btn btn-primary"
        style={{ width: "100%", maxWidth: 300, marginTop: "0.5rem" }}
      >
        {loading ? "Ekleniyor…" : inStock ? "Sepete Ekle" : "Stok Tükendi"}
      </button>
      {msg && (
        <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: msg.includes("✓") ? "#27ae60" : "#c0392b" }}>
          {msg}
        </p>
      )}
    </div>
  );
}
