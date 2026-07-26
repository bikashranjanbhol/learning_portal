import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDate, getBlogPosts } from '@/lib/content';
import { site } from '@/lib/site';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: 'Blog',
  description: `Writing on system design, interview preparation and building ${site.name}.`,
  pathname: '/blog',
  eyebrow: 'Blog',
});

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
      <p className="mt-4 text-lg text-pretty text-[var(--fg-muted)]">
        Notes on system design, interview preparation, and the mechanics of building this site.
      </p>

      {posts.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--fg-muted)]">
          No posts yet. Add an <code>.mdx</code> file under <code>content/blog/</code>.
        </p>
      ) : (
        <ul className="mt-12 space-y-10">
          {posts.map((post) => (
            <li key={post.frontmatter.slug}>
              <article>
                <h2 className="text-xl font-semibold tracking-tight">
                  <Link
                    href={`/blog/${post.frontmatter.slug}`}
                    className="transition-colors hover:text-[var(--accent)]"
                  >
                    {post.frontmatter.title}
                  </Link>
                </h2>
                <p className="mt-2 text-pretty text-[var(--fg-muted)]">
                  {post.frontmatter.description}
                </p>
                <p className="mt-3 flex items-center gap-3 text-sm text-[var(--fg-muted)]">
                  <time dateTime={post.frontmatter.publishedAt}>
                    {formatDate(post.frontmatter.publishedAt)}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>{post.readingTime} min read</span>
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
