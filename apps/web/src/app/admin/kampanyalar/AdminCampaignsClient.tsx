"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";

interface Campaign {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  type: CampaignType;
  discountPercent: string | number | null;
  buyQuantity: number | null;
  payQuantity: number | null;
  isActive: boolean;
  showOnHomepage: boolean;
  bannerTitle: string | null;
  bannerText: string | null;
  bannerButtonText: string | null;
  bannerButtonHref: string | null;
}

type CampaignType = "BUY_2_GET_2" | "PERCENT_DISCOUNT" | "BUY_X_PAY_Y";

interface CampaignFormState {
  slug: string;
  title: string;
  description: string;
  type: CampaignType;
  discountPercent: number | null;
  buyQuantity: number | null;
  payQuantity: number | null;
  isActive: boolean;
  showOnHomepage: boolean;
  bannerTitle: string;
  bannerText: string;
  bannerButtonText: string;
  bannerButtonHref: string;
}

const emptyForm: CampaignFormState = {
  slug: "iki-al-iki-bedava",
  title: "2 Al 2 Bedava",
  description: "Sepete 4 ürün ekleyin, en ucuz 2 ürün hediye olsun.",
  type: "BUY_2_GET_2",
  discountPercent: null,
  buyQuantity: 4,
  payQuantity: 2,
  isActive: true,
  showOnHomepage: true,
  bannerTitle: "2 Al 2 Bedava",
  bannerText: "Sepete 4 ürün ekleyin, en ucuz 2 ürün bizden.",
  bannerButtonText: "Alışverişe Başla",
  bannerButtonHref: "/urunler",
};

export default function AdminCampaignsClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kampanyalar yüklenemedi.");
        return;
      }
      setCampaigns(data.items ?? []);
    } catch {
      setError("Kampanyalar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  function editCampaign(campaign: Campaign) {
    setEditingId(campaign.id);
    setForm({
      slug: campaign.slug,
      title: campaign.title,
      description: campaign.description ?? "",
      type: campaign.type,
      discountPercent: campaign.discountPercent === null ? null : Number(campaign.discountPercent),
      buyQuantity: campaign.buyQuantity,
      payQuantity: campaign.payQuantity,
      isActive: campaign.isActive,
      showOnHomepage: campaign.showOnHomepage,
      bannerTitle: campaign.bannerTitle ?? "",
      bannerText: campaign.bannerText ?? "",
      bannerButtonText: campaign.bannerButtonText ?? "",
      bannerButtonHref: campaign.bannerButtonHref ?? "",
    });
    setSuccess("");
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function updateType(type: CampaignType) {
    setForm((current) => {
      if (type === "PERCENT_DISCOUNT") {
        return {
          ...current,
          type,
          discountPercent: current.discountPercent ?? 20,
          buyQuantity: null,
          payQuantity: null,
        };
      }

      if (type === "BUY_X_PAY_Y") {
        return {
          ...current,
          type,
          discountPercent: null,
          buyQuantity: current.buyQuantity && current.buyQuantity !== 4 ? current.buyQuantity : 3,
          payQuantity: current.payQuantity && current.payQuantity !== 2 ? current.payQuantity : 1,
        };
      }

      return {
        ...current,
        type,
        discountPercent: null,
        buyQuantity: 4,
        payQuantity: 2,
      };
    });
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const url = editingId ? `/api/admin/campaigns/${editingId}` : "/api/admin/campaigns";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kampanya kaydedilemedi.");
        return;
      }
      setSuccess(editingId ? "Kampanya güncellendi." : "Kampanya oluşturuldu.");
      resetForm();
      fetchCampaigns();
    } catch {
      setError("Kampanya kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleCampaign(campaign: Campaign) {
    await fetch(`/api/admin/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !campaign.isActive }),
    });
    fetchCampaigns();
  }

  async function deleteCampaign(campaign: Campaign) {
    if (!confirm(`"${campaign.title}" kampanyasını silmek istediğinizden emin misiniz?`)) return;

    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kampanya silinemedi.");
        return;
      }
      if (editingId === campaign.id) resetForm();
      setSuccess("Kampanya silindi.");
      fetchCampaigns();
    } catch {
      setError("Kampanya silinemedi.");
    }
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Kampanyalar</h1>
      {error && <div className={styles.alertError}>{error}</div>}
      {success && <div className={styles.alertSuccess}>{success}</div>}

      <div className={styles.layout}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>{editingId ? "Kampanyayı Düzenle" : "Yeni Kampanya"}</h2>
            {editingId && <button type="button" className={styles.textBtn} onClick={resetForm}>Yeni kayıt</button>}
          </div>
          <p className={styles.hint}>Kampanya türünü seçin; sistem sepet ve ödeme tutarını otomatik hesaplar.</p>

          <form className={styles.form} onSubmit={submitForm}>
            <div className={styles.field}>
              <label>Kampanya adı</label>
              <input value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label>Slug</label>
              <input value={form.slug} onChange={(e) => setForm((v) => ({ ...v, slug: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label>Açıklama</label>
              <textarea value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} rows={3} />
            </div>
            <div className={styles.field}>
              <label>Kampanya türü</label>
              <select value={form.type} onChange={(e) => updateType(e.target.value as CampaignType)}>
                <option value="BUY_2_GET_2">2 Al 2 Bedava</option>
                <option value="PERCENT_DISCOUNT">Yüzde İndirim</option>
                <option value="BUY_X_PAY_Y">X Al Y Öde</option>
              </select>
            </div>
            {form.type === "PERCENT_DISCOUNT" && (
              <div className={styles.field}>
                <label>İndirim yüzdesi</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.discountPercent ?? ""}
                  onChange={(e) => setForm((v) => ({ ...v, discountPercent: Number(e.target.value) }))}
                  required
                />
              </div>
            )}
            {form.type === "BUY_X_PAY_Y" && (
              <div className={styles.inlineFields}>
                <div className={styles.field}>
                  <label>Toplam ürün</label>
                  <input
                    type="number"
                    min="2"
                    max="99"
                    value={form.buyQuantity ?? ""}
                    onChange={(e) => setForm((v) => ({ ...v, buyQuantity: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label>Ödenecek ürün</label>
                  <input
                    type="number"
                    min="1"
                    max="98"
                    value={form.payQuantity ?? ""}
                    onChange={(e) => setForm((v) => ({ ...v, payQuantity: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>
            )}
            {form.type === "BUY_2_GET_2" && (
              <p className={styles.rulePreview}>Sepette her 4 ürün için en pahalı 2 ürün ücretli, en ucuz 2 ürün hediye olur.</p>
            )}
            <div className={styles.checkGrid}>
              <label className={styles.check}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((v) => ({ ...v, isActive: e.target.checked }))} />
                Aktif
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={form.showOnHomepage} onChange={(e) => setForm((v) => ({ ...v, showOnHomepage: e.target.checked }))} />
                Ana sayfada göster
              </label>
            </div>
            <div className={styles.field}>
              <label>Banner başlığı</label>
              <input value={form.bannerTitle} onChange={(e) => setForm((v) => ({ ...v, bannerTitle: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Banner metni</label>
              <textarea value={form.bannerText} onChange={(e) => setForm((v) => ({ ...v, bannerText: e.target.value }))} rows={3} />
            </div>
            <div className={styles.inlineFields}>
              <div className={styles.field}>
                <label>Buton metni</label>
                <input value={form.bannerButtonText} onChange={(e) => setForm((v) => ({ ...v, bannerButtonText: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>Buton linki</label>
                <input value={form.bannerButtonHref} onChange={(e) => setForm((v) => ({ ...v, bannerButtonHref: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kampanya Oluştur"}
            </button>
          </form>
        </section>

        <section className={styles.card}>
          <h2>Mevcut Kampanyalar</h2>
          {loading ? (
            <p className={styles.hint}>Yükleniyor...</p>
          ) : campaigns.length === 0 ? (
            <p className={styles.hint}>Henüz kampanya yok.</p>
          ) : (
            <div className={styles.list}>
              {campaigns.map((campaign) => (
                <div key={campaign.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemTitle}>{campaign.title}</div>
                    <div className={styles.itemMeta}>
                      {campaignTypeLabel(campaign)} · {campaign.isActive ? "Aktif" : "Pasif"} · {campaign.showOnHomepage ? "Banner açık" : "Banner kapalı"}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <button type="button" onClick={() => editCampaign(campaign)}>Düzenle</button>
                    <button type="button" onClick={() => toggleCampaign(campaign)}>
                      {campaign.isActive ? "Pasif Yap" : "Aktif Yap"}
                    </button>
                    <button type="button" className={styles.dangerBtn} onClick={() => deleteCampaign(campaign)}>
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function campaignTypeLabel(campaign: Campaign) {
  if (campaign.type === "PERCENT_DISCOUNT") {
    return `%${Number(campaign.discountPercent ?? 0)} indirim`;
  }

  if (campaign.type === "BUY_X_PAY_Y") {
    return `${campaign.buyQuantity ?? 0} al ${campaign.payQuantity ?? 0} öde`;
  }

  return "2 al 2 bedava";
}
