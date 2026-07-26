# `(content)` route group

Reserved for Sprint 1. Non-route files inside `app/` are ignored by the router,
so this placeholder keeps the group in version control without creating a route.

Routes that will live here, with the rendering strategy fixed by CLAUDE.md §3:

| Route                          | Rendering        |
| ------------------------------ | ---------------- |
| `/learn/[course]/[chapter]`    | SSG + ISR 3600   |
| `/blog/[slug]`                 | SSG + ISR 3600   |
| `/practice/patterns/[pattern]` | SSG + ISR 21600  |
| `/compare/[slug]`              | SSG + ISR 604800 |

Two rules apply to everything in this group, and both fail silently rather than
loudly, which is what makes them worth writing down:

1. **No `cookies()`, `headers()` or `searchParams`** — including transitively,
   via any layout or shared component. One call opts the whole route into
   dynamic rendering with no build error. `lib/supabase/server.ts` calls
   `cookies()`; importing it here is the most likely way this breaks.
2. **Every page exports `generateStaticParams()` and `revalidate`.**

Per-user state (progress ticks, "continue reading", highlights) belongs in
client components that hydrate after load — see `lib/hooks/use-user.ts` for the
pattern.

Verify after every change to this group:

```bash
npm run build   # these routes must show ● SSG or ISR, never ƒ Dynamic
```
