import type { Metadata } from "next";
import { Open_Sans, Prata } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import { AppStateProvider } from "@/components/state/AppStateProvider";
import { getSiteUrl, site } from "@/lib/site";
import "@/styles/globals.css";

const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const prata = Prata({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Niltellioglu | Cilt Bakım ve Kozmetik",
    template: "%s | Niltellioglu",
  },
  description:
    "Niltellioglu cilt bakım, kozmetik ve güzellik ürünleri. Nil Tellioğlu Beauty seçkisini İstanbul Çekmeköy merkezli güvenilir alışveriş deneyimiyle keşfedin.",
  keywords: site.keywords,
  authors: [{ name: site.legalName }],
  creator: site.name,
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.name,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${openSans.variable} ${prata.variable}`}>
      <body suppressHydrationWarning style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <AppStateProvider>
          <AppShell>{children}</AppShell>
        </AppStateProvider>
      </body>
    </html>
  );
}
