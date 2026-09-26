import assert from 'node:assert/strict';
import test from 'node:test';
import { blogArticles } from '../lib/blog-data';

function countWords(value: string) {
  return value
    .replace(/[^\p{L}\p{N}’'-]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function articleWordCount(article: (typeof blogArticles)[number]) {
  return countWords([
    article.intro,
    article.quickAnswer ?? '',
    ...article.sections.map((section) => section.body),
    ...(article.faq ?? []).map((item) => `${item.question} ${item.answer}`),
  ].join(' '));
}

test('blog content has unique slugs and valid internal links', () => {
  const slugs = blogArticles.map((article) => article.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'Blog article slugs must be unique');

  const knownSlugs = new Set(slugs);
  for (const article of blogArticles) {
    for (const relatedSlug of article.relatedSlugs) {
      assert.ok(
        knownSlugs.has(relatedSlug),
        `${article.slug} links to missing related article: ${relatedSlug}`,
      );
      assert.notEqual(relatedSlug, article.slug, `${article.slug} must not link to itself`);
    }
  }
});

test('blog articles pass the editorial quality floor', () => {
  for (const article of blogArticles) {
    const words = articleWordCount(article);

    assert.ok(words >= 180, `${article.slug} is too thin: ${words} words`);
    assert.ok(article.sections.length >= 4, `${article.slug} needs at least 4 substantive sections`);
    assert.ok(article.quickAnswer?.trim(), `${article.slug} needs a quick answer`);
    assert.ok((article.faq?.length ?? 0) >= 2, `${article.slug} needs at least 2 FAQ items`);
    assert.ok(article.relatedSlugs.length >= 3, `${article.slug} needs at least 3 related links`);

    assert.ok(article.metaTitle.length <= 65, `${article.slug} meta title is too long`);
    assert.ok(article.metaDescription.length <= 165, `${article.slug} meta description is too long`);
    assert.ok(article.metaDescription.length >= 90, `${article.slug} meta description is too short`);

    assert.ok(article.image.startsWith('/'), `${article.slug} image should be a local asset`);
    assert.ok(article.imageAlt.trim().length >= 20, `${article.slug} needs a descriptive image alt`);
    assert.ok(article.publishedAt, `${article.slug} needs an explicit published date`);
  }
});

test('blog sources are explicit https links when present', () => {
  for (const article of blogArticles) {
    for (const source of article.sources ?? []) {
      assert.match(source.href, /^https:\/\//, `${article.slug} has a non-HTTPS source`);
      assert.ok(source.label.trim().length >= 12, `${article.slug} has a weak source label`);
    }
  }
});
