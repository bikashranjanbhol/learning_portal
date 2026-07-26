import 'server-only';

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type {
  BlogFrontmatter,
  BlogPost,
  Chapter,
  ChapterFrontmatter,
  ChapterRef,
  Course,
  CourseFrontmatter,
  TocEntry,
} from './types';

/**
 * Filesystem-backed content loader.
 *
 * Deliberately reads from disk rather than the database. MDX is committed to
 * git and is the source of truth for prose (CLAUDE.md: "no external CMS"), so
 * everything here runs at build time inside generateStaticParams and the page
 * body. Nothing in this module touches cookies, headers or the request — that
 * is what keeps content routes statically generated.
 *
 * The `chapters` table indexes the same files for ordering and gating; it does
 * not store the prose.
 */

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const COURSES_ROOT = path.join(CONTENT_ROOT, 'courses');
const BLOG_ROOT = path.join(CONTENT_ROOT, 'blog');

/** Average adult reading speed for technical prose, rounded down deliberately. */
const WORDS_PER_MINUTE = 200;

// ---------------------------------------------------------------------------
// Caching
//
// Next dedupes fetch() but not fs reads, and a chapter page asks for the course
// index several times (sidebar, prev/next, breadcrumbs). Without this the same
// directory gets walked repeatedly while building hundreds of pages.
//
// Disabled in development, and that is not an optimisation detail — the dev
// server is one long-lived process, so a module-scope cache would survive every
// hot reload. Adding a new .mdx file or editing frontmatter would appear to do
// nothing until you restarted `npm run dev`, which makes writing miserable and
// looks like the loader is broken.
//
// In production this only ever populates during `next build`, where the content
// on disk cannot change mid-build, so it is always correct.
// ---------------------------------------------------------------------------

const CACHE_ENABLED = process.env.NODE_ENV === 'production';

let courseCache: Map<string, Course> | undefined;
let blogCache: BlogPost[] | undefined;

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function estimateReadingTime(body: string): number {
  // Strip code fences before counting: nobody reads a 60-line snippet at prose
  // speed, and including them inflates the estimate enough to look wrong.
  const prose = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  const words = prose.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * GitHub-style slug, matching what rehype-slug generates.
 *
 * The TOC is built from the raw markdown while rehype-slug works on the parsed
 * tree, so the two have to agree independently. If a heading link ever fails to
 * scroll, this is the first place to look.
 */
function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

/**
 * Extract h2/h3 headings for the table of contents.
 *
 * h1 is excluded — the page title is rendered from frontmatter, and a chapter
 * should have exactly one h1. h4+ is excluded because a four-level TOC is
 * unreadable on mobile.
 */
function extractToc(body: string): TocEntry[] {
  const withoutCode = body.replace(/```[\s\S]*?```/g, '');
  const entries: TocEntry[] = [];
  const seen = new Map<string, number>();

  for (const line of withoutCode.split('\n')) {
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const hashes = match[1];
    const rawText = match[2];
    if (!hashes || !rawText) continue;

    // Strip inline markdown so "`useState` and **state**" reads as plain text.
    const text = rawText
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

    const base = slugifyHeading(text);
    // rehype-slug appends -1, -2 … to duplicates; mirror that.
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count}`;

    entries.push({ id, text, depth: hashes.length === 2 ? 2 : 3 });
  }

  return entries;
}

/**
 * Split a chapter into the free preview and the gated remainder.
 *
 * CLAUDE.md #8: every gated page needs a genuine free preview — intro,
 * headings, first example. A page that is entirely gated ranks poorly no matter
 * how correct the structured data is.
 *
 * Authors control the split with an explicit marker:
 *
 *     <!-- paywall -->
 *
 * Without one, the split falls before the SECOND h2, which yields the intro
 * plus one complete section. That default is deliberately generous: erring
 * towards too much preview costs a little revenue, erring towards too little
 * costs the ranking that brings the reader in the first place.
 */
export function splitAtPaywall(body: string): { preview: string; premium: string } {
  const marker = /^[ \t]*<!--\s*paywall\s*-->[ \t]*$/m.exec(body);
  if (marker?.index !== undefined) {
    return {
      preview: body.slice(0, marker.index).trimEnd(),
      premium: body.slice(marker.index + marker[0].length).trimStart(),
    };
  }

  // Fall back to the second h2, ignoring headings inside fenced code.
  const withoutCode = body.replace(/```[\s\S]*?```/g, (block) => '\n'.repeat(block.length));
  const headings = [...withoutCode.matchAll(/^##[ \t]+/gm)];
  const second = headings[1];

  if (second?.index === undefined) {
    // Nothing to split on — one short section. Treat it all as preview rather
    // than gating a chapter with no visible content.
    return { preview: body, premium: '' };
  }

  return {
    preview: body.slice(0, second.index).trimEnd(),
    premium: body.slice(second.index).trimStart(),
  };
}

async function readMdxFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
      .map((entry) => entry.name)
      .sort();
  } catch {
    // A missing directory means "no content yet", not a crash. Keeps the site
    // building before the first blog post exists.
    return [];
  }
}

function isPublished(publishedAt: string | undefined): boolean {
  if (!publishedAt) return false;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return false;
  // Drafts are dated in the future. They build locally but never ship.
  return date.getTime() <= Date.now() || process.env.NODE_ENV === 'development';
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

async function loadCourse(courseSlug: string): Promise<Course | null> {
  const courseDir = path.join(COURSES_ROOT, courseSlug);

  let meta: CourseFrontmatter;
  try {
    const raw = await readFile(path.join(courseDir, 'course.json'), 'utf8');
    meta = JSON.parse(raw) as CourseFrontmatter;
  } catch {
    return null;
  }

  const filenames = await readMdxFiles(courseDir);

  const chapters: Chapter[] = [];
  for (const filename of filenames) {
    const fullPath = path.join(courseDir, filename);
    const source = await readFile(fullPath, 'utf8');
    const { data, content } = matter(source);
    const frontmatter = data as ChapterFrontmatter;

    if (!isPublished(frontmatter.publishedAt)) continue;

    chapters.push({
      frontmatter,
      courseSlug,
      mdxPath: path.relative(CONTENT_ROOT, fullPath),
      body: content,
      toc: extractToc(content),
      readingTime: frontmatter.readingTime ?? estimateReadingTime(content),
    });
  }

  chapters.sort((a, b) => a.frontmatter.order - b.frontmatter.order);

  return { frontmatter: meta, chapters };
}

async function loadAllCourses(): Promise<Map<string, Course>> {
  if (CACHE_ENABLED && courseCache) return courseCache;

  const cache = new Map<string, Course>();

  let dirs: string[] = [];
  try {
    const entries = await readdir(COURSES_ROOT, { withFileTypes: true });
    dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    dirs = [];
  }

  for (const dir of dirs) {
    const course = await loadCourse(dir);
    if (course && course.chapters.length > 0) cache.set(dir, course);
  }

  courseCache = cache;
  return cache;
}

export async function getCourses(): Promise<Course[]> {
  const cache = await loadAllCourses();
  return [...cache.values()].sort((a, b) => a.frontmatter.order - b.frontmatter.order);
}

export async function getCourse(slug: string): Promise<Course | undefined> {
  const cache = await loadAllCourses();
  return cache.get(slug);
}

export async function getChapter(
  courseSlug: string,
  chapterSlug: string,
): Promise<Chapter | undefined> {
  const course = await getCourse(courseSlug);
  return course?.chapters.find((chapter) => chapter.frontmatter.slug === chapterSlug);
}

/** Lightweight chapter list for sidebars — no MDX bodies. */
export function toChapterRefs(course: Course): ChapterRef[] {
  return course.chapters.map((chapter) => ({
    slug: chapter.frontmatter.slug,
    title: chapter.frontmatter.title,
    order: chapter.frontmatter.order,
    isFree: chapter.frontmatter.isFree,
    readingTime: chapter.readingTime,
  }));
}

export type ChapterNeighbours = {
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

export function getChapterNeighbours(course: Course, chapterSlug: string): ChapterNeighbours {
  const index = course.chapters.findIndex((c) => c.frontmatter.slug === chapterSlug);
  if (index === -1) return { previous: null, next: null };

  const previous = index > 0 ? course.chapters[index - 1] : undefined;
  const next = index < course.chapters.length - 1 ? course.chapters[index + 1] : undefined;

  return {
    previous: previous
      ? { slug: previous.frontmatter.slug, title: previous.frontmatter.title }
      : null,
    next: next ? { slug: next.frontmatter.slug, title: next.frontmatter.title } : null,
  };
}

/** Every course/chapter pair, for generateStaticParams. */
export async function getAllChapterParams(): Promise<
  Array<{ course: string; chapter: string }>
> {
  const courses = await getCourses();
  return courses.flatMap((course) =>
    course.chapters.map((chapter) => ({
      course: course.frontmatter.slug,
      chapter: chapter.frontmatter.slug,
    })),
  );
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (CACHE_ENABLED && blogCache) return blogCache;

  const filenames = await readMdxFiles(BLOG_ROOT);
  const posts: BlogPost[] = [];

  for (const filename of filenames) {
    const fullPath = path.join(BLOG_ROOT, filename);
    const source = await readFile(fullPath, 'utf8');
    const { data, content } = matter(source);
    const frontmatter = data as BlogFrontmatter;

    if (!isPublished(frontmatter.publishedAt)) continue;

    posts.push({
      frontmatter,
      mdxPath: path.relative(CONTENT_ROOT, fullPath),
      body: content,
      toc: extractToc(content),
      readingTime: frontmatter.readingTime ?? estimateReadingTime(content),
    });
  }

  posts.sort(
    (a, b) =>
      new Date(b.frontmatter.publishedAt).getTime() -
      new Date(a.frontmatter.publishedAt).getTime(),
  );

  blogCache = posts;
  return posts;
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  const posts = await getBlogPosts();
  return posts.find((post) => post.frontmatter.slug === slug);
}

export async function getAllBlogParams(): Promise<Array<{ slug: string }>> {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.frontmatter.slug }));
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Fixed UTC locale so the server and client agree — a mismatch here is a hydration error. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
