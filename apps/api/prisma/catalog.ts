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
    description:
      "Hassasiyete eğilimli, yorgun ve kurumuş ciltler için yoğun nemlendirici bakım kremi.",
    price: 650,
    stock: 25,
    categorySlug: "cilt-bakim",
    imageUrl: "/image_1.jpg",
  },
  {
    title: "SOMON DNA SERUM",
    slug: "somon-dna-serum",
    description:
      "Somon DNA, hyaluronik asit, niacinamide ve E vitamini içeren nemlendirici cilt bakım serumu.",
    price: 850,
    stock: 25,
    categorySlug: "serum",
    imageUrl: "/image_2.jpg",
  },
  {
    title: "GÜNEŞ KREMİ 50SPF",
    slug: "gunes-kremi-50spf",
    description:
      "SPF 50+ güneş koruyucu; hafif dokulu, makyaj altına uygulanabilen yüz bakım ürünü.",
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
    imageUrl: "/image_1.jpg",
  },
  {
    title: "WHITENING PEELING",
    slug: "whitening-peeling",
    description:
      "Salatalık özü, aloe vera ve E vitamini ile cilt bakım rutinine uygun aydınlatıcı peeling.",
    price: 750,
    stock: 25,
    categorySlug: "cilt-bakim",
    imageUrl: "/image_2.jpg",
  },
  {
    title: "NEW MEDİUM DD CONCEALER",
    slug: "new-medium-dd-concealer",
    description:
      "Medium ton DD concealer; yenilenmiş formülüyle makyaj rutinine uygun kapatıcı.",
    price: 550,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/image_3.jpg",
  },
  {
    title: "NEW LIP&CHEEK PEACH NO.1",
    slug: "new-lip-cheek-peach-no-1",
    description:
      "Şeftali tonlu, dudak ve yanak için çok amaçlı satin bitişli renk ürünü.",
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
    description:
      "E vitamini içeren, yapışkan his bırakmadan parlak görünüm veren dudak bakım yağı.",
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
    imageUrl: "/image_1.jpg",
  },
  {
    title: "NEW LİGHT DD CONCEALER",
    slug: "new-light-dd-concealer",
    description:
      "Light ton DD concealer; yenilenmiş formülüyle makyaj rutinine uygun kapatıcı.",
    price: 550,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/image_2.jpg",
  },
  {
    title: "RADIANCE MULTI-PEN M1",
    slug: "radiance-multi-pen-m1",
    description:
      "Tarçın-karamel tonlu, dudak ve göz makyajında kullanılabilen çok amaçlı kalem.",
    price: 420,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/image_3.jpg",
  },
  {
    title: "NEW LIP&CHEEK CANDY NO.2",
    slug: "new-lip-cheek-candy-no-2",
    description:
      "Candy pembe tonlu, dudak ve yanak için çok amaçlı satin bitişli ürün.",
    price: 555,
    stock: 25,
    categorySlug: "lip-cheek",
    imageUrl: "/image_1.jpg",
  },
  {
    title: "RADIANCE MULTI-PEN M2",
    slug: "radiance-multi-pen-m2",
    description:
      "Şeftali-nude tonlu, dudak ve göz makyajına uygun çok amaçlı kalem.",
    price: 420,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/image_2.jpg",
  },
  {
    title: "MOCHA NUDE",
    slug: "mocha-nude",
    description:
      "Likit far, likit allık ve ruj olarak kullanılabilen çok amaçlı renk ürünü.",
    price: 350,
    stock: 25,
    categorySlug: "lip-cheek",
    imageUrl: "/image_3.jpg",
  },
  {
    title: "NT BEAUTY ANTİ SEBUM",
    slug: "nt-beauty-anti-sebum",
    description:
      "Cilt bakım rutininde sebum görünümünü dengelemeye yönelik bakım ürünü.",
    price: 750,
    stock: 25,
    categorySlug: "cilt-bakim",
    imageUrl: "/image_1.jpg",
  },
  {
    title: "DD KREM DARK",
    slug: "dd-krem-dark",
    description:
      "Dark ton DD krem; niacinamide ve E vitamini içeren renkli bakım ürünü.",
    price: 620,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/image_2.jpg",
  },
  {
    title: "BROWNIE",
    slug: "brownie",
    description:
      "Likit far, likit allık ve ruj olarak kullanılabilen çok amaçlı renk ürünü.",
    price: 350,
    stock: 25,
    categorySlug: "lip-cheek",
    imageUrl: "/image_3.jpg",
  },
  {
    title: "BRONZING OIL",
    slug: "bronzing-oil",
    description:
      "Havuç yağı, kakao yağı, ayçiçeği yağı ve E vitamini içeren bronzlaştırıcı güneş yağı.",
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
    description:
      "Dark ton DD concealer; yenilenmiş formülüyle makyaj rutinine uygun kapatıcı.",
    price: 550,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/image_3.jpg",
  },
  {
    title: "RADIANCE MULTI-PEN M3",
    slug: "radiance-multi-pen-m3",
    description:
      "Bordo-kiraz tonlu, dudak ve göz makyajında kullanılabilen çok amaçlı kalem.",
    price: 350,
    stock: 25,
    categorySlug: "makyaj",
    imageUrl: "/image_1.jpg",
  },
  {
    title: "ALL FIRED",
    slug: "all-fired",
    description:
      "Likit far, likit allık ve ruj olarak kullanılabilen çok amaçlı renk ürünü.",
    price: 350,
    stock: 25,
    categorySlug: "lip-cheek",
    imageUrl: "/image_2.jpg",
  },
  {
    title: "GÖZ FARI SUNSET",
    slug: "goz-fari-sunset",
    description:
      "Sunset tonlu, yüksek pigmentasyonlu ve kolay dağılan göz farı paleti.",
    price: 550,
    stock: 25,
    categorySlug: "goz-makyaji",
    imageUrl: "/image_3.jpg",
  },
  {
    title: "GOLDEN HOUR",
    slug: "golden-hour",
    description:
      "Likit far, highlighter ve ruj olarak kullanılabilen metalik yansımalı çok amaçlı ürün.",
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
    description:
      "Moonlight tonlu, yüksek pigmentasyonlu ve kolay dağılan göz farı paleti.",
    price: 550,
    stock: 25,
    categorySlug: "goz-makyaji",
    imageUrl: "/image_3.jpg",
  },
];
