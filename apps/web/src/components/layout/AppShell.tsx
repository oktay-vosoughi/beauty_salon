"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Admin pages render their own chrome (sidebar in app/admin/layout.tsx).
  // Skip the public Navbar/Footer and the navbar offset so the dashboard
  // fills the viewport cleanly.
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main style={{ flex: 1, paddingTop: "68px" }}>{children}</main>
      <Footer />
    </>
  );
}
