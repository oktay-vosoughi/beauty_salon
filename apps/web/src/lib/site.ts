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

export function getSiteUrl() {
  return process.env.WEB_BASE_URL ?? "http://localhost:3000";
}
