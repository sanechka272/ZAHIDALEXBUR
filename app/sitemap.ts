import type { MetadataRoute } from 'next';
import { blogArticles } from '@/lib/blog-data';

const SITE_URL = 'https://zahidalexbur.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogArticles.map((article) => ({
      url: `${SITE_URL}/blog/${article.slug}`,
      changeFrequency: 'monthly' as const,
      priority: article.featured ? 0.8 : 0.7,
    })),
  ];
}
