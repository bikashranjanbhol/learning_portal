import Image, { type ImageProps } from 'next/image';
import Link from 'next/link';
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { CodeBlock } from './code-block';
import { Callout } from './callout';
import { Animation } from '@/components/animations/animation';
import { Playground } from '@/components/playground/playground';

/**
 * Element map handed to next-mdx-remote.
 *
 * Everything here is a server component except CodeBlock, which needs a click
 * handler for the copy button.
 */

type HeadingProps = HTMLAttributes<HTMLHeadingElement>;

/**
 * Headings with a hover anchor link.
 *
 * rehype-slug has already put an `id` on the element by the time this renders,
 * so the anchor just reuses it.
 */
function heading(Tag: 'h2' | 'h3' | 'h4', className: string) {
  const Heading = ({ id, children, ...props }: HeadingProps) => (
    <Tag id={id} className={`group scroll-mt-24 ${className}`} {...props}>
      {children}
      {id ? (
        <a
          href={`#${id}`}
          aria-label="Link to this section"
          className="ml-2 text-[var(--fg-muted)] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          #
        </a>
      ) : null}
    </Tag>
  );
  Heading.displayName = `Mdx${Tag.toUpperCase()}`;
  return Heading;
}

/**
 * Images.
 *
 * width and height are required (CLAUDE.md #16) — without them the browser
 * cannot reserve space and the page reflows as each image loads, which is the
 * single easiest way to blow the CLS budget on an image-heavy chapter.
 */
function MdxImage(props: ImageProps) {
  return (
    <span className="my-8 block">
      <Image
        {...props}
        alt={props.alt}
        className={`rounded-lg border border-[var(--border)] ${props.className ?? ''}`}
        sizes="(max-width: 768px) 100vw, 720px"
      />
    </span>
  );
}

/** Internal links prefetch via next/link; external ones get rel="noopener". */
function MdxLink({ href = '', children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isInternal = href.startsWith('/') || href.startsWith('#');

  if (isInternal) {
    return (
      <Link
        href={href}
        className="font-medium text-[var(--accent)] underline underline-offset-2"
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[var(--accent)] underline underline-offset-2"
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * rehype-pretty-code emits <pre data-language="ts"><code>…</code></pre>.
 * Lift the language onto CodeBlock so it can be shown in the corner.
 */
function Pre({
  children,
  ...props
}: HTMLAttributes<HTMLPreElement> & { 'data-language'?: string }) {
  return (
    <CodeBlock
      language={props['data-language']}
      className="overflow-x-auto rounded-lg border border-[var(--border)] py-4 pt-9 text-sm leading-relaxed [&_[data-line]]:px-4 [&>code]:grid [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    >
      {children}
    </CodeBlock>
  );
}

/** Inline code only — block code arrives already wrapped in <pre>. */
function InlineCode({ children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <code
      className="rounded border border-[var(--border)] bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-[0.875em]"
      {...props}
    >
      {children}
    </code>
  );
}

export const mdxComponents = {
  h2: heading('h2', 'mt-12 mb-4 text-2xl font-semibold tracking-tight'),
  h3: heading('h3', 'mt-8 mb-3 text-xl font-semibold tracking-tight'),
  h4: heading('h4', 'mt-6 mb-2 text-lg font-semibold tracking-tight'),

  p: (props: HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-4 leading-7 text-pretty" {...props} />
  ),

  ul: (props: HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-4 ml-6 list-disc space-y-2 leading-7" {...props} />
  ),
  ol: (props: HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-4 ml-6 list-decimal space-y-2 leading-7" {...props} />
  ),

  blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-6 border-l-4 border-[var(--border)] pl-5 text-[var(--fg-muted)] italic"
      {...props}
    />
  ),

  hr: () => <hr className="my-10 border-[var(--border)]" />,

  // Tables come from remark-gfm. The wrapper scrolls instead of overflowing,
  // which on mobile is the difference between a usable table and a broken page.
  table: (props: HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props: HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-[var(--bg-subtle)]" {...props} />
  ),
  th: (props: HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border-b border-[var(--border)] px-4 py-2.5 text-left font-semibold"
      {...props}
    />
  ),
  td: (props: HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border-b border-[var(--border)] px-4 py-2.5 align-top" {...props} />
  ),

  pre: Pre,
  code: InlineCode,
  a: MdxLink,
  img: MdxImage as unknown as (props: HTMLAttributes<HTMLImageElement>) => ReactNode,

  // Available directly in MDX without an import.
  Callout,
  Image: MdxImage,
  Animation,
  Playground,
};
