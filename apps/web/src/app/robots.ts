import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.WEB_BASE_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/urunler", "/kategori", "/iletisim", "/yasal"],
        disallow: ["/admin", "/hesabim", "/odeme", "/sepet"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
