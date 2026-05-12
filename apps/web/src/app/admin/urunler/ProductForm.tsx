"use client";

import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./form.module.css";

export interface ProductImageInput {
  url: string;
  alt: string;
  sortOrder: number;
}

const UPLOAD_PREFIX = "/uploads/products/";

function isUploadedUrl(url: string): boolean {
  return url.startsWith(UPLOAD_PREFIX);
}

function uploadFilename(url: string): string | null {
  if (!isUploadedUrl(url)) return null;
  return url.slice(UPLOAD_PREFIX.length).split("/")[0] || null;
}

async function deleteUpload(url: string): Promise<void> {
  const filename = uploadFilename(url);
  if (!filename) return;
  try {
    await fetch(`/api/admin/uploads/${encodeURIComponent(filename)}`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    // best-effort cleanup; swallow errors so UI flow continues
  }
}

export interface ProductFormValues {
  slug: string;
  title: string;
  description: string;
  price: string;
  stock: string;
  isActive: boolean;
  categoryId: string;
  images: ProductImageInput[];
}

interface Category {
  id: number;
  name: string;
}

interface Props {
  mode: "create" | "edit";
  productId?: number;
  initial?: Partial<ProductFormValues>;
}

const empty: ProductFormValues = {
  slug: "",
  title: "",
  description: "",
  price: "",
  stock: "0",
  isActive: true,
  categoryId: "",
  images: [],
};

const slugRegex = /^[a-z0-9-]+$/;

function isValidImageUrl(value: string): boolean {
  if (!value) return false;
  if (value.startsWith("/uploads/")) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ProductForm({ mode, productId, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({ ...empty, ...initial });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [autoSlug, setAutoSlug] = useState(mode === "create" && !initial?.slug);
  // Upload progress per image-row index.
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  // Track uploaded URLs that exist on the server so we can clean them up if the
  // admin cancels (closes the form without saving) — only used for *newly*
  // uploaded files in this session.
  const sessionUploadsRef = useRef<Set<string>>(new Set());
  // Snapshot of urls present when the form was first rendered (so we know which
  // ones existed in the DB previously and were removed by the admin).
  const originalUrlsRef = useRef<Set<string>>(
    new Set((initial?.images ?? []).map((i) => i.url))
  );

  useEffect(() => {
    fetch("/api/categories", { credentials: "include" })
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => setError("Kategoriler yüklenemedi."));
  }, []);

  useEffect(() => {
    if (autoSlug) {
      setValues((v) => ({ ...v, slug: slugify(v.title) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.title, autoSlug]);

  function update<K extends keyof ProductFormValues>(key: K, val: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function updateImage(idx: number, patch: Partial<ProductImageInput>) {
    setValues((v) => ({
      ...v,
      images: v.images.map((im, i) => (i === idx ? { ...im, ...patch } : im)),
    }));
  }

  function addImage() {
    setValues((v) => ({
      ...v,
      images: [...v.images, { url: "", alt: "", sortOrder: v.images.length }],
    }));
  }

  async function removeImage(idx: number) {
    const target = values.images[idx];
    if (!target) return;
    if (
      target.url &&
      !confirm(
        isUploadedUrl(target.url)
          ? "Görsel sunucudan da silinecek. Devam edilsin mi?"
          : "Bu görseli kaldırmak istediğinize emin misiniz?"
      )
    ) {
      return;
    }
    setValues((v) => ({
      ...v,
      images: v.images.filter((_, i) => i !== idx).map((im, i) => ({ ...im, sortOrder: i })),
    }));
    if (target.url && isUploadedUrl(target.url)) {
      await deleteUpload(target.url);
      sessionUploadsRef.current.delete(target.url);
      originalUrlsRef.current.delete(target.url);
    }
  }

  async function handleFileSelect(idx: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so same file can be re-picked later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Sadece görsel dosyaları yüklenebilir.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Dosya 5 MB'dan büyük olamaz.");
      return;
    }
    setError("");
    setUploadingIdx(idx);
    try {
      const previousUrl = values.images[idx]?.url ?? "";
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Yükleme başarısız.");
      }
      const data = (await res.json()) as { url: string };
      // If the slot already had an uploaded image (uploaded earlier in this
      // session and not yet persisted), clean it up server-side.
      if (
        previousUrl &&
        isUploadedUrl(previousUrl) &&
        sessionUploadsRef.current.has(previousUrl) &&
        !originalUrlsRef.current.has(previousUrl)
      ) {
        await deleteUpload(previousUrl);
        sessionUploadsRef.current.delete(previousUrl);
      }
      sessionUploadsRef.current.add(data.url);
      updateImage(idx, { url: data.url, alt: values.images[idx]?.alt || file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız.");
    } finally {
      setUploadingIdx(null);
    }
  }

  function validate(): string | null {
    if (!values.title.trim()) return "Başlık zorunludur.";
    if (!values.slug.trim()) return "Slug zorunludur.";
    if (!slugRegex.test(values.slug)) return "Slug sadece küçük harf, rakam ve tire içerebilir.";
    if (!values.description.trim()) return "Açıklama zorunludur.";
    const price = Number(values.price);
    if (!Number.isFinite(price) || price <= 0) return "Fiyat 0'dan büyük olmalıdır.";
    const stock = Number(values.stock);
    if (!Number.isInteger(stock) || stock < 0) return "Stok 0 veya pozitif tam sayı olmalıdır.";
    if (!values.categoryId) return "Kategori seçiniz.";
    for (const im of values.images) {
      if (!im.url.trim()) return "Görsel boş bırakılamaz. Yükleyin veya URL girin, ya da satırı silin.";
      if (!isValidImageUrl(im.url.trim())) return `Geçersiz görsel: ${im.url}`;
    }
    return null;
  }

  // After a successful save, sync upload-bookkeeping refs.
  function commitUploads(savedUrls: string[]) {
    sessionUploadsRef.current = new Set(
      savedUrls.filter((u) => isUploadedUrl(u))
    );
    originalUrlsRef.current = new Set(savedUrls);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        slug: values.slug.trim(),
        title: values.title.trim(),
        description: values.description.trim(),
        price: Number(values.price),
        stock: Number(values.stock),
        isActive: values.isActive,
        categoryId: Number(values.categoryId),
        images: values.images.map((im, i) => ({
          url: im.url.trim(),
          alt: im.alt.trim() || values.title.trim(),
          sortOrder: i,
        })),
      };
      const url = mode === "create"
        ? "/api/admin/products"
        : `/api/admin/products/${productId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Kayıt başarısız.");
      }
      const saved = await res.json().catch(() => ({} as { id?: number }));
      const finalUrls = payload.images.map((im) => im.url);
      // For edits: any *original* DB URL that's no longer present and lives in
      // /uploads has just been orphaned by the API-side image replacement.
      // Best-effort delete the physical file so disk doesn't grow.
      if (mode === "edit") {
        const finalSet = new Set(finalUrls);
        const orphaned = Array.from(originalUrlsRef.current).filter(
          (u) => !finalSet.has(u) && isUploadedUrl(u)
        );
        await Promise.all(orphaned.map((u) => deleteUpload(u)));
      }
      commitUploads(finalUrls);
      setSuccess(mode === "create" ? "Ürün oluşturuldu." : "Ürün güncellendi.");
      if (mode === "create" && typeof saved.id === "number") {
        setTimeout(() => router.push(`/admin/urunler/${saved.id}`), 600);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (mode !== "edit" || !productId) return;
    if (!confirm("Bu ürünü pasif yapmak istediğinizden emin misiniz?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Silme başarısız.");
      router.push("/admin/urunler");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className={styles.grid}>
        <div className="form-group">
          <label htmlFor="title">Başlık *</label>
          <input
            id="title"
            className="form-control"
            value={values.title}
            onChange={(e) => update("title", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <label htmlFor="slug">Slug *</label>
            {mode === "create" && (
              <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.75rem", fontWeight: 400, color: "var(--color-muted)" }}>
                <input
                  type="checkbox"
                  aria-label="Slug otomatik oluştur"
                  checked={autoSlug}
                  onChange={(e) => setAutoSlug(e.target.checked)}
                  style={{ marginLeft: 8, marginRight: 4 }}
                />
                Otomatik
              </span>
            )}
          </div>
          <input
            id="slug"
            className="form-control"
            value={values.slug}
            onChange={(e) => {
              setAutoSlug(false);
              update("slug", e.target.value);
            }}
            pattern="[a-z0-9-]+"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Fiyat (₺) *</label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            className="form-control"
            value={values.price}
            onChange={(e) => update("price", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="stock">Stok *</label>
          <input
            id="stock"
            type="number"
            step="1"
            min="0"
            className="form-control"
            value={values.stock}
            onChange={(e) => update("stock", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="categoryId">Kategori *</label>
          <select
            id="categoryId"
            className="form-control"
            value={values.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            required
          >
            <option value="">— Seçiniz —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
            />
            Aktif (sitede görünür)
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">Açıklama *</label>
        <textarea
          id="description"
          className="form-control"
          rows={6}
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <div className={styles.imagesHeader}>
          <label>Görseller</label>
          <button type="button" className="btn btn-outline" onClick={addImage} style={{ fontSize: "0.8rem", padding: "0.4rem 1rem" }}>
            + Görsel Ekle
          </button>
        </div>
        <p style={{ color: "var(--color-muted)", fontSize: "0.75rem", margin: "0 0 0.75rem" }}>
          Bilgisayardan dosya yükleyebilir veya doğrudan URL girebilirsiniz. Maks. 5 MB; JPG/PNG/WEBP/AVIF/GIF.
        </p>
        {values.images.length === 0 && (
          <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>Henüz görsel yok.</p>
        )}
        {values.images.map((im, idx) => {
          const inputId = `imgfile-${idx}`;
          const uploading = uploadingIdx === idx;
          return (
            <div key={idx} className={styles.imageRow}>
              <div className={styles.imagePreview}>
                {im.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={im.url} alt={im.alt || "preview"} />
                ) : (
                  <span className={styles.previewPlaceholder}>—</span>
                )}
              </div>
              <div className={styles.imageInputs}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="https://... veya /uploads/products/xyz.jpg"
                  value={im.url}
                  onChange={(e) => updateImage(idx, { url: e.target.value })}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Alt metin (erişilebilirlik)"
                  value={im.alt}
                  onChange={(e) => updateImage(idx, { alt: e.target.value })}
                />
              </div>
              <div className={styles.imageActions}>
                <input
                  id={inputId}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(idx, e)}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor={inputId}
                  className="btn btn-outline"
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.4rem 0.8rem",
                    cursor: uploading ? "wait" : "pointer",
                    opacity: uploading ? 0.6 : 1,
                  }}
                >
                  {uploading ? "Yükleniyor…" : "Yükle"}
                </label>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  disabled={uploading}
                  className="btn btn-outline"
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.4rem 0.8rem",
                    borderColor: "#dc3545",
                    color: "#dc3545",
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Kaydediliyor…" : mode === "create" ? "Ürünü Oluştur" : "Değişiklikleri Kaydet"}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => router.push("/admin/urunler")}
          disabled={loading}
        >
          İptal
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={onDelete}
            disabled={loading}
            className="btn btn-outline"
            style={{ marginLeft: "auto", borderColor: "#dc3545", color: "#dc3545" }}
          >
            Pasif Yap
          </button>
        )}
      </div>
    </form>
  );
}
