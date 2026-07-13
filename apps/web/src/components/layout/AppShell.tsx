"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import FixedCampaignBanner from "./FixedCampaignBanner";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [campaignBannerVisible, setCampaignBannerVisible] = useState(false);
  const handleBannerVisibility = useCallback((visible: boolean) => {
    setCampaignBannerVisible(visible);
  }, []);

  // Admin pages render their own chrome (sidebar in app/admin/layout.tsx).
  // Skip the public Navbar/Footer and the navbar offset so the dashboard
  // fills the viewport cleanly.
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <FixedCampaignBanner onVisibilityChange={handleBannerVisibility} />
      <main style={{ flex: 1, paddingTop: campaignBannerVisible ? "116px" : "68px" }}>{children}</main>
      <Footer />
    </>
  );
}
