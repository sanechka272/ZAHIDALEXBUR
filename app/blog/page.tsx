import Link from 'next/link';
import { blogArticles } from '@/lib/blog-data';
import { assets } from '@/lib/site-data';

export const dynamic = 'force-static';
export const revalidate = false;

export default function BlogIndexPage() {
  return (
    <main className="blog-page">
      <header className="blog-page__header">
        <div className="blog-page__shell blog-page__nav">
          <Link href="/" className="blog-page__brand"><img src={assets.logo} alt="ZAHIDALEXBUR" /></Link>
          <Link href="/#contact" className="blog-page__contact">Звʼязатися</Link>
        </div>
      </header>

      <section className="blog-page__hero">
        <div className="blog-page__shell">
          <span>БЛОГ ZAHIDALEXBUR</span>
          <h1>Корисно знати<br />до початку буріння</h1>
          <p>Практичні матеріали про планування, геологію, типи свердловин, вартість і процес робіт.</p>
        </div>
      </section>

      <section className="blog-page__list">
        <div className="blog-page__shell blog-page__grid">
          {blogArticles.map((article, index) => (
            <Link href={`/blog/${article.slug}`} className="blog-index-card" key={article.slug}>
              <div className="blog-index-card__media">
                <img src={article.image} alt={article.title} />
                <span>0{index + 1}</span>
              </div>
              <div className="blog-index-card__body">
                <div><span>{article.tag}</span><small>{article.readTime}</small></div>
                <h2>{article.title}</h2>
                <p>{article.excerpt}</p>
                <strong>Читати статтю →</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
