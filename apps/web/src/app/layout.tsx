import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSiteUrl, site } from "@/lib/site";
import "@/styles/globals.css";

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
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&family=Prata&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar />
        <main style={{ flex: 1, paddingTop: "68px" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
