import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "cilt-bakimi" },
      update: {},
      create: { name: "Cilt Bakımı", slug: "cilt-bakimi" },
    }),
    prisma.category.upsert({
      where: { slug: "sac-bakimi" },
      update: {},
      create: { name: "Saç Bakımı", slug: "sac-bakimi" },
    }),
    prisma.category.upsert({
      where: { slug: "vucut-bakimi" },
      update: {},
      create: { name: "Vücut Bakımı", slug: "vucut-bakimi" },
    }),
    prisma.category.upsert({
      where: { slug: "makyaj" },
      update: {},
      create: { name: "Makyaj", slug: "makyaj" },
    }),
    prisma.category.upsert({
      where: { slug: "parfum" },
      update: {},
      create: { name: "Parfüm & Deodorant", slug: "parfum" },
    }),
  ]);

  const [cilt, sac, vucut, makyaj, parfum] = categories;

  // Products
  const products = [
    // Cilt Bakımı
    {
      slug: "dogal-gul-suyu-yuz-losyonu",
      title: "Doğal Gül Suyu Yüz Losyonu",
      description: "Saf gül suyuyla hazırlanmış, cildi nemlendiren ve tazeleyici yüz losyonu. Tüm cilt tipleri için uygundur.",
      price: 89.9,
      stock: 50,
      categoryId: cilt.id,
    },
    {
      slug: "c-vitamini-aydinlatici-serum",
      title: "C Vitamini Aydınlatıcı Serum",
      description: "Yoğun C vitamini içeren aydınlatıcı serum. Cilt tonu eşitsizliğini giderir, parlaklık verir.",
      price: 189.9,
      stock: 30,
      categoryId: cilt.id,
    },
    {
      slug: "hyaluronik-asit-nemlendirici-krem",
      title: "Hyaluronik Asit Nemlendirici Krem",
      description: "Çok kademeli hyaluronik asit içeren yoğun nemlendirici krem. 24 saat nem dengesi sağlar.",
      price: 249.0,
      stock: 40,
      categoryId: cilt.id,
    },
    {
      slug: "kil-maskesi-siyah-nokta",
      title: "Kil Maskesi — Siyah Nokta Karşıtı",
      description: "Kaolin ve bentonit kil içeren derin temizleyici maske. Gözenekleri sıkılaştırır.",
      price: 119.5,
      stock: 25,
      categoryId: cilt.id,
    },
    {
      slug: "badem-yagi-tonik",
      title: "Badem Yağlı Yüz Toniği",
      description: "Soğuk sıkım badem yağı ve çiçek ekstresi içeren yüz toniği. Cildi besler ve yumuşatır.",
      price: 79.9,
      stock: 60,
      categoryId: cilt.id,
    },
    {
      slug: "retinol-gece-kremi",
      title: "Retinol Gece Bakım Kremi",
      description: "A vitamini türevi retinol içeren gece kremi. Kırışıklık görünümünü azaltır ve cildi yeniler.",
      price: 299.0,
      stock: 20,
      categoryId: cilt.id,
    },
    // Saç Bakımı
    {
      slug: "argan-yagi-sac-maskesi",
      title: "Argan Yağı Saç Maskesi",
      description: "Fas kökenli saf argan yağı içeren besleyici saç maskesi. Kuru ve yıpranmış saçlar için idealdir.",
      price: 149.9,
      stock: 35,
      categoryId: sac.id,
    },
    {
      slug: "keratin-sampuan",
      title: "Keratin Onarıcı Şampuan",
      description: "Keratin proteini ve biotin içeren onarıcı şampuan. Saç dökülmesini azaltır, güçlendirir.",
      price: 99.9,
      stock: 45,
      categoryId: sac.id,
    },
    {
      slug: "hindistan-cevizi-yagi-sac-serumu",
      title: "Hindistan Cevizi Yağı Saç Serumu",
      description: "Saf hindistan cevizi yağı ve jojoba içeren saç serumu. Parlaklık ve yumuşaklık sağlar.",
      price: 129.0,
      stock: 28,
      categoryId: sac.id,
    },
    {
      slug: "sakal-bakimi-yagi",
      title: "Sakal Bakım Yağı",
      description: "Argan, jojoba ve sandalwood yağı karışımı. Sakalı yumuşatır, kaşıntıyı önler.",
      price: 109.9,
      stock: 15,
      categoryId: sac.id,
    },
    {
      slug: "sac-besleyici-sprey",
      title: "Saç Besleyici Isı Koruma Spreyi",
      description: "Keratin ve argan yağı içeren 230°C'ye kadar ısı koruması sağlayan saç spreyi.",
      price: 89.0,
      stock: 32,
      categoryId: sac.id,
    },
    // Vücut Bakımı
    {
      slug: "lavanta-vücut-losyonu",
      title: "Lavanta Vücut Losyonu",
      description: "Gerçek lavanta özü ve shea butter içeren yoğun nemlendirici vücut losyonu. Rahatlatıcı koku.",
      price: 99.9,
      stock: 50,
      categoryId: vucut.id,
    },
    {
      slug: "kahve-peeling-krem",
      title: "Kahve Peelingi",
      description: "Öğütülmüş kahve ve hindistan cevizi yağı içeren doğal vücut peelingi. Cildi yumuşatır.",
      price: 79.9,
      stock: 40,
      categoryId: vucut.id,
    },
    {
      slug: "zeytinyagi-banyo-kopugu",
      title: "Zeytinyağlı Banyo Köpüğü",
      description: "Soğuk sıkım zeytinyağı ve vitamin E içeren besleyici banyo köpüğü. 500ml.",
      price: 69.9,
      stock: 55,
      categoryId: vucut.id,
    },
    {
      slug: "selülit-karşıtı-masaj-yagi",
      title: "Selülit Karşıtı Masaj Yağı",
      description: "Kafein ve sinameki yağı içeren selülit karşıtı vücut yağı. Mikro sirkülasyonu artırır.",
      price: 139.9,
      stock: 22,
      categoryId: vucut.id,
    },
    {
      slug: "bebek-gibi-vücut-kremi",
      title: "Bebek Gibi Vücut Kremi",
      description: "Hassas ciltler için özel olarak formüle edilmiş, parfümsüz yoğun nemlendirici krem. 300ml.",
      price: 89.0,
      stock: 38,
      categoryId: vucut.id,
    },
    // Makyaj
    {
      slug: "dogal-allık",
      title: "Doğal Mineral Allık",
      description: "Mineraller ve doğal pigmentlerle hazırlanmış hafif ve uzun süre kalıcı allık. 4 renk seçeneği.",
      price: 159.9,
      stock: 18,
      categoryId: makyaj.id,
    },
    {
      slug: "organik-ruj-koleksiyonu",
      title: "Organik Ruj",
      description: "%100 organik sertifikalı, bitki bazlı ruj. 12 saat kalıcılık. 8 farklı ton.",
      price: 119.9,
      stock: 25,
      categoryId: makyaj.id,
    },
    {
      slug: "dogal-maskara-siyah",
      title: "Doğal Maskara — Jet Siyah",
      description: "Castor ve pamuk özü içeren besleyici maskara. Kirpikleri kalınlaştırır ve uzatır.",
      price: 129.9,
      stock: 30,
      categoryId: makyaj.id,
    },
    {
      slug: "spf50-bb-krem",
      title: "SPF 50 BB Krem",
      description: "Güneş koruma faktörü 50 içeren, kapatıcı ve nemlendirici BB krem. 3 farklı ton.",
      price: 199.9,
      stock: 20,
      categoryId: makyaj.id,
    },
    {
      slug: "göz-kalemi-siyah-liner",
      title: "Doğal Göz Kalemi",
      description: "Mineral içerikli, su geçirmez göz kalemi. 24 saat kalıcılık, hassas gözler için uygundur.",
      price: 89.9,
      stock: 35,
      categoryId: makyaj.id,
    },
    // Parfüm & Deodorant
    {
      slug: "gul-esans-parfum",
      title: "Gül Esansı Parfümü — 50ml",
      description: "Doğal gül, beyaz misk ve sandal ağacı notaları. Uzun süre kalıcı, sofistike bir koku.",
      price: 349.9,
      stock: 15,
      categoryId: parfum.id,
    },
    {
      slug: "lavanta-deodorant-stick",
      title: "Lavanta Doğal Deodorant",
      description: "Alüminyum tuzu içermeyen, 24 saat koruma sağlayan doğal lavanta deodorantı. 60g.",
      price: 89.9,
      stock: 42,
      categoryId: parfum.id,
    },
    {
      slug: "bergamot-koku-kiti",
      title: "Bergamot Koku Seti",
      description: "Bergamot ve narenciye notaları içeren parfüm + vücut losyonu ikili seti. Hediye paketli.",
      price: 399.9,
      stock: 10,
      categoryId: parfum.id,
    },
    {
      slug: "oud-unisex-parfum",
      title: "Oud Unisex Parfüm — 30ml",
      description: "Arap oud ağacı, amber ve vanilya notaları. Doğu tarzı yoğun ve büyüleyici bir koku.",
      price: 279.9,
      stock: 12,
      categoryId: parfum.id,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        price: p.price,
        images: {
          create: [
            {
              url: `/image_${(products.indexOf(p) % 3) + 1}.jpg`,
              alt: p.title,
              sortOrder: 0,
            },
          ],
        },
      },
    });
  }

  // Admin user
  const adminHash = await argon2.hash("Admin1234!", { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: "admin@guzellikmerkezi.com.tr" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@guzellikmerkezi.com.tr",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  console.log("Seed complete: categories, 25 products, 1 admin user");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
