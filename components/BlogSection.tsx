'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import featuredDepthArticleImage from '../blog-hlybyna-sverdlovyny-lvivska-oblast-featured.webp';
import blogKnowledgeHeroImage from '../blog-knowledge-hero-drilling.webp';
import waterDisappearsArticleImage from '../blog-chomu-voda-mozhe-znyknuty-featured.webp';
import filterVsNoFilterArticleImage from '../blog-filtrova-chy-bezfiltrova-featured.webp';
import { featuredBlogArticle, landingBlogArticles } from '@/lib/blog-data';
import { assets } from '@/lib/site-data';

const categories = ['УСІ МАТЕРІАЛИ', 'ГЕОЛОГІЯ', 'БУРІННЯ', 'ОБЛАШТУВАННЯ', 'ВОДА', 'ЦІНИ', 'ПОРАДИ'] as const;
const WATER_DISAPPEARS_SLUG = 'chomu-voda-mozhe-znyknuty-zi-sverdlovyny';
const FILTER_VS_NO_FILTER_SLUG = 'filtrova-chy-bezfiltrova-sverdlovyna';

function getLandingArticleImage(article: (typeof landingBlogArticles)[number]) {
  if (article.slug === WATER_DISAPPEARS_SLUG) return waterDisappearsArticleImage;
  if (article.slug === FILTER_VS_NO_FILTER_SLUG) return filterVsNoFilterArticleImage;
  return article.image;
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h13m-4-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function BlogSection({ onLeadOpen: _onLeadOpen }: { onLeadOpen: () => void }) {
  void _onLeadOpen;
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>('УСІ МАТЕРІАЛИ');
  const [query, setQuery] = useState('');

  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('uk-UA');
    return landingBlogArticles.filter((article) => {
      const matchesCategory = activeCategory === 'УСІ МАТЕРІАЛИ' || article.category === activeCategory;
      const matchesQuery = !normalized || `${article.title} ${article.excerpt} ${article.category}`.toLocaleLowerCase('uk-UA').includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <section className="blog-kb" id="blog" aria-labelledby="blog-kb-title">
      <div className="blog-kb__hero">
        <div className="reference-shell blog-kb__hero-grid">
          <div className="blog-kb__hero-copy reveal reveal--from-left">
            <span className="blog-kb__eyebrow">БЛОГ / БАЗА ЗНАНЬ</span>
            <h2 id="blog-kb-title">Про свердловини<br />без зайвої води</h2>
            <p>Практичні матеріали про буріння, геологію, воду та облаштування свердловин у Львові та області.</p>
            <div className="blog-kb__keywords" aria-label="Ключові теми"><span />ДОСВІД · ЕКСПЕРТИЗА · РЕАЛЬНІ КЕЙСИ</div>
          </div>
          <div className="blog-kb__hero-media reveal reveal--from-right">
            <Image src={blogKnowledgeHeroImage} alt="Бурова установка ZAHIDALEXBUR у Львівській області" fill sizes="(max-width: 900px) 100vw, 52vw" quality={90} />
            <div className="blog-kb__hero-caption">ВОДА<br />ПОЧИНАЄТЬСЯ<br />З ПРАВИЛЬНИХ РІШЕНЬ</div>
          </div>
        </div>
      </div>

      <div className="blog-kb__featured-wrap">
        <article className="reference-shell blog-kb__featured reveal">
          <Link href={`/blog/${featuredBlogArticle.slug}`} className="blog-kb__featured-media" aria-label={featuredBlogArticle.title}>
            <Image src={featuredDepthArticleImage} alt={featuredBlogArticle.imageAlt} fill sizes="(max-width: 900px) 100vw, 48vw" quality={90} />
          </Link>
          <div className="blog-kb__featured-copy">
            <span className="blog-kb__meta">{featuredBlogArticle.category} · {featuredBlogArticle.readTime.toUpperCase().replace(' ЧИТАННЯ', '')}</span>
            <h3><Link href={`/blog/${featuredBlogArticle.slug}`}>{featuredBlogArticle.title}</Link></h3>
            <p>{featuredBlogArticle.excerpt}</p>
            <Link className="blog-kb__button" href={`/blog/${featuredBlogArticle.slug}`}>Читати матеріал <ArrowIcon /></Link>
          </div>
          <div className="blog-kb__featured-aside" aria-hidden="true">
            <span>01</span>
            <small>ЛЬВІВ ТА ОБЛАСТЬ<br />ГЕОЛОГІЯ РЕГІОНУ</small>
          </div>
        </article>
      </div>

      <div className="blog-kb__library">
        <div className="reference-shell">
          <div className="blog-kb__filterbar" aria-label="Фільтри матеріалів">
            <div className="blog-kb__tabs" role="tablist" aria-label="Категорії блогу">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category}
                  className={activeCategory === category ? 'is-active' : ''}
                  onClick={() => setActiveCategory(category)}
                >
                  {category === 'УСІ МАТЕРІАЛИ' ? category : category.charAt(0) + category.slice(1).toLocaleLowerCase('uk-UA')}
                </button>
              ))}
            </div>
            <label className="blog-kb__search">
              <span className="sr-only">Пошук статей</span>
              <SearchIcon />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук статей..." type="search" />
            </label>
          </div>

          <div className="blog-kb__grid" aria-live="polite">
            {filteredArticles.map((article) => (
              <article className="blog-kb-card" key={article.slug}>
                <Link className="blog-kb-card__media" href={`/blog/${article.slug}`} aria-label={article.title}>
                  <Image src={getLandingArticleImage(article)} alt={article.imageAlt} fill sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw" quality={90} />
                </Link>
                <div className="blog-kb-card__body">
                  <span className="blog-kb__meta">{article.category} · {article.readTime.toUpperCase().replace(' ЧИТАННЯ', '')}</span>
                  <h3><Link href={`/blog/${article.slug}`}>{article.title}</Link></h3>
                  <p>{article.excerpt}</p>
                  <Link className="blog-kb-card__link" href={`/blog/${article.slug}`}>Читати <ArrowIcon /></Link>
                </div>
              </article>
            ))}
            {filteredArticles.length === 0 && <p className="blog-kb__empty">За цим запитом матеріалів не знайдено.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
