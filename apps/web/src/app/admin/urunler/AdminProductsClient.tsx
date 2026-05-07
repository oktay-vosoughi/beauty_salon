"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";

interface Product {
  id: number;
  slug: string;
  title: string;
  price: string;
  stock: number;
  isActive: boolean;
  category: { name: string };
}

export default function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?page=${page}&limit=20`, {
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) {
        setError("Bu sayfaya erişim yetkiniz yok.");
        return;
      }
      const data = await res.json();
      setProducts(data.items);
      setTotal(data.total);
    } catch {
      setError("Ürünler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function toggleActive(id: number, current: boolean) {
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !current }),
    });
    fetchProducts();
  }

  async function deleteProduct(id: number) {
    if (!confirm("Bu ürünü pasif yapmak istediğinizden emin misiniz?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE", credentials: "include" });
    fetchProducts();
  }

  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Ürünler ({total})</h1>
        <a href="/admin/urunler/yeni" className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
          + Yeni Ürün
        </a>
      </div>

      {loading ? (
        <p style={{ color: "var(--color-muted)" }}>Yükleniyor…</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Başlık</th>
                <th>Kategori</th>
                <th>Fiyat</th>
                <th>Stok</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.title}</td>
                  <td>{p.category?.name}</td>
                  <td>₺{Number(p.price).toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className={`badge ${p.isActive ? "badge-primary" : ""}`}
                          style={!p.isActive ? { background: "#ddd", color: "#666" } : {}}>
                      {p.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <a href={`/admin/urunler/${p.id}`} className={styles.actionBtn}>Düzenle</a>
                    <button
                      onClick={() => toggleActive(p.id, p.isActive)}
                      className={styles.actionBtn}
                    >
                      {p.isActive ? "Pasif Yap" : "Aktif Yap"}
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className={`${styles.actionBtn} ${styles.dangerBtn}`}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline" style={{ fontSize: "0.8rem" }}>
            ← Önceki
          </button>
          <span>Sayfa {page} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn btn-outline" style={{ fontSize: "0.8rem" }}>
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}
