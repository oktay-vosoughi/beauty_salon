import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Güzellik Merkezi — Doğal Güzellik Ürünleri",
    template: "%s | Güzellik Merkezi",
  },
  description:
    "Profesyonel güzellik ve cilt bakım ürünleri. Türkiye'nin güvenilen online güzellik mağazası.",
  keywords: ["güzellik", "cilt bakımı", "kozmetik", "doğal ürünler", "spa"],
  authors: [{ name: "Güzellik Merkezi" }],
  creator: "Güzellik Merkezi",
  metadataBase: new URL(
    process.env.WEB_BASE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Güzellik Merkezi",
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
