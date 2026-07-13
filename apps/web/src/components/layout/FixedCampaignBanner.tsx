"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./FixedCampaignBanner.module.css";

interface CampaignBanner {
  id: number;
  title: string;
  description: string | null;
  bannerTitle: string | null;
  bannerText: string | null;
  bannerButtonText: string | null;
  bannerButtonHref: string | null;
}

interface FixedCampaignBannerProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export default function FixedCampaignBanner({ onVisibilityChange }: FixedCampaignBannerProps) {
  const [campaign, setCampaign] = useState<CampaignBanner | null>(null);

  useEffect(() => {
    let alive = true;

    async function fetchCampaign() {
      try {
        const res = await fetch("/api/campaigns/active-banner", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          if (alive) onVisibilityChange?.(false);
          return;
        }
        const data = await res.json();
        const nextCampaign = data.campaign ?? null;
        if (alive) {
          setCampaign(nextCampaign);
          onVisibilityChange?.(Boolean(nextCampaign));
        }
      } catch {
        if (alive) onVisibilityChange?.(false);
      }
    }

    fetchCampaign();

    return () => {
      alive = false;
    };
  }, [onVisibilityChange]);

  if (!campaign) return null;

  return (
    <div className={styles.banner} role="region" aria-label="Aktif kampanya">
      <div className={styles.track}>
        <div className={styles.content}>
          <span className={styles.badge}>Kampanya</span>
          <strong>{campaign.bannerTitle ?? campaign.title}</strong>
          <span className={styles.text}>{campaign.bannerText ?? campaign.description}</span>
        </div>
        <Link href={campaign.bannerButtonHref ?? "/urunler"} className={styles.action}>
          {campaign.bannerButtonText ?? "Ürünleri İncele"}
        </Link>
      </div>
    </div>
  );
}
