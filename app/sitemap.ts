import type { MetadataRoute } from 'next';
import { getBlogPosts, getCourses } from '@/lib/content';
import { absoluteUrl } from '@/lib/seo/schema';

/**
 * Sitemap, generated from the actual content on disk (CLAUDE.md #10 — code,
 * not a static file, so it cannot go stale when a chapter is added).
 *
 * On "split by section": the sprint brief asks for it, and this is organised by
 * section but emitted as ONE file. Splitting is worth doing above ~50,000 URLs,
 * Google's per-sitemap limit; this site has tens. Doing it now would also
 * require hand-writing a sitemap index, because Next's generateSitemaps()
 * produces the parts but not the index that points at them — a second thing to
 * keep correct for no benefit at this size.
 *
 * The section structure below is preserved so splitting later is a small edit:
 * each block becomes its own entry in generateSitemaps().
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, posts] = await Promise.all([getCourses(), getBlogPosts()]);
  const now = new Date();

  // --- Marketing -----------------------------------------------------------
  // Deliberately excluded: /sign-in and /dashboard are noindex, and listing a
  // noindex URL in a sitemap is a Search Console warning.
  const marketing: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: absoluteUrl('/pricing'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // --- Course indexes ------------------------------------------------------
  const courseIndex: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/courses'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...courses.map((course) => ({
      url: absoluteUrl(`/courses/${course.frontmatter.slug}`),
      // Newest chapter's date, so the entry updates when the course does.
      lastModified: latestDate(
        course.chapters.map((c) => c.frontmatter.updatedAt ?? c.frontmatter.publishedAt),
      ),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];

  // --- Chapters ------------------------------------------------------------
  // Free chapters rank slightly higher: they are the acquisition surface, and
  // priority is a relative hint about which URLs matter most on this site.
  const chapters: MetadataRoute.Sitemap = courses.flatMap((course) =>
    course.chapters.map((chapter) => ({
      url: absoluteUrl(`/learn/${course.frontmatter.slug}/${chapter.frontmatter.slug}`),
      lastModified: new Date(chapter.frontmatter.updatedAt ?? chapter.frontmatter.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: chapter.frontmatter.isFree ? 0.8 : 0.6,
    })),
  );

  // --- Blog ----------------------------------------------------------------
  const blog: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/blog'),
      lastModified: posts[0] ? new Date(posts[0].frontmatter.publishedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.frontmatter.slug}`),
      lastModified: new Date(post.frontmatter.updatedAt ?? post.frontmatter.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  return [...marketing, ...courseIndex, ...chapters, ...blog];
}

function latestDate(dates: string[]): Date {
  const times = dates.map((d) => new Date(d).getTime()).filter((t) => !Number.isNaN(t));
  return times.length > 0 ? new Date(Math.max(...times)) : new Date();
}
