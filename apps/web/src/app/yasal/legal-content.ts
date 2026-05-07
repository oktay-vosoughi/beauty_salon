import { site } from "@/lib/site";

interface LegalSection {
  heading: string;
  paragraphs: string[];
}

interface LegalPage {
  slug: string;
  title: string;
  description: string;
  sections: LegalSection[];
}

const sellerInfo = `${site.legalName}, ${site.address}, ${site.email}`;

export const legalPages: LegalPage[] = [
  {
    slug: "kvkk",
    title: "KVKK",
    description:
      "Niltellioglu kişisel verilerin korunması ve işlenmesine ilişkin aydınlatma metni.",
    sections: [
      {
        heading: "Veri Sorumlusu",
        paragraphs: [
          `${site.legalName}, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu sıfatıyla hareket eder.`,
          `Şirket iletişim bilgileri: ${sellerInfo}.`,
        ],
      },
      {
        heading: "Kişisel Verilerin İşlenme Amaçları",
        paragraphs: [
          "Kişisel veriler üyelik, sipariş, ödeme, teslimat, müşteri ilişkileri, talep ve şikayet yönetimi, kampanya bilgilendirmeleri, site güvenliği ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenebilir.",
          "Web sitesi formları, üyelik işlemleri, sipariş süreçleri, iletişim talepleri ve çerezler aracılığıyla kimlik, iletişim, işlem, ödeme ve teknik kullanım verileri alınabilir.",
        ],
      },
      {
        heading: "Aktarım, Saklama ve Güvenlik",
        paragraphs: [
          "Veriler; kargo, ödeme, altyapı, muhasebe, hukuk ve yetkili kamu kurumları gibi hizmet veya kanuni yükümlülük gereği ilgili taraflarla sınırlı şekilde paylaşılabilir.",
          "Kişisel veriler işleme amacı ve mevzuatta öngörülen saklama süreleri boyunca tutulur; süre sona erdiğinde silinir, yok edilir veya anonim hale getirilir.",
        ],
      },
      {
        heading: "Haklarınız",
        paragraphs: [
          "KVKK'nın 11. maddesi kapsamında verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme, silme, işleme itiraz etme ve kanuna aykırı işleme nedeniyle zarar doğmuşsa giderim talep etme haklarına sahipsiniz.",
          `Haklarınıza ilişkin taleplerinizi ${site.email} adresine iletebilirsiniz. Başvurular mevzuatta belirtilen süreler içinde değerlendirilir.`,
        ],
      },
    ],
  },
  {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    description:
      "Niltellioglu web sitesinde kullanılan çerezlere ilişkin bilgilendirme.",
    sections: [
      {
        heading: "Çerez Nedir?",
        paragraphs: [
          "Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza veya cihazınıza kaydedilen küçük metin dosyalarıdır.",
          "Bu dosyalar site deneyimini iyileştirmek, oturum bilgisini korumak, tercihleri hatırlamak ve site performansını ölçmek için kullanılabilir.",
        ],
      },
      {
        heading: "Çerez Kullanım Amaçları",
        paragraphs: [
          "Zorunlu çerezler sitenin güvenli ve doğru çalışması için kullanılır. Performans ve analiz çerezleri sayfaların nasıl kullanıldığını anlamaya yardımcı olur.",
          "Fonksiyonel çerezler tercihlerinizi hatırlayabilir. Reklam veya üçüncü taraf çerezleri kullanıldığında bu çerezler ilgili hizmet sağlayıcıların politikalarına da tabi olabilir.",
        ],
      },
      {
        heading: "Çerez Tercihleri",
        paragraphs: [
          "Tarayıcı ayarlarınızdan çerezleri silebilir, engelleyebilir veya çerez kullanıldığında uyarı almayı seçebilirsiniz.",
          "Çerezleri kapatmanız halinde sepet, üyelik, oturum veya bazı site özellikleri beklenen şekilde çalışmayabilir.",
        ],
      },
      {
        heading: "İletişim",
        paragraphs: [`Çerez politikası ile ilgili sorularınız için ${site.email} adresinden bizimle iletişime geçebilirsiniz.`],
      },
    ],
  },
  {
    slug: "uyelik-sozlesmesi",
    title: "Üyelik Sözleşmesi",
    description:
      "Niltellioglu üyelik hesabı kullanım koşulları ve tarafların hakları.",
    sections: [
      {
        heading: "Taraflar",
        paragraphs: [
          `Satıcı: ${sellerInfo}.`,
          "Üye, web sitesi üzerinden üyelik formunu dolduran ve hesabını oluşturan gerçek veya tüzel kişidir.",
        ],
      },
      {
        heading: "Üyelik ve Hesap Güvenliği",
        paragraphs: [
          "Üye, kayıt sırasında paylaştığı bilgilerin doğru ve güncel olduğunu kabul eder. Bilgiler değiştiğinde hesabı üzerinden güncelleme yapmakla yükümlüdür.",
          "Kullanıcı adı ve şifre güvenliği üyeye aittir. Yetkisiz kullanım fark edildiğinde Niltellioglu ile gecikmeden iletişime geçilmelidir.",
        ],
      },
      {
        heading: "Kullanım Koşulları",
        paragraphs: [
          "Üye, siteyi hukuka, kamu düzenine, genel ahlaka ve üçüncü kişi haklarına uygun şekilde kullanmayı kabul eder.",
          "Üye, web sitesi üzerinden yaptığı alışverişlerde mesafeli satış sözleşmesi, ön bilgilendirme ve ilgili yasal metinlere tabidir.",
        ],
      },
      {
        heading: "Sözleşmenin Sona Ermesi",
        paragraphs: [
          "Üye hesabını dilediği zaman kapatabilir. Niltellioglu, sözleşmeye veya hukuka aykırı kullanım halinde üyeliği askıya alma veya sonlandırma hakkını saklı tutar.",
        ],
      },
    ],
  },
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    description:
      "Niltellioglu online siparişlerinde uygulanacak mesafeli satış koşulları.",
    sections: [
      {
        heading: "Satıcı Bilgileri",
        paragraphs: [`Satıcı: ${sellerInfo}.`],
      },
      {
        heading: "Konu ve Kapsam",
        paragraphs: [
          "Bu sözleşme, alıcının Niltellioglu web sitesi üzerinden elektronik ortamda sipariş verdiği ürünlerin satışı ve teslimine ilişkin hak ve yükümlülükleri düzenler.",
          "Alıcı, sipariş onayıyla ürün özellikleri, satış fiyatı, ödeme, teslimat ve cayma hakkı hakkında ön bilgilendirmeyi kabul etmiş sayılır.",
        ],
      },
      {
        heading: "Teslimat ve Ödeme",
        paragraphs: [
          "Siparişler, stok ve ödeme onayı sonrasında alıcının bildirdiği adrese gönderilir. Teslimat süreci mücbir sebepler veya alıcı kaynaklı eksik bilgiler nedeniyle uzayabilir.",
          "Ödeme işlemleri güvenli ödeme altyapıları üzerinden yürütülür. Kredi kartı bilgileri Niltellioglu tarafından saklanmaz.",
        ],
      },
      {
        heading: "Cayma Hakkı",
        paragraphs: [
          "Alıcı, mevzuatta belirtilen şartlar çerçevesinde teslimden itibaren 14 gün içinde cayma hakkını kullanabilir.",
          "Ambalajı açılmış, kullanılmış veya hijyen sebebiyle iadesi uygun olmayan kozmetik ve kişisel bakım ürünlerinde cayma hakkı mevzuat gereği sınırlı olabilir.",
        ],
      },
    ],
  },
  {
    slug: "gizlilik-ve-guvenlik-politikasi",
    title: "Gizlilik ve Güvenlik Politikası",
    description:
      "Niltellioglu web sitesi gizlilik, veri güvenliği ve ödeme güvenliği politikası.",
    sections: [
      {
        heading: "Gizlilik İlkesi",
        paragraphs: [
          "Niltellioglu, müşterilerinin ve ziyaretçilerinin kişisel verilerinin gizliliğini korumayı temel bir sorumluluk olarak kabul eder.",
          "Üyelik, sipariş, iletişim ve destek süreçlerinde alınan bilgiler yalnızca hizmet sunumu, müşteri ilişkileri, güvenlik ve yasal yükümlülükler için kullanılır.",
        ],
      },
      {
        heading: "Veri Güvenliği",
        paragraphs: [
          "Kişisel verilerin yetkisiz erişim, kayıp, değiştirme veya ifşaya karşı korunması için teknik ve idari güvenlik önlemleri uygulanır.",
          "Üyelik bilgilerinize yalnızca siz erişebilir ve bilgilerinizi hesabınız üzerinden güncelleyebilirsiniz.",
        ],
      },
      {
        heading: "Ödeme Güvenliği",
        paragraphs: [
          "Online alışverişlerde ödeme işlemleri güvenli ödeme altyapıları üzerinden tamamlanır. Kredi kartı bilgileri Niltellioglu sistemlerinde saklanmaz.",
          "E-posta ile kredi kartı numarası, şifre veya ödeme güvenliğini riske atabilecek bilgi paylaşmamanızı öneririz.",
        ],
      },
      {
        heading: "İletişim",
        paragraphs: [`Gizlilik ve güvenlik politikası hakkındaki sorularınız için ${site.email} adresinden bize ulaşabilirsiniz.`],
      },
    ],
  },
  {
    slug: "tuketici-haklari-cayma-iptal-iade",
    title: "Tüketici Hakları / Cayma / İptal / İade",
    description:
      "Niltellioglu tüketici hakları, cayma, iptal ve iade koşulları.",
    sections: [
      {
        heading: "Genel Bilgilendirme",
        paragraphs: [
          "Web sitesi üzerinden sipariş veren alıcılar, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümlerine tabidir.",
          "Satın alınan ürünler, siparişte belirtilen niteliklere uygun ve eksiksiz şekilde teslim edilmelidir.",
        ],
      },
      {
        heading: "Cayma Hakkı",
        paragraphs: [
          `Cayma hakkı bildirimleri için satıcı iletişim bilgileri: ${sellerInfo}.`,
          "Alıcı, mevzuatta belirtilen şartlar kapsamında teslim tarihinden itibaren 14 gün içinde cayma hakkını kullanabilir.",
        ],
      },
      {
        heading: "İade Koşulları",
        paragraphs: [
          "İade edilecek ürünlerin kutusu, ambalajı, faturası ve varsa standart aksesuarları ile birlikte eksiksiz ve hasarsız gönderilmesi gerekir.",
          "Kozmetik ve kişisel bakım ürünlerinde ambalajı açılmış, denenmiş, bozulmuş veya kullanılmış ürünler hijyen nedeniyle iade kapsamında değerlendirilemeyebilir.",
        ],
      },
      {
        heading: "Ücret İadesi",
        paragraphs: [
          "İade talebi onaylanan ürünlerde ücret iadesi, mevzuata ve ödeme sağlayıcı süreçlerine uygun şekilde aynı ödeme yöntemine yapılır.",
        ],
      },
    ],
  },
];

export function getLegalPage(slug: string) {
  return legalPages.find((page) => page.slug === slug);
}
