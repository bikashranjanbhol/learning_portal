import 'server-only';

import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode, { type Options as PrettyCodeOptions } from 'rehype-pretty-code';
import { mdxComponents } from '@/components/mdx/mdx-components';

/**
 * Shiki runs at build time and emits inline CSS variables for both themes.
 * The `.dark` class then picks the dark set, so switching theme is a class
 * toggle rather than a re-highlight — no flash, no client-side highlighter.
 */
const prettyCodeOptions: PrettyCodeOptions = {
  theme: { light: 'github-light', dark: 'github-dark-dimmed' },
  defaultLang: 'plaintext',
  keepBackground: false,

  // Shiki drops empty lines, which collapses blank lines inside a snippet.
  onVisitLine(node) {
    if (node.children.length === 0) {
      node.children = [{ type: 'text', value: ' ' }];
    }
  },
  onVisitHighlightedLine(node) {
    node.properties.className = [...(node.properties.className ?? []), 'line--highlighted'];
  },
};

/**
 * Renders an MDX body as a server component.
 *
 * All three plugins are compile-time. Nothing here adds to the client bundle,
 * which is what lets a chapter page ship almost no JavaScript despite the
 * syntax highlighting and tables.
 */
export function Mdx({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={mdxComponents}
      options={{
        /**
         * next-mdx-remote v6 defaults to `blockJS: true`, which installs a
         * remark plugin that strips EVERY JSX attribute expression:
         *
         *   <Image width={1600} />   ->   <Image />        // width is gone
         *   <Image width="1600" />   ->   <Image width="1600" />
         *
         * It fails silently. The component renders, the string props arrive,
         * and the numeric ones are simply missing — which showed up here as
         * next/image emitting no width/height, i.e. an unreserved image box and
         * a CLS regression, from MDX that looked completely correct.
         *
         * That default is aimed at untrusted, user-submitted MDX. Our content is
         * first-party and committed to git, so the threat it defends against
         * does not exist here, while the cost — silently dropped props in every
         * chapter — is real.
         *
         * `blockDangerousJS` stays at its default of true, so eval/fetch-style
         * calls in an expression are still rejected. If this repo ever renders
         * MDX submitted by a user, set blockJS back to true and require string
         * attributes.
         */
        blockJS: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
        },
      }}
    />
  );
}
