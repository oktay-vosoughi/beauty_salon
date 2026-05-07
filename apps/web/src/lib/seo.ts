import type { Metadata } from "next";
import { getSiteUrl, site } from "./site";

interface SeoImage {
  url: string;
  alt: string;
}

interface SeoInput {
  title: string;
  description: string;
  path?: string;
  images?: SeoImage[];
  type?: "website" | "article";
}

export function buildMetadata({
  title,
  description,
  path = "/",
  images = [],
  type = "website",
}: SeoInput): Metadata {
  const base = getSiteUrl();
  const url = path === "/" ? base : `${base}${path}`;

  return {
    title,
    description,
    keywords: site.keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type,
      locale: site.locale,
      siteName: site.name,
      images,
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}
