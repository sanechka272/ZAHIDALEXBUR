import { coreBlogArticles } from './blog-core';
import { blogWave1Articles } from './blog-wave1';
import { blogWave2ProblemArticles } from './blog-wave2-problems';
import { blogWave2WaterArticles } from './blog-wave2-water';
import { blogWave3Articles } from './blog-wave3-maintenance';

export type BlogSectionBlock = {
  heading: string;
  body: string;
};

export type BlogFaqItem = {
  question: string;
  answer: string;
};

export type BlogChecklist = {
  title: string;
  items: string[];
};

export type BlogSource = {
  label: string;
  href: string;
};

export type BlogArticle = {
  slug: string;
  tag: string;
  category: 'ГЕОЛОГІЯ' | 'БУРІННЯ' | 'ОБЛАШТУВАННЯ' | 'ВОДА' | 'ЦІНИ' | 'ПОРАДИ' | 'РЕМОНТ';
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  readTime: string;
  intro: string;
  sections: BlogSectionBlock[];
  relatedSlugs: string[];
  location?: string;
  featured?: boolean;
  keywords?: string[];
  publishedAt?: string;
  publishedLabel?: string;
  updatedAt?: string;
  faq?: BlogFaqItem[];
  checklist?: BlogChecklist;
  quickAnswer?: string;
  sources?: BlogSource[];
};

export const blogArticles: BlogArticle[] = [
  ...coreBlogArticles,
  ...blogWave2ProblemArticles,
  ...blogWave2WaterArticles,
  ...blogWave3Articles,
  ...blogWave1Articles,
];

export const featuredBlogArticle = blogArticles.find((article) => article.featured) ?? blogArticles[0];
export const landingBlogArticles = blogArticles.filter((article) => !article.featured).slice(0, 6);

export function getBlogReadTime(article: BlogArticle) {
  const text = [
    article.intro,
    article.quickAnswer ?? '',
    ...article.sections.map((section) => `${section.heading} ${section.body}`),
    ...(article.faq ?? []).map((item) => `${item.question} ${item.answer}`),
  ].join(' ');

  const words = text
    .replace(/[^\p{L}\p{N}’'-]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(2, Math.ceil(words / 180));
  return `${minutes} хв читання`;
}

export function getBlogArticle(slug: string) {
  return blogArticles.find((article) => article.slug === slug);
}

export function getRelatedBlogArticles(article: BlogArticle) {
  return article.relatedSlugs
    .map((slug) => getBlogArticle(slug))
    .filter((candidate): candidate is BlogArticle => Boolean(candidate));
}
