import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { getLegalPage, legalPages } from "../legal-content";
import styles from "./page.module.css";

export function generateStaticParams() {
  return legalPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getLegalPage(slug);
  if (!page) return { title: "Sayfa Bulunamadı" };
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: `/yasal/${page.slug}`,
  });
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getLegalPage(slug);
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
