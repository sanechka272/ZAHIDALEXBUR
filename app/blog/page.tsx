import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BlogArticleLibrary } from '@/components/BlogArticleLibrary';
import { blogArticles, getBlogReadTime } from '@/lib/blog-data';
import { assets, contact } from '@/lib/site-data';

export const dynamic = 'force-static';
export const revalidate = false;

const BLOG_INDEX_HERO_IMAGE = '/media/blog-index-hero-drilling.webp';

export const metadata: Metadata = {
  title: 'Блог про свердловини, воду та геологію | ZAHIDALEXBUR',
  description: 'База знань ZAHIDALEXBUR про буріння свердловин у Львові та області: геологія, вода, облаштування, насоси, ціни та практичні поради.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    title: 'Блог / База знань ZAHIDALEXBUR',
    description: 'Практичні матеріали про буріння свердловин, воду та геологію Львівської області.',
    url: '/blog',
    images: [{ url: BLOG_INDEX_HERO_IMAGE, alt: 'Буріння свердловини у Львівській області' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Блог / База знань ZAHIDALEXBUR',
    description: 'Практичні матеріали про буріння свердловин, воду та геологію.',
    images: [BLOG_INDEX_HERO_IMAGE],
  },
};

export default function BlogIndexPage() {
  const articles = [...blogArticles]
    .sort((a, b) =>
      (b.updatedAt ?? b.publishedAt ?? '2026-08-12').localeCompare(a.updatedAt ?? a.publishedAt ?? '2026-08-12')
    )
    .map((article) => ({
      slug: article.slug,
      category: article.category,
      title: article.title,
      excerpt: article.excerpt,
      image: article.image,
      imageAlt: article.imageAlt,
      readTime: getBlogReadTime(article),
    }));

  return (
    <main className="blog-page">
      <header className="blog-page__header">
        <div className="blog-page__shell blog-page__nav">
          <Link href="/#top" className="blog-page__brand"><img src={assets.logo} alt="ZAHIDALEXBUR — буріння свердловин" /></Link>
          <nav aria-label="Навігація блогу" className="blog-page__topnav">
            <Link href="/#services">Послуги</Link>
            <Link href="/#about">Про нас</Link>
            <Link href="/#blog" aria-current="page">Блог</Link>
            <Link href="/#contact">Контакти</Link>
          </nav>
          <a href={contact.phoneHref} className="blog-page__contact">{contact.phoneDisplay}</a>
        </div>
      </header>

      <section className="blog-page__hero" aria-labelledby="blog-index-title">
        <div className="blog-page__shell blog-page__hero-grid">
          <div className="blog-page__hero-copy">
            <span>БЛОГ / БАЗА ЗНАНЬ</span>
            <h1 id="blog-index-title">Про свердловини<br />без зайвої води</h1>
            <p>Практичні матеріали про буріння, геологію, воду, облаштування та вартість свердловин у Львові та області.</p>
          </div>
          <div className="blog-page__hero-media">
            <Image
              src={BLOG_INDEX_HERO_IMAGE}
              alt="Буріння свердловини у Львівській області"
              fill
              sizes="(max-width: 820px) 100vw, 52vw"
              quality={82}
              preload
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <BlogArticleLibrary articles={articles} />

      <footer className="reference-footer blog-page__footer">
        <div className="blog-page__shell reference-footer__inner">
          <Link href="/#top" className="reference-footer__brand"><img src={assets.logo} alt="ZAHIDALEXBUR" /></Link>
          <nav aria-label="Навігація у футері"><Link href="/#services">Послуги</Link><Link href="/#about">Про нас</Link><Link href="/#blog">Блог</Link><Link href="/#contact">Контакти</Link></nav>
          <div><a href={contact.phoneHref}>{contact.phoneDisplay}</a><a href={`mailto:${contact.email}`}>{contact.email}</a></div>
        </div>
      </footer>
    </main>
  );
}
