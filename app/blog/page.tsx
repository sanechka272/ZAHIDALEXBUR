import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { blogArticles } from '@/lib/blog-data';
import { assets, contact } from '@/lib/site-data';
import blogHeroImage from '../../blog-index-hero-drilling.webp';
import waterDisappearsArticleImage from '../../blog-chomu-voda-mozhe-znyknuty-featured.webp';
import filterVsNoFilterArticleImage from '../../blog-filtrova-chy-bezfiltrova-featured.webp';

export const dynamic = 'force-static';
export const revalidate = false;

const WATER_DISAPPEARS_SLUG = 'chomu-voda-mozhe-znyknuty-zi-sverdlovyny';
const FILTER_VS_NO_FILTER_SLUG = 'filtrova-chy-bezfiltrova-sverdlovyna';

function getBlogIndexArticleImage(article: (typeof blogArticles)[number]) {
  if (article.slug === WATER_DISAPPEARS_SLUG) return waterDisappearsArticleImage;
  if (article.slug === FILTER_VS_NO_FILTER_SLUG) return filterVsNoFilterArticleImage;
  return article.image;
}

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
    images: [{ url: blogHeroImage.src, alt: 'Буріння свердловини у Львівській області' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Блог / База знань ZAHIDALEXBUR',
    description: 'Практичні матеріали про буріння свердловин, воду та геологію.',
    images: [blogHeroImage.src],
  },
};

export default function BlogIndexPage() {
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
              src={blogHeroImage}
              alt="Буріння свердловини у Львівській області"
              fill
              sizes="(max-width: 820px) 100vw, 52vw"
              quality={90}
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <section className="blog-page__list" aria-label="Усі матеріали">
        <div className="blog-page__shell blog-page__grid">
          {blogArticles.map((article, index) => (
            <article className="blog-index-card" key={article.slug}>
              <Link href={`/blog/${article.slug}`} className="blog-index-card__media" aria-label={article.title}>
                <Image
                  src={getBlogIndexArticleImage(article)}
                  alt={article.imageAlt}
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  quality={90}
                />
                <span>0{index + 1}</span>
              </Link>
              <div className="blog-index-card__body">
                <div><span>{article.category}</span><small>{article.readTime}</small></div>
                <h2><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2>
                <p>{article.excerpt}</p>
                <Link href={`/blog/${article.slug}`}><strong>Читати статтю →</strong></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

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
