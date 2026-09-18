import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import featuredDepthArticleImage from '../../../blog-hlybyna-sverdlovyny-lvivska-oblast-featured.webp';
import waterDisappearsArticleImage from '../../../blog-chomu-voda-mozhe-znyknuty-featured.webp';
import filterVsNoFilterArticleImage from '../../../blog-filtrova-chy-bezfiltrova-featured.webp';
import turnkeyWellArticleImage from '../../../blog-yak-oblashtuvaty-sverdlovynu-pid-kliuch-featured.webp';
import { ArticleLeadButton, ArticleShareButton } from '@/components/ArticleInteractions';
import { blogArticles, getBlogArticle, getRelatedBlogArticles } from '@/lib/blog-data';
import { assets, contact } from '@/lib/site-data';

const SITE_URL = 'https://zahidalexbur.com.ua';
const ARTICLE_PUBLISHED_AT = '2026-08-12';
const ARTICLE_PUBLISHED_LABEL = '12 серпня 2026';
const FEATURED_DEPTH_ARTICLE_SLUG = 'hlybyna-sverdlovyny-lvivska-oblast';
const WATER_DISAPPEARS_ARTICLE_SLUG = 'chomu-voda-mozhe-znyknuty-zi-sverdlovyny';
const FILTER_VS_NO_FILTER_ARTICLE_SLUG = 'filtrova-chy-bezfiltrova-sverdlovyna';
const TURNKEY_WELL_ARTICLE_SLUG = 'yak-oblashtuvaty-sverdlovynu-pid-kliuch';

function getArticleVisual(slug: string, fallback: string) {
  if (slug === FEATURED_DEPTH_ARTICLE_SLUG) return featuredDepthArticleImage;
  if (slug === WATER_DISAPPEARS_ARTICLE_SLUG) return waterDisappearsArticleImage;
  if (slug === FILTER_VS_NO_FILTER_ARTICLE_SLUG) return filterVsNoFilterArticleImage;
  if (slug === TURNKEY_WELL_ARTICLE_SLUG) return turnkeyWellArticleImage;
  return fallback;
}

function getArticleVisualUrl(slug: string, fallback: string) {
  const visual = getArticleVisual(slug, fallback);
  return typeof visual === 'string' ? visual : visual.src;
}

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
  const articleVisualUrl = getArticleVisualUrl(article.slug, article.image);

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
      images: [{ url: articleVisualUrl, alt: article.imageAlt }],
      publishedTime: ARTICLE_PUBLISHED_AT,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.metaTitle,
      description: article.metaDescription,
      images: [articleVisualUrl],
    },
  };
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.3 4.5 5.6 6.1c-.6.6-.7 1.5-.3 2.3 2.1 4.2 5.4 7.5 9.6 9.6.8.4 1.7.3 2.3-.3l1.7-1.7-3.2-3.2-1.6 1.1c-.5.3-1.1.3-1.6 0a11.3 11.3 0 0 1-4.2-4.2c-.3-.5-.3-1.1 0-1.6l1.1-1.6-2.1-2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ConsultationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 6.5h14v9H9.5L5 19V6.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 10h6M9 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3.5h7l3 3V20H7V3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M14 3.5V7h3M9.5 11h5M9.5 14h5M9.5 17h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  if (!article) notFound();

  const articleIndex = blogArticles.findIndex((candidate) => candidate.slug === article.slug);
  const previousArticle = articleIndex > 0 ? blogArticles[articleIndex - 1] : null;
  const nextArticle = articleIndex >= 0 && articleIndex < blogArticles.length - 1 ? blogArticles[articleIndex + 1] : null;
  const related = getRelatedBlogArticles(article).slice(0, 3);
  const articleUrl = `${SITE_URL}/blog/${article.slug}`;
  const articleVisual = getArticleVisual(article.slug, article.image);
  const articleVisualUrl = getArticleVisualUrl(article.slug, article.image);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${articleUrl}#article`,
        headline: article.title,
        description: article.metaDescription,
        image: [`${SITE_URL}${articleVisualUrl}`],
        datePublished: ARTICLE_PUBLISHED_AT,
        dateModified: ARTICLE_PUBLISHED_AT,
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
        <div className="blog-page__shell blog-page__nav article-page__nav">
          <Link href="/#top" className="blog-page__brand"><img src={assets.logo} alt="ZAHIDALEXBUR — буріння свердловин" /></Link>
          <nav aria-label="Навігація статті" className="blog-page__topnav">
            <Link href="/#top">Головна</Link>
            <Link href="/#services">Послуги</Link>
            <Link href="/#about">Про нас</Link>
            <Link href="/blog" aria-current="page">Блог</Link>
            <Link href="/#contact">Контакти</Link>
          </nav>
          <div className="article-page__header-contact">
            <a className="blog-page__contact" href={contact.phoneHref}><PhoneIcon />{contact.phoneDisplay}</a>
            <a className="article-page__call" href={contact.phoneHref} aria-label="Зателефонувати"><PhoneIcon /></a>
          </div>
        </div>
      </header>

      <article>
        <section className="article-page__hero">
          <div className="blog-page__shell">
            <nav className="article-page__breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Головна</Link><span>/</span><Link href="/blog">Блог</Link><span>/</span><span aria-current="page">{article.title}</span>
            </nav>

            <div className="article-page__hero-grid">
              <header className="article-page__intro">
                <span className="article-page__eyebrow">{article.category} · {article.readTime}</span>
                <h1>{article.title}</h1>
                <p>{article.intro}</p>
                <div className="article-page__author">
                  <span className="article-page__author-mark" aria-hidden="true">ZB</span>
                  <div><strong>Команда ZAHIDALEXBUR</strong><time dateTime={ARTICLE_PUBLISHED_AT}>{ARTICLE_PUBLISHED_LABEL}</time></div>
                </div>
              </header>

              <div className="article-page__visual">
                <div className="article-page__cover" style={{ position: 'relative' }}>
                  <Image src={articleVisual} alt={article.imageAlt} fill sizes="(max-width: 900px) 100vw, 58vw" quality={90} fetchPriority="high" />
                </div>
                <div className="article-page__media-tools">
                  <span><ClockIcon />{article.readTime}</span>
                  <ArticleShareButton title={article.title} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="article-page__body" aria-label="Матеріал статті">
          <div className="blog-page__shell article-page__reading-grid">
            <aside className="article-page__sidebar">
              <details className="article-toc" open>
                <summary>ЗМІСТ СТАТТІ</summary>
                <nav aria-label="Зміст статті">
                  {article.sections.map((section, index) => (
                    <a key={section.heading} href={`#section-${String(index + 1).padStart(2, '0')}`}>
                      <span>0{index + 1}</span><span>{section.heading}</span>
                    </a>
                  ))}
                </nav>
              </details>

              <div className="article-consultation">
                <span className="article-consultation__icon"><ConsultationIcon /></span>
                <h2>Потрібна консультація?</h2>
                <p>Допоможемо оцінити можливість буріння на вашій ділянці.</p>
                <ArticleLeadButton className="article-consultation__button">Зв’язатися з нами</ArticleLeadButton>
              </div>
            </aside>

            <div className="article-page__content">
              {article.sections.map((section, index) => (
                <section key={section.heading} id={`section-${String(index + 1).padStart(2, '0')}`}>
                  <span>0{index + 1}</span>
                  <h2>{section.heading}</h2>
                  <p>{section.body}</p>
                  {index === 2 && (
                    <div className="article-info-card">
                      <span className="article-info-card__icon"><ChecklistIcon /></span>
                      <div>
                        <strong>Що бажано підготувати:</strong>
                        <ul>
                          <li>Точна адреса або геолокація</li>
                          <li>Тип об’єкта та сценарій використання води</li>
                          <li>Бажана продуктивність системи</li>
                          <li>Інформація про доступ техніки до місця робіт</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </section>
              ))}

              <nav className="article-page__article-nav" aria-label="Навігація між статтями">
                <div>
                  {previousArticle ? <><span>← Попередня стаття</span><Link href={`/blog/${previousArticle.slug}`}>{previousArticle.title}</Link></> : null}
                </div>
                <div>
                  {nextArticle ? <><span>Наступна стаття →</span><Link href={`/blog/${nextArticle.slug}`}>{nextArticle.title}</Link></> : null}
                </div>
              </nav>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="article-related" aria-labelledby="related-title">
            <div className="blog-page__shell">
              <div className="article-related__head"><h2 id="related-title">Читайте також</h2></div>
              <div className="article-related__grid">
                {related.map((relatedArticle) => (
                  <article key={relatedArticle.slug}>
                    <Link className="article-related__media" href={`/blog/${relatedArticle.slug}`} aria-label={relatedArticle.title}>
                      <Image src={relatedArticle.image} alt={relatedArticle.imageAlt} fill sizes="110px" quality={90} />
                    </Link>
                    <div className="article-related__copy">
                      <span>{relatedArticle.category} · {relatedArticle.readTime}</span>
                      <h3><Link href={`/blog/${relatedArticle.slug}`}>{relatedArticle.title}</Link></h3>
                    </div>
                    <Link className="article-related__arrow" href={`/blog/${relatedArticle.slug}`} aria-label={`Читати ${relatedArticle.title}`}>→</Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="article-final-cta" aria-label="Консультація">
          <div className="blog-page__shell article-final-cta__grid">
            <div><span>МАЄТЕ ПИТАННЯ?</span><h2>Допоможемо знайти<br />правильне рішення</h2></div>
            <div className="article-final-cta__action"><p>Передайте адресу або геолокацію — зорієнтуємо по глибині та типу свердловини.</p><ArticleLeadButton className="article-final-cta__button">Обговорити ділянку</ArticleLeadButton></div>
            <div className="article-final-cta__label">НАДІЙНА<br />ВОДА —<br />РЕАЛЬНА<br />ПЕРЕВАГА</div>
          </div>
        </section>
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
