import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatDate, getAllBlogParams, getBlogPost } from '@/lib/content';
import { Mdx } from '@/lib/content/mdx';
import { TableOfContents } from '@/components/content/table-of-contents';
import { ReadingProgress } from '@/components/content/reading-progress';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { buildMetadata, ogImageUrl } from '@/lib/seo/metadata';
import { graph, techArticle } from '@/lib/seo/schema';

/** SSG + ISR 3600, same as chapters (CLAUDE.md §3). */
export const revalidate = 3600;
export const dynamicParams = false;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getAllBlogParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};

  const { title, description, publishedAt, updatedAt, tags } = post.frontmatter;

  return buildMetadata({
    title,
    description,
    pathname: `/blog/${slug}`,
    publishedAt,
    updatedAt,
    keywords: tags,
    eyebrow: 'Blog',
  });
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const { title, description, publishedAt, updatedAt, tags } = post.frontmatter;
  const pathname = `/blog/${slug}`;

  // Blog posts are always free — this is the acquisition surface, so
  // isAccessibleForFree is true and no paywall markup is attached.
  const articleSchema = techArticle({
    headline: title,
    description,
    pathname,
    datePublished: publishedAt,
    dateModified: updatedAt,
    isAccessibleForFree: true,
    keywords: tags,
    readingTimeMinutes: post.readingTime,
    ogImage: ogImageUrl({ title, subtitle: description, eyebrow: 'Blog' }),
  });

  return (
    <>
      <JsonLd data={graph(articleSchema)} />
      <ReadingProgress />

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <article className="min-w-0">
          <Breadcrumbs
            trail={[
              { name: 'Blog', pathname: '/blog' },
              { name: title, pathname },
            ]}
          />

          <header className="mt-4 border-b border-[var(--border)] pb-8">
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-lg text-pretty text-[var(--fg-muted)]">{description}</p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--fg-muted)]">
              <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readingTime} min read</span>
              {updatedAt && updatedAt !== publishedAt ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Updated {formatDate(updatedAt)}</span>
                </>
              ) : null}
            </div>

            {tags && tags.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--fg-muted)]"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </header>

          <div className="mt-8 rounded-xl border border-[var(--border)] p-5 lg:hidden">
            <TableOfContents entries={post.toc} />
          </div>

          <div className="mt-2">
            <Mdx source={post.body} />
          </div>
        </article>

        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <TableOfContents entries={post.toc} />
        </aside>
      </div>
    </>
  );
}
