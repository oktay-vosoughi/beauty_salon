"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/state/AppStateProvider";
import styles from "./page.module.css";

interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    title: string;
    slug: string;
    price: string;
    stock: number;
    images: { url: string; alt: string }[];
  };
}

interface Cart {
  id: number;
  items: CartItem[];
  campaign?: { id: number; title: string } | null;
  promotion?: {
    subtotal: number;
    discountTotal: number;
    total: number;
    items: Array<{
      productId: number;
      quantity: number;
      freeQuantity: number;
      discountAmount: number;
    }>;
  };
}

export default function SepetClient() {
  const router = useRouter();
  const { setCart: setSharedCart } = useAppState();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState({
    fullName: "", phone: "", line1: "", district: "", city: "", postalCode: "",
  });

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { credentials: "include" });
      if (res.status === 401) {
        setCart(null);
        setSharedCart(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCart(data);
      setSharedCart(data);
    } catch {
      setError("Sepet yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [setSharedCart]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  async function updateQuantity(itemId: number, quantity: number) {
    if (quantity < 1) return removeItem(itemId);
    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ quantity }),
    });
    if (res.ok) {
      const updatedCart = await res.json();
      setCart(updatedCart);
      setSharedCart(updatedCart);
    }
  }

  async function removeItem(itemId: number) {
    const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      const updatedCart = await res.json();
      setCart(updatedCart);
      setSharedCart(updatedCart);
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setCheckoutLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ shippingAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Sipariş oluşturulamadı"); return; }
      router.push(`/odeme/${data.id}`);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setCheckoutLoading(false);
    }
  }

  const total = cart?.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity, 0
  ) ?? 0;
  const promotion = cart?.promotion;
  const promotionItemsByProductId = new Map(
    promotion?.items.map((item) => [item.productId, item]) ?? []
  );
  const payableTotal = promotion?.total ?? total;
  const discountTotal = promotion?.discountTotal ?? 0;

  if (loading) return <p style={{ color: "var(--color-muted)" }}>Yükleniyor…</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.empty}>
        <h2>Sepetim</h2>
        <p>Sepetiniz boş.</p>
        <Link href="/urunler" className="btn btn-primary">Alışverişe Başla</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className={styles.title}>Sepetim ({cart.items.length} ürün)</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <div className={styles.layout}>
        <div className={styles.items}>
          {cart.items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <Link href={`/urunler/${item.product.slug}`} className={styles.itemTitle}>
                  {item.product.title}
                </Link>
                <div className={styles.itemPrice}>
                  ₺{Number(item.product.price).toFixed(2)}
                </div>
                {(promotionItemsByProductId.get(item.product.id)?.freeQuantity ?? 0) > 0 && (
                  <div className={styles.giftNote}>
                    {promotionItemsByProductId.get(item.product.id)?.freeQuantity} adet kampanya hediyesi
                  </div>
                )}
              </div>
              <div className={styles.itemActions}>
                <div className={styles.qty}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className={styles.qtyBtn}>−</button>
                  <span className={styles.qtyVal}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className={styles.qtyBtn}
                    disabled={item.quantity >= item.product.stock}
                  >+</button>
                </div>
                <div className={styles.itemTotal}>
                  ₺{(Number(item.product.price) * item.quantity).toFixed(2)}
                </div>
                <button onClick={() => removeItem(item.id)} className={styles.removeBtn}>✕</button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Sipariş Özeti</h3>
          <div className={styles.summaryRow}>
            <span>Ara Toplam</span>
            <span>₺{total.toFixed(2)}</span>
          </div>
          {discountTotal > 0 && (
            <div className={`${styles.summaryRow} ${styles.discountRow}`}>
              <span>{cart.campaign?.title ?? "Kampanya indirimi"}</span>
              <span>-₺{discountTotal.toFixed(2)}</span>
            </div>
          )}
          <div className={styles.summaryRow}>
            <span>Kargo</span>
            <span>Ücretsiz</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span>Toplam</span>
            <span>₺{payableTotal.toFixed(2)}</span>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
            onClick={() => setShowCheckout(true)}
          >
            Siparişi Tamamla
          </button>
        </div>
      </div>

      {showCheckout && (
        <div className={styles.checkoutModal}>
          <div className={styles.checkoutBox}>
            <h3>Teslimat Adresi</h3>
            <form onSubmit={handleCheckout}>
              {[
                { name: "fullName", label: "Ad Soyad", type: "text" },
                { name: "phone", label: "Telefon", type: "tel" },
                { name: "line1", label: "Adres", type: "text" },
                { name: "district", label: "İlçe", type: "text" },
                { name: "city", label: "Şehir", type: "text" },
                { name: "postalCode", label: "Posta Kodu", type: "text" },
              ].map((f) => (
                <div className="form-group" key={f.name}>
                  <label>{f.label}</label>
                  <input
                    type={f.type}
                    className="form-control"
                    value={address[f.name as keyof typeof address]}
                    onChange={(e) => setAddress((a) => ({ ...a, [f.name]: e.target.value }))}
                    required
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="submit" className="btn btn-primary" disabled={checkoutLoading} style={{ flex: 1 }}>
                  {checkoutLoading ? "İşleniyor…" : "Ödemeye Geç"}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowCheckout(false)}>
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
