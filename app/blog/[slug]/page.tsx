import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogArticles, getBlogArticle, getRelatedBlogArticles } from '@/lib/blog-data';
import { assets, contact } from '@/lib/site-data';

const SITE_URL = 'https://zahidalexbur.com.ua';

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

  const canonical = `/blog/${article.slug}`;

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      locale: 'uk_UA',
      url: canonical,
      title: article.metaTitle,
      description: article.metaDescription,
      images: [{ url: article.image, alt: article.imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.metaTitle,
      description: article.metaDescription,
      images: [article.image],
    },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  if (!article) notFound();

  const related = getRelatedBlogArticles(article).slice(0, 3);
  const articleUrl = `${SITE_URL}/blog/${article.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${articleUrl}#article`,
        headline: article.title,
        description: article.metaDescription,
        image: [`${SITE_URL}${article.image}`],
        inLanguage: 'uk-UA',
        mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
        author: { '@type': 'Organization', name: 'ZAHIDALEXBUR', url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: 'ZAHIDALEXBUR',
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}${assets.logo}` },
        },
        articleSection: article.category,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Головна', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Блог', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: article.title, item: articleUrl },
        ],
      },
    ],
  };

  return (
    <main className="article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <header className="blog-page__header article-page__header">
        <div className="blog-page__shell blog-page__nav">
          <Link href="/#top" className="blog-page__brand"><img src={assets.logo} alt="ZAHIDALEXBUR — буріння свердловин" /></Link>
          <nav aria-label="Навігація статті" className="blog-page__topnav">
            <Link href="/#services">Послуги</Link>
            <Link href="/#about">Про нас</Link>
            <Link href="/blog" aria-current="page">Блог</Link>
            <Link href="/#contact">Контакти</Link>
          </nav>
          <a className="blog-page__contact" href={contact.phoneHref}>{contact.phoneDisplay}</a>
        </div>
      </header>

      <article>
        <section className="article-page__hero">
          <div className="blog-page__shell">
            <nav className="article-page__breadcrumbs" aria-label="Хлібні крихти">
              <Link href="/">Головна</Link><span>/</span><Link href="/blog">Блог</Link><span>/</span><span aria-current="page">{article.title}</span>
            </nav>
            <div className="article-page__hero-grid">
              <div className="article-page__intro">
                <span>{article.category} · {article.readTime}</span>
                <h1>{article.title}</h1>
                <p>{article.intro}</p>
              </div>
              <div className="article-page__cover" style={{ position: 'relative' }}>
                <Image src={article.image} alt={article.imageAlt} fill sizes="(max-width: 900px) 100vw, 54vw" quality={90} fetchPriority="high" />
              </div>
            </div>
          </div>
        </section>

        <section className="article-page__body" aria-label="Матеріал статті">
          <div className="article-page__content">
            {article.sections.map((section, index) => (
              <section key={section.heading}>
                <span>0{index + 1}</span>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}

            <nav className="article-page__context-links" aria-label="Корисні посилання">
              <Link href="/#services">Переглянути типи свердловин →</Link>
              <Link href="/#contact">Отримати попередній розрахунок →</Link>
            </nav>

            <aside className="article-page__cta">
              <span>ПОТРІБНА ОЦІНКА ДІЛЯНКИ?</span>
              <h2>Обговорімо вашу свердловину</h2>
              <p>Передайте адресу або геолокацію — уточнимо задачу та підберемо наступний крок без вигаданих обіцянок щодо глибини.</p>
              <Link href="/#contact">Перейти до контактів →</Link>
            </aside>
          </div>
        </section>

        {related.length > 0 && (
          <section className="article-related" aria-labelledby="related-title">
            <div className="blog-page__shell">
              <div className="article-related__head"><span>ПРОДОВЖИТИ ЧИТАННЯ</span><h2 id="related-title">Читайте також</h2></div>
              <div className="article-related__grid">
                {related.map((relatedArticle) => (
                  <article key={relatedArticle.slug}>
                    <Link className="article-related__media" href={`/blog/${relatedArticle.slug}`} aria-label={relatedArticle.title}>
                      <Image src={relatedArticle.image} alt={relatedArticle.imageAlt} fill sizes="(max-width: 767px) 100vw, 33vw" quality={90} />
                    </Link>
                    <span>{relatedArticle.category} · {relatedArticle.readTime}</span>
                    <h3><Link href={`/blog/${relatedArticle.slug}`}>{relatedArticle.title}</Link></h3>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>

      <footer className="reference-footer blog-page__footer">
        <div className="blog-page__shell reference-footer__inner">
          <Link href="/#top" className="reference-footer__brand"><img src={assets.logo} alt="ZAHIDALEXBUR" /></Link>
          <nav aria-label="Навігація у футері"><Link href="/#services">Послуги</Link><Link href="/#about">Про нас</Link><Link href="/blog">Блог</Link><Link href="/#contact">Контакти</Link></nav>
          <div><a href={contact.phoneHref}>{contact.phoneDisplay}</a><a href={`mailto:${contact.email}`}>{contact.email}</a></div>
        </div>
      </footer>
    </main>
  );
}
