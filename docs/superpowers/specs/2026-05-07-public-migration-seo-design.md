# Public Content Migration and SEO Design

Date: 2026-05-07

## Objective

Migrate the publicly visible content from `Ntbeauty.shop` into the existing Niltellioglu Next.js e-commerce website while preserving the current modern design system. The migration must not recreate the WordPress visual style and must not implement blog pages yet.

The implementation should make the site feel like a native Niltellioglu storefront for Turkish skincare and cosmetics, using the old site only as a public content source.

## Source and Constraints

- Source access is public website access only. There is no WordPress admin, export, database dump, or asset library.
- Publicly visible product, footer, contact, and legal/static content may be migrated.
- Blog content and blog functionality are out of scope.
- If source product images cannot be reliably retrieved, use existing local product or placeholder images.
- Product and category copy may be lightly improved for clarity and Turkish search intent, but should remain grounded in public source content.
- Do not fabricate medical, cosmetic, clinical, or performance claims.
- Standard public contact email: `info@niltellioglu.com`.

## Product Catalog

Replace or extend the current seed/demo product catalog with the visible public `Ntbeauty.shop` product catalog. The visible catalog contains 27 products.

Each migrated product must include:

- Product name
- Price in TRY
- Public description
- Category assignment
- SEO-friendly slug
- Stock default
- Active status
- Product image, falling back to existing local images when needed

Stock should use conservative defaults because the source site does not expose inventory. Products should be active by default unless there is a clear public signal that they should not be sold.

Product descriptions should preserve available public details. Products with missing or short descriptions should receive concise, factual descriptions based on the product name/category only.

## Navigation and Page Structure

The old public structure should be mapped into the current Next.js UX rather than copied directly.

Planned public navigation:

- Ana Sayfa
- Ürünler
- İletişim
- Hesabım
- Sepet

Blog links should not appear in the new navigation. Legacy legal and policy pages should be linked from the footer, not treated as primary navigation.

## Static and Legal Pages

Add the following public static/legal pages in the current site design:

- KVKK
- Çerez Politikası
- Üyelik Sözleşmesi
- Mesafeli Satış Sözleşmesi
- Gizlilik ve Güvenlik Politikası
- Tüketici Hakları / Cayma / İptal / İade

Use public company details from the source:

- Company: `NİLS GÜZELLİK MERK. SAN. VE TİC. LTD. ŞTİ.`
- Address: `Merkez Mahallesi Aşuroğlu Sokak No 5 Çekmeköy İstanbul`
- Email: `info@niltellioglu.com`

Any source references to `info@ntbeauty.shop` should be standardized to `info@niltellioglu.com`.

Legal copy should be migrated and formatted for readability in the existing design. Placeholder legal tokens from the source should be replaced only when the public source provides the replacement value above; otherwise wording should stay general and not invent missing legal details.

## Footer and Contact Content

Update footer and contact content using the public source where relevant:

- Company name
- Address
- Email
- Legal/static page links
- Public support/value messages such as fast shipping, secure shopping, easy return, and support

The tone should be professional, clean, Turkish, and suitable for a cosmetics and skincare brand.

## SEO Design

Add Turkish SEO metadata for:

- Home page
- Product listing page
- Product detail pages
- Category pages if category routes exist or are added
- Contact page
- Legal/static pages

Primary keyword cluster:

- `cilt bakım`
- `kozmetik`
- `Niltellioglu`
- `Nil Tellioğlu Beauty`
- `güzellik ürünleri`
- `Çekmeköy kozmetik`
- `İstanbul kozmetik`

SEO requirements:

- Unique title tags
- Unique meta descriptions
- Canonical URLs
- Open Graph metadata
- Twitter metadata
- Product structured data on product detail pages
- Updated sitemap
- Updated robots.txt

Canonical URLs should align with the production domain configuration already used by the app. If the production domain is not configured, use a central site URL helper or environment-backed default so it can be changed in one place.

Product structured data should include only reliable data: product name, description, image URL, price, currency, availability derived from stock/active state, and brand/name. Reviews or aggregate ratings should not be added unless review data exists.

## Implementation Boundaries

Do not implement:

- Blog pages
- Blog migration
- WordPress theme recreation
- Unverified medical/cosmetic claims
- External image scraping that creates brittle runtime dependencies
- Legal details not present in the public source

Do implement:

- Catalog seed/data migration
- Footer/contact/legal content migration
- Static/legal pages
- SEO metadata and structured data
- Sitemap and robots updates
- Existing design integration

## Testing and Verification

Verification should include:

- TypeScript/build checks for affected apps
- API or seed validation if product seed data changes
- Product list and product detail rendering checks
- Footer legal link checks
- Metadata inspection for representative pages
- Sitemap and robots route checks

Browser verification should cover at least desktop and mobile layouts for:

- Home page
- Product listing page
- Product detail page
- Contact page
- One legal page

