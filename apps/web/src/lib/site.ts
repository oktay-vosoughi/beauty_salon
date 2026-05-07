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
  {
    href: "/yasal/gizlilik-ve-guvenlik-politikasi",
    label: "Gizlilik ve Güvenlik Politikası",
  },
  {
    href: "/yasal/tuketici-haklari-cayma-iptal-iade",
    label: "Tüketici Hakları / Cayma / İptal / İade",
  },
];

export const categoryLinks = [
  { href: "/kategori/cilt-bakim", slug: "cilt-bakim", label: "Cilt Bakım" },
  { href: "/kategori/serum", slug: "serum", label: "Serum" },
  {
    href: "/kategori/gunes-urunleri",
    slug: "gunes-urunleri",
    label: "Güneş Ürünleri",
  },
  { href: "/kategori/lip-cheek", slug: "lip-cheek", label: "Lip & Cheek" },
  { href: "/kategori/goz-makyaji", slug: "goz-makyaji", label: "Göz Makyajı" },
  {
    href: "/kategori/kas-ve-kirpik",
    slug: "kas-ve-kirpik",
    label: "Kaş ve Kirpik",
  },
  { href: "/kategori/vucut-bakimi", slug: "vucut-bakimi", label: "Vücut Bakımı" },
  { href: "/kategori/makyaj", slug: "makyaj", label: "Makyaj" },
];

export function getSiteUrl() {
  return process.env.WEB_BASE_URL ?? "http://localhost:3000";
}
