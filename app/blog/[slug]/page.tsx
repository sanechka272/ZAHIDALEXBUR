import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogArticles, getBlogArticle } from '@/lib/blog-data';
import { assets } from '@/lib/site-data';

export const dynamic = 'force-static';
export const revalidate = false;
export const dynamicParams = false;

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} | ZAHIDALEXBUR`,
    description: article.excerpt,
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  if (!article) notFound();

  return (
    <main className="article-page">
      <header className="blog-page__header article-page__header">
        <div className="blog-page__shell blog-page__nav">
          <Link href="/" className="blog-page__brand"><img src={assets.logo} alt="ZAHIDALEXBUR" /></Link>
          <Link href="/blog" className="article-page__back">← Усі статті</Link>
        </div>
      </header>

      <article>
        <section className="article-page__hero">
          <div className="blog-page__shell article-page__hero-grid">
            <div className="article-page__intro">
              <span>{article.tag} · {article.readTime}</span>
              <h1>{article.title}</h1>
              <p>{article.intro}</p>
            </div>
            <div className="article-page__cover" style={{ position: 'relative' }}>
              <Image
                src={article.image}
                alt={article.title}
                fill
                sizes="(max-width: 900px) 100vw, 54vw"
                quality={90}
                fetchPriority="high"
              />
            </div>
          </div>
        </section>

        <section className="article-page__body">
          <div className="article-page__content">
            {article.sections.map((section, index) => (
              <section key={section.heading}>
                <span>0{index + 1}</span>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}
            <aside className="article-page__cta">
              <span>ПОТРІБНА ОЦІНКА ДІЛЯНКИ?</span>
              <h2>Обговорімо вашу свердловину</h2>
              <p>Уточнимо локацію, задачу та підберемо наступний крок без вигаданих обіцянок щодо глибини.</p>
              <Link href="/#contact">Перейти до контактів →</Link>
            </aside>
          </div>
        </section>
      </article>
    </main>
  );
}
