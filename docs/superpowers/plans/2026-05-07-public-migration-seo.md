# Public Migration SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the publicly visible Ntbeauty.shop catalog, legal/contact content, and Turkish SEO metadata into the current Niltellioglu Next.js storefront without recreating the WordPress design or adding blog pages.

**Architecture:** Keep the current monorepo structure. Centralize migrated catalog/legal/SEO constants in focused files, feed the API seed from those constants, and update existing Next.js pages/components to consume consistent brand/contact/metadata values. Add only static legal routes and SEO helpers; no schema migration is needed.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, CSS Modules, Express, Prisma, MySQL, Vitest/Supertest, Playwright.

---

## File Structure

- Create `apps/api/prisma/catalog.ts`: migrated categories/products and a shared slug helper for seed-time data.
- Modify `apps/api/prisma/seed.ts`: seed migrated catalog, remove stale demo products by slug, keep admin user.
- Modify `apps/api/src/tests/api.test.ts`: assert migrated catalog count and representative product/category fields.
- Create `apps/web/src/lib/site.ts`: brand, contact, legal links, site URL helper, SEO keyword constants.
- Create `apps/web/src/lib/seo.ts`: reusable metadata builders and product JSON-LD helper.
- Modify `apps/web/src/app/layout.tsx`: Niltellioglu default metadata, canonical metadata base, brand naming.
- Modify `apps/web/src/app/page.tsx`: brand-specific home copy and migrated category/service summaries.
- Modify `apps/web/src/app/urunler/page.tsx`: stronger product listing metadata, canonical, OG/Twitter.
- Modify `apps/web/src/app/urunler/[slug]/page.tsx`: product metadata and JSON-LD using Niltellioglu brand; remove aggregate rating until real reviews exist.
- Create `apps/web/src/app/yasal/[slug]/page.tsx`: static legal page renderer.
- Create `apps/web/src/app/yasal/[slug]/page.module.css`: readable legal text layout.
- Create `apps/web/src/app/yasal/legal-content.ts`: migrated legal page titles and content.
- Modify `apps/web/src/components/layout/Footer.tsx`: contact details and legal links.
- Modify `apps/web/src/components/layout/Footer.module.css`: support two footer link columns on desktop/mobile.
- Modify `apps/web/src/app/iletisim/page.tsx`: migrated company contact details and metadata.
- Modify `apps/web/src/app/sitemap.ts`: include legal pages and product detail pages.
- Modify `apps/web/src/app/robots.ts`: allow public/legal pages; keep protected routes disallowed.

---

### Task 1: Catalog Data Migration

**Files:**
- Create: `apps/api/prisma/catalog.ts`
- Modify: `apps/api/prisma/seed.ts`
- Test: `apps/api/src/tests/api.test.ts`

- [ ] **Step 1: Add a failing catalog API test**

Add this test block to `apps/api/src/tests/api.test.ts` inside `describe("Products API", ...)`:

```ts
  it("GET /api/products — exposes migrated Ntbeauty public catalog", async () => {
    const res = await request(app).get("/api/products?limit=50");
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(27);
    const titles = res.body.items.map((item: { title: string }) => item.title);
    expect(titles).toContain("S.O.S KREM");
    expect(titles).toContain("SOMON DNA SERUM");
    expect(titles).toContain("GÜNEŞ KREMİ 50SPF");
    expect(titles).toContain("BODY GLOW OIL");
  });
```

- [ ] **Step 2: Run test to verify current catalog fails**

Run:

```bash
pnpm --filter @niltellioglu/api run test -- src/tests/api.test.ts
```

Expected: the new catalog test fails because the current seed/demo catalog does not contain the migrated product names.

- [ ] **Step 3: Create migrated catalog constants**

Create `apps/api/prisma/catalog.ts` with:

```ts
export interface CatalogCategory {
  name: string;
  slug: string;
}

export interface CatalogProduct {
  title: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  categorySlug: string;
  imageUrl: string;
}

export const migratedCategories: CatalogCategory[] = [
  { name: "Cilt Bakım", slug: "cilt-bakim" },
  { name: "Serum", slug: "serum" },
  { name: "Güneş Ürünleri", slug: "gunes-urunleri" },
  { name: "Lip & Cheek", slug: "lip-cheek" },
  { name: "Göz Makyajı", slug: "goz-makyaji" },
  { name: "Kaş ve Kirpik", slug: "kas-ve-kirpik" },
  { name: "Vücut Bakımı", slug: "vucut-bakimi" },
  { name: "Makyaj", slug: "makyaj" },
];

export const migratedProducts: CatalogProduct[] = [
  {
    title: "S.O.S KREM",
    slug: "sos-krem",
    description: "Hassasiyete eğilimli, yorgun ve kurumuş ciltler için yoğun nemlendirici bakım kremi.",
    price: 650,
    stock: 25,
    categorySlug: "cilt-bakim",
    imageUrl: "/image_1.jpg",
  },
  {
    title: "SOMON DNA SERUM",
    slug: "somon-dna-serum",
    description: "Somon DNA, hyaluronik asit, niacinamide ve E vitamini içeren nemlendirici cilt bakım serumu.",
    price: 850,
    stock: 25,
    categorySlug: "serum",
    imageUrl: "/image_2.jpg",
  },
  {
    title: "GÜNEŞ KREMİ 50SPF",
    slug: "gunes-kremi-50spf",
    description: "SPF 50+ güneş koruyucu; hafif dokulu, makyaj altına uygulanabilen yüz bakım ürünü.",
    price: 650,
    stock: 15,
    categorySlug: "gunes-urunleri",
    imageUrl: "/image_3.jpg",
  },
  {
    title: "NT BEAUTY C VİTAMİNİ SERUM",
    slug: "nt-beauty-c-vitamini-serum",
    description: "Cilt bakım rutini için C vitamini içeren serum.",
    price: 850,
    stock: 25,
    categorySlug: "serum",
    imageUrl: "/bg_1.jpg",
  },
  {
    title: "WHITENING PEELING",
    slug: "whitening-peeling",
    description: "Salatalık özü, aloe vera ve E vitamini ile cilt bakım rutinine uygun aydınlatıcı peeling.",
    price: 750,
    stock: 25,
    categorySlug: "cilt-bakim",
    imageUrl: "/bg_2.jpg",
  },
  {
    title: "NEW MEDİUM DD CONCEALER",
    slug: "new-medium-dd-concealer",
    description: "Medium ton DD concealer; yenilenmiş formülüyle makyaj rutinine uygun kapatıcı.",
    price: 550,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/intro.jpg",
  },
  {
    title: "NEW LIP&CHEEK PEACH NO.1",
    slug: "new-lip-cheek-peach-no-1",
    description: "Şeftali tonlu, dudak ve yanak için çok amaçlı satin bitişli renk ürünü.",
    price: 555,
    stock: 25,
    categorySlug: "lip-cheek",
    imageUrl: "/image_1.jpg",
  },
  {
    title: "KAŞ KİRPİK SERUMU",
    slug: "kas-kirpik-serumu",
    description: "Kaş ve kirpik bakım rutini için serum.",
    price: 450,
    stock: 25,
    categorySlug: "kas-ve-kirpik",
    imageUrl: "/image_2.jpg",
  },
  {
    title: "NOURISHING LIP OIL",
    slug: "nourishing-lip-oil",
    description: "E vitamini içeren, yapışkan his bırakmadan parlak görünüm veren dudak bakım yağı.",
    price: 350,
    stock: 25,
    categorySlug: "lip-cheek",
    imageUrl: "/image_3.jpg",
  },
  {
    title: "BODY SCRUB VANILLA",
    slug: "body-scrub-vanilla",
    description: "Vanilya aromalı, doğal yağlar içeren vücut peelingi.",
    price: 580,
    stock: 15,
    categorySlug: "vucut-bakimi",
    imageUrl: "/bg_1.jpg",
  },
  {
    title: "NEW LİGHT DD CONCEALER",
    slug: "new-light-dd-concealer",
    description: "Light ton DD concealer; yenilenmiş formülüyle makyaj rutinine uygun kapatıcı.",
    price: 550,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/bg_2.jpg",
  },
  {
    title: "RADIANCE MULTI-PEN M1",
    slug: "radiance-multi-pen-m1",
    description: "Tarçın-karamel tonlu, dudak ve göz makyajında kullanılabilen çok amaçlı kalem.",
    price: 420,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/intro.jpg",
  },
  {
    title: "NEW LIP&CHEEK CANDY NO.2",
    slug: "new-lip-cheek-candy-no-2",
    description: "Candy pembe tonlu, dudak ve yanak için çok amaçlı satin bitişli ürün.",
    price: 555,
    stock: 25,
    categorySlug: "lip-cheek",
    imageUrl: "/image_1.jpg",
  },
  {
    title: "RADIANCE MULTI-PEN M2",
    slug: "radiance-multi-pen-m2",
    description: "Şeftali-nude tonlu, dudak ve göz makyajına uygun çok amaçlı kalem.",
    price: 420,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/image_2.jpg",
  },
  {
    title: "MOCHA NUDE",
    slug: "mocha-nude",
    description: "Likit far, likit allık ve ruj olarak kullanılabilen çok amaçlı renk ürünü.",
    price: 350,
    stock: 25,
    categorySlug: "lip-cheek",
    imageUrl: "/image_3.jpg",
  },
  {
    title: "NT BEAUTY ANTİ SEBUM",
    slug: "nt-beauty-anti-sebum",
    description: "Cilt bakım rutininde sebum görünümünü dengelemeye yönelik bakım ürünü.",
    price: 750,
    stock: 25,
    categorySlug: "cilt-bakim",
    imageUrl: "/bg_1.jpg",
  },
  {
    title: "DD KREM DARK",
    slug: "dd-krem-dark",
    description: "Dark ton DD krem; niacinamide ve E vitamini içeren renkli bakım ürünü.",
    price: 620,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/bg_2.jpg",
  },
  {
    title: "BROWNIE",
    slug: "brownie",
    description: "Likit far, likit allık ve ruj olarak kullanılabilen çok amaçlı renk ürünü.",
    price: 350,
    stock: 25,
    categorySlug: "lip-cheek",
    imageUrl: "/intro.jpg",
  },
  {
    title: "BRONZING OIL",
    slug: "bronzing-oil",
    description: "Havuç yağı, kakao yağı, ayçiçeği yağı ve E vitamini içeren bronzlaştırıcı güneş yağı.",
    price: 650,
    stock: 15,
    categorySlug: "gunes-urunleri",
    imageUrl: "/image_1.jpg",
  },
  {
    title: "NT KAŞ WAX",
    slug: "nt-kas-wax",
    description: "Kaş şekillendirme rutini için wax.",
    price: 500,
    stock: 25,
    categorySlug: "kas-ve-kirpik",
    imageUrl: "/image_2.jpg",
  },
  {
    title: "NEW DARK DD CONCEALER",
    slug: "new-dark-dd-concealer",
    description: "Dark ton DD concealer; yenilenmiş formülüyle makyaj rutinine uygun kapatıcı.",
    price: 550,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/image_3.jpg",
  },
  {
    title: "RADIANCE MULTI-PEN M3",
    slug: "radiance-multi-pen-m3",
    description: "Bordo-kiraz tonlu, dudak ve göz makyajında kullanılabilen çok amaçlı kalem.",
    price: 350,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/bg_1.jpg",
  },
  {
    title: "ALL FIRED",
    slug: "all-fired",
    description: "Likit far, likit allık ve ruj olarak kullanılabilen çok amaçlı renk ürünü.",
    price: 350,
    stock: 25,
    categorySlug: "lip-cheek",
    imageUrl: "/bg_2.jpg",
  },
  {
    title: "GÖZ FARI SUNSET",
    slug: "goz-fari-sunset",
    description: "Sunset tonlu, yüksek pigmentasyonlu ve kolay dağılan göz farı paleti.",
    price: 550,
    stock: 25,
    categorySlug: "goz-makyaji",
    imageUrl: "/intro.jpg",
  },
  {
    title: "GOLDEN HOUR",
    slug: "golden-hour",
    description: "Likit far, highlighter ve ruj olarak kullanılabilen metalik yansımalı çok amaçlı ürün.",
    price: 350,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/image_1.jpg",
  },
  {
    title: "BODY GLOW OIL",
    slug: "body-glow-oil",
    description: "Altın ışıltılı, hafif dokulu vücut bakım yağı.",
    price: 1150,
    stock: 15,
    categorySlug: "vucut-bakimi",
    imageUrl: "/image_2.jpg",
  },
  {
    title: "GÖZ FARI MOONLIGHT",
    slug: "goz-fari-moonlight",
    description: "Moonlight tonlu, yüksek pigmentasyonlu ve kolay dağılan göz farı paleti.",
    price: 550,
    stock: 25,
    categorySlug: "goz-makyaji",
    imageUrl: "/image_3.jpg",
  },
];
```

- [ ] **Step 4: Seed migrated categories/products**

Update `apps/api/prisma/seed.ts` to import the catalog constants:

```ts
import { migratedCategories, migratedProducts } from "./catalog";
```

Replace the existing hard-coded categories/products section with a loop:

```ts
const categoryBySlug = new Map<string, { id: number; slug: string }>();

for (const category of migratedCategories) {
  const saved = await prisma.category.upsert({
    where: { slug: category.slug },
    update: { name: category.name },
    create: category,
  });
  categoryBySlug.set(category.slug, saved);
}

const migratedSlugs = migratedProducts.map((product) => product.slug);
await prisma.product.updateMany({
  where: { slug: { notIn: migratedSlugs } },
  data: { isActive: false },
});

for (const product of migratedProducts) {
  const category = categoryBySlug.get(product.categorySlug);
  if (!category) throw new Error(`Missing category for ${product.title}`);

  await prisma.product.upsert({
    where: { slug: product.slug },
    update: {
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock,
      isActive: true,
      categoryId: category.id,
      images: {
        deleteMany: {},
        create: [{ url: product.imageUrl, alt: product.title, sortOrder: 0 }],
      },
    },
    create: {
      slug: product.slug,
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock,
      isActive: true,
      categoryId: category.id,
      images: {
        create: [{ url: product.imageUrl, alt: product.title, sortOrder: 0 }],
      },
    },
  });
}
```

- [ ] **Step 5: Run seed and test**

Run:

```bash
pnpm --filter @niltellioglu/api run db:seed
pnpm --filter @niltellioglu/api run test -- src/tests/api.test.ts
```

Expected: seed completes and the catalog API test passes.

---

### Task 2: Brand, Contact, and SEO Helpers

**Files:**
- Create: `apps/web/src/lib/site.ts`
- Create: `apps/web/src/lib/seo.ts`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Create site constants**

Create `apps/web/src/lib/site.ts`:

```ts
export const site = {
  name: "Niltellioglu",
  legalName: "NİLS GÜZELLİK MERK. SAN. VE TİC. LTD. ŞTİ.",
  alternateName: "Nil Tellioğlu Beauty",
  email: "info@niltellioglu.com",
  address: "Merkez Mahallesi Aşuroğlu Sokak No 5 Çekmeköy İstanbul",
  locale: "tr_TR",
  keywords: [
    "cilt bakım",
    "kozmetik",
    "Niltellioglu",
    "Nil Tellioğlu Beauty",
    "güzellik ürünleri",
    "Çekmeköy kozmetik",
    "İstanbul kozmetik",
  ],
};

export const legalLinks = [
  { href: "/yasal/kvkk", label: "KVKK" },
  { href: "/yasal/cerez-politikasi", label: "Çerez Politikası" },
  { href: "/yasal/uyelik-sozlesmesi", label: "Üyelik Sözleşmesi" },
  { href: "/yasal/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/yasal/gizlilik-ve-guvenlik-politikasi", label: "Gizlilik ve Güvenlik Politikası" },
  { href: "/yasal/tuketici-haklari-cayma-iptal-iade", label: "Tüketici Hakları / Cayma / İptal / İade" },
];

export function getSiteUrl() {
  return process.env.WEB_BASE_URL ?? "http://localhost:3000";
}
```

- [ ] **Step 2: Create metadata helpers**

Create `apps/web/src/lib/seo.ts`:

```ts
import type { Metadata } from "next";
import { getSiteUrl, site } from "./site";

interface SeoInput {
  title: string;
  description: string;
  path?: string;
  images?: { url: string; alt: string }[];
  type?: "website" | "article";
}

export function buildMetadata({ title, description, path = "/", images = [], type = "website" }: SeoInput): Metadata {
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
```

- [ ] **Step 3: Update root metadata**

Modify `apps/web/src/app/layout.tsx` to import `getSiteUrl` and `site`, set default title to `Niltellioglu | Cilt Bakım ve Kozmetik`, set `metadataBase: new URL(getSiteUrl())`, and use `site.keywords`, `site.name`, and `site.legalName`.

- [ ] **Step 4: Typecheck web app**

Run:

```bash
pnpm --filter @niltellioglu/web run typecheck
```

Expected: 0 TypeScript errors.

---

### Task 3: Footer, Contact, and Legal Pages

**Files:**
- Create: `apps/web/src/app/yasal/legal-content.ts`
- Create: `apps/web/src/app/yasal/[slug]/page.tsx`
- Create: `apps/web/src/app/yasal/[slug]/page.module.css`
- Modify: `apps/web/src/components/layout/Footer.tsx`
- Modify: `apps/web/src/components/layout/Footer.module.css`
- Modify: `apps/web/src/app/iletisim/page.tsx`
- Modify: `apps/web/src/app/sitemap.ts`
- Modify: `apps/web/src/app/robots.ts`

- [ ] **Step 1: Create legal content module**

Create `apps/web/src/app/yasal/legal-content.ts` with a `legalPages` array containing exactly six objects with `slug`, `title`, `description`, and `sections`. Each section must have a `heading` and `paragraphs`. Use public source company values from `site`, standardize email to `info@niltellioglu.com`, and include these slugs:

```ts
export const legalPageSlugs = [
  "kvkk",
  "cerez-politikasi",
  "uyelik-sozlesmesi",
  "mesafeli-satis-sozlesmesi",
  "gizlilik-ve-guvenlik-politikasi",
  "tuketici-haklari-cayma-iptal-iade",
] as const;
```

- [ ] **Step 2: Render static legal routes**

Create `apps/web/src/app/yasal/[slug]/page.tsx` with:

```tsx
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { legalPages } from "../legal-content";
import styles from "./page.module.css";

export function generateStaticParams() {
  return legalPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = legalPages.find((item) => item.slug === slug);
  if (!page) return { title: "Sayfa Bulunamadı" };
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: `/yasal/${page.slug}`,
  });
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = legalPages.find((item) => item.slug === slug);
  if (!page) notFound();

  return (
    <article className="section">
      <div className={`container ${styles.wrap}`}>
        <p className={styles.eyebrow}>Yasal Bilgilendirme</p>
        <h1>{page.title}</h1>
        <p className={styles.lead}>{page.description}</p>
        {page.sections.map((section) => (
          <section key={section.heading} className={styles.section}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Style legal pages**

Create `apps/web/src/app/yasal/[slug]/page.module.css` with readable constrained text, `max-width: 860px`, 8px card radius only for the content frame if needed, and mobile-safe headings.

- [ ] **Step 4: Update footer**

Modify `Footer.tsx` to use `site` and `legalLinks`. Remove the current generic Bağcılar, fake phone, and old email values. Add footer links for legal pages and keep main links: Ana Sayfa, Ürünler, İletişim, Giriş Yap, Kayıt Ol.

- [ ] **Step 5: Update contact page**

Modify `apps/web/src/app/iletisim/page.tsx` metadata via `buildMetadata`, address via `site.address`, email via `site.email`, company via `site.legalName`, and remove fake phone if no public phone exists.

- [ ] **Step 6: Update sitemap and robots**

Modify `sitemap.ts` to include `legalLinks.map((link) => ({ url: base + link.href }))`. Modify `robots.ts` so legal pages are allowed by default while `/admin`, `/hesabim`, `/odeme`, and `/sepet` remain disallowed.

- [ ] **Step 7: Typecheck web app**

Run:

```bash
pnpm --filter @niltellioglu/web run typecheck
```

Expected: 0 TypeScript errors.

---

### Task 4: Page-Level SEO and Product JSON-LD

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/urunler/page.tsx`
- Modify: `apps/web/src/app/urunler/[slug]/page.tsx`

- [ ] **Step 1: Update home metadata and copy**

Use `buildMetadata` in `apps/web/src/app/page.tsx` with title `Niltellioglu Cilt Bakım ve Kozmetik Ürünleri` and a description targeting `cilt bakım`, `kozmetik`, `Çekmeköy`, and `İstanbul`. Replace generic `Güzellik Merkezi` copy with Niltellioglu/Nil Tellioğlu Beauty copy.

- [ ] **Step 2: Update product listing metadata**

Use `buildMetadata` in `apps/web/src/app/urunler/page.tsx` with title `Cilt Bakım ve Kozmetik Ürünleri` and canonical `/urunler`. Keep existing list UI.

- [ ] **Step 3: Update product detail metadata**

Modify `generateMetadata` in `apps/web/src/app/urunler/[slug]/page.tsx` to call `buildMetadata` with:

```ts
return buildMetadata({
  title: `${p.title} | Niltellioglu`,
  description: `${p.title} ürününü Niltellioglu cilt bakım ve kozmetik mağazasında keşfedin. ${p.description.slice(0, 110)}`,
  path: `/urunler/${p.slug}`,
  images: p.images[0] ? [{ url: p.images[0].url, alt: p.images[0].alt ?? p.title }] : [],
});
```

- [ ] **Step 4: Update Product JSON-LD**

In `apps/web/src/app/urunler/[slug]/page.tsx`, set JSON-LD brand and seller to Niltellioglu/NİLS. Remove `aggregateRating` until real approved review data exists; this avoids adding unverifiable review SEO.

- [ ] **Step 5: Typecheck web app**

Run:

```bash
pnpm --filter @niltellioglu/web run typecheck
```

Expected: 0 TypeScript errors.

---

### Task 5: Verification and Browser QA

**Files:**
- Test only; no planned source edits unless verification finds defects.

- [ ] **Step 1: Run backend tests**

Run:

```bash
pnpm --filter @niltellioglu/api run test
```

Expected: all API tests pass.

- [ ] **Step 2: Run frontend typecheck/build**

Run:

```bash
pnpm --filter @niltellioglu/web run typecheck
pnpm --filter @niltellioglu/web run build
```

Expected: typecheck passes and Next build completes.

- [ ] **Step 3: Start dev server**

Run:

```bash
pnpm dev
```

Expected: web is available at `http://localhost:3000` and API at `http://localhost:4000`.

- [ ] **Step 4: Browser-check key routes**

Check desktop and mobile for:

```text
/
/urunler
/urunler/sos-krem
/iletisim
/yasal/kvkk
/robots.txt
/sitemap.xml
```

Expected: pages render without overlap, footer legal links work, product details show migrated product copy, metadata exists in page head, and sitemap includes products/legal pages.

- [ ] **Step 5: Commit implementation**

After tests pass, stage only files changed for this migration and commit:

```bash
git add apps/api/prisma/catalog.ts apps/api/prisma/seed.ts apps/api/src/tests/api.test.ts apps/web/src/lib/site.ts apps/web/src/lib/seo.ts apps/web/src/app apps/web/src/components/layout/Footer.tsx apps/web/src/components/layout/Footer.module.css
git commit -m "Migrate public catalog and SEO content"
```
