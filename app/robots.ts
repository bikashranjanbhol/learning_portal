import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/schema';

/**
 * robots.txt as code (CLAUDE.md #10).
 *
 * The AI crawler rules implement CLAUDE.md #11 and plan §11.4: allow GPTBot,
 * ClaudeBot and PerplexityBot on free content, disallow them on premium paths.
 *
 * The reasoning, since this is the kind of file people later change without
 * remembering why: blocking these crawlers entirely costs citations and
 * discovery in the answer engines that are now a material referral channel.
 * Allowing them everywhere hands over the paid course text, which is the
 * product. Free content is the acquisition surface and is meant to be quoted;
 * /learn/* is not.
 *
 * Note this is a policy signal, not an access control. Well-behaved crawlers
 * honour it. The paywall itself is enforced by session state in Sprint 3.
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ['/api/', '/dashboard/', '/notebook/', '/settings/', '/auth/'];

  return {
    rules: [
      {
        // Search engines: everything public. /learn/* is included on purpose —
        // Google must crawl gated chapters to index the free preview, and the
        // paywall JSON-LD is what tells it the rest is behind a gate. Blocking
        // it here would make the chapters invisible in search entirely.
        userAgent: '*',
        allow: '/',
        disallow: [...privatePaths, '/sign-in'],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended'],
        allow: ['/', '/blog/', '/courses/'],
        // Premium chapter bodies are the product. Search engines may index
        // them; answer engines may not reproduce them.
        disallow: [...privatePaths, '/sign-in', '/learn/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/').replace(/\/$/, ''),
  };
}
