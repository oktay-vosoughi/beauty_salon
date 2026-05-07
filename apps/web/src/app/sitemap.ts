import type { MetadataRoute } from "next";
import { legalLinks } from "@/lib/site";

const API = process.env.API_BASE_URL ?? "http://localhost:4000";

async function getProductSlugs(): Promise<string[]> {
  try {
    let page = 1;
    const slugs: string[] = [];
    while (true) {
      const res = await fetch(`${API}/api/products?page=${page}&limit=50`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const data = await res.json();
      for (const p of data.items as { slug: string }[]) slugs.push(p.slug);
      if (page >= data.pages) break;
      page++;
    }
    return slugs;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.WEB_BASE_URL ?? "http://localhost:3000";
  const slugs = await getProductSlugs();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/urunler`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/iletisim`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...legalLinks.map((link) => ({
      url: `${base}${link.href}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  const productPages: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${base}/urunler/${slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
