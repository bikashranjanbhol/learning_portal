/** Shapes shared by the MDX loader and the routes that render it. */

export type ChapterFrontmatter = {
  title: string;
  slug: string;
  description: string;
  order: number;
  isFree: boolean;
  publishedAt: string;
  updatedAt?: string;
  /** Override the computed estimate when it reads badly (heavy diagrams, etc). */
  readingTime?: number;
};

export type BlogFrontmatter = {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  tags?: string[];
  readingTime?: number;
};

export type CourseFrontmatter = {
  title: string;
  slug: string;
  description: string;
  order: number;
  isPremium: boolean;
  /** Short label for cards and breadcrumbs, e.g. "System design". */
  eyebrow?: string;
};

export type TocEntry = {
  /** Matches the `id` rehype-slug puts on the heading. */
  id: string;
  text: string;
  depth: 2 | 3;
};

export type Chapter = {
  frontmatter: ChapterFrontmatter;
  courseSlug: string;
  /** Path relative to /content, stored so it can be written to the chapters table. */
  mdxPath: string;
  body: string;
  toc: TocEntry[];
  readingTime: number;
};

export type BlogPost = {
  frontmatter: BlogFrontmatter;
  mdxPath: string;
  body: string;
  toc: TocEntry[];
  readingTime: number;
};

export type Course = {
  frontmatter: CourseFrontmatter;
  chapters: Chapter[];
};

/** Just enough of a chapter to render sidebars and prev/next without loading bodies. */
export type ChapterRef = {
  slug: string;
  title: string;
  order: number;
  isFree: boolean;
  readingTime: number;
};
