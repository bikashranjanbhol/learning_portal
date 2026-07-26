/**
 * Renders a JSON-LD <script> tag.
 *
 * The only place in the codebase that writes application/ld+json. Everything
 * else builds typed objects with lib/seo/schema.ts and passes them here
 * (CLAUDE.md #13).
 *
 * Server component: this is metadata for crawlers and adds nothing to the
 * client bundle.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify escapes quotes correctly, but `</script>` appearing
      // inside a string value would close the tag early. Escaping the forward
      // slash prevents that; the value is unchanged as far as a JSON parser is
      // concerned. Content here is author-controlled, but this file is the one
      // place untrusted text could ever reach raw HTML, so it does not rely on
      // that assumption.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
