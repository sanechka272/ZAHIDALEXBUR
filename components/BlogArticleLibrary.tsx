'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export type BlogLibraryArticle = {
  slug: string;
  category: 'Буріння' | 'Геологія' | 'Ціни' | 'Вода' | 'Облаштування' | 'Ремонт' | 'Обслуговування';
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  readTime: string;
};

const CATEGORIES: Array<'Усі матеріали' | BlogLibraryArticle['category']> = [
  'Усі матеріали',
  'Буріння',
  'Геологія',
  'Ціни',
  'Вода',
  'Облаштування',
  'Ремонт',
  'Обслуговування',
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function normalize(value: string) {
  return value.toLocaleLowerCase('uk-UA').trim();
}

export function BlogArticleLibrary({ articles }: { articles: BlogLibraryArticle[] }) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Усі матеріали');
  const [query, setQuery] = useState('');

  const filteredArticles = useMemo(() => {
    const normalizedQuery = normalize(query);

    return articles.filter((article) => {
      const categoryMatches = category === 'Усі матеріали' || article.category === category;
      if (!categoryMatches) return false;
      if (!normalizedQuery) return true;

      return normalize(`${article.title} ${article.excerpt} ${article.category}`).includes(normalizedQuery);
    });
  }, [articles, category, query]);

  return (
    <section className="blog-page__list blog-kb__library" aria-label="Бібліотека матеріалів">
      <div className="blog-page__shell">
        <div className="blog-kb__filterbar">
          <div className="blog-kb__tabs" aria-label="Категорії блогу">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                className={category === item ? 'is-active' : undefined}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <label className="blog-kb__search">
            <SearchIcon />
            <span className="sr-only">Пошук статей</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Пошук статей..."
              autoComplete="off"
            />
          </label>
        </div>

        {filteredArticles.length > 0 ? (
          <div className="blog-page__grid">
            {filteredArticles.map((article, index) => (
              <article className="blog-index-card" key={article.slug}>
                <Link href={`/blog/${article.slug}`} className="blog-index-card__media" aria-label={article.title}>
                  <Image
                    src={article.image}
                    alt={article.imageAlt}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw"
                    quality={82}
                  />
                  <span>{String(index + 1).padStart(2, '0')}</span>
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
        ) : (
          <div className="blog-kb__empty">
            <strong>Нічого не знайдено</strong>
            <p>Спробуйте інший запит або виберіть іншу категорію.</p>
          </div>
        )}
      </div>
    </section>
  );
}
