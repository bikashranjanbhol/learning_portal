#!/usr/bin/env bash
#
# Guard for CLAUDE.md #2.
#
# Calling cookies(), headers() or reading searchParams inside a content or
# marketing page opts the whole route into dynamic rendering. There is no build
# error and no warning — the only symptom is `ƒ` instead of `○` in the build
# output, and, months later, traffic that never arrived.
#
# This checks *imports*, because that is how it actually happens: someone reuses
# lib/supabase/server.ts (which calls cookies()) in a chapter page. Grepping for
# the call itself matches prose in comments and docs; grepping for the import
# does not.
#
# Not a substitute for reading the route table after `npm run build`. It catches
# the common case cheaply enough to run on every push.
#
#   npm run verify:static
#   npm run verify:static -- --self-test    # proves the guard actually fires
#
set -uo pipefail

# Note: not named GROUPS. That is a bash built-in array of the caller's group
# IDs, and assigning to it silently does nothing.
ROUTE_GROUPS=("app/(content)" "app/(marketing)")

FAILED=0

RE_NEXT_HEADERS="from ['\"]next/headers['\"]"
RE_SERVER_CLIENT="from ['\"](@/lib/supabase/server|[./]+lib/supabase/server)['\"]"
RE_SEARCH_PARAMS="^[[:space:]]*searchParams[?]?:"

MSG_NEXT_HEADERS="imports next/headers (cookies/headers), which forces dynamic rendering"
MSG_SERVER_CLIENT="imports lib/supabase/server, which calls cookies(). Use lib/hooks/use-user.ts in a client component instead"
MSG_SEARCH_PARAMS="takes searchParams as a page prop, which forces dynamic rendering"

# find_in <group> <regex> [page-only]
find_in() {
  local group=$1 regex=$2 page_only=${3:-}
  if [ -n "$page_only" ]; then
    grep -rnE --include='page.tsx' -- "$regex" "$group" 2>/dev/null
  else
    grep -rnE --include='*.ts' --include='*.tsx' -- "$regex" "$group" 2>/dev/null
  fi
}

report() {
  local matches=$1 explanation=$2 line location lineno rest
  [ -z "$matches" ] && return 0

  while IFS= read -r line; do
    [ -n "$line" ] || continue
    location=${line%%:*}
    rest=${line#*:}
    lineno=${rest%%:*}
    echo "::error file=${location},line=${lineno}::${explanation}"
    echo "  ${location}:${lineno} — ${explanation}" >&2
  done <<<"$matches"

  FAILED=1
}

run_checks() {
  local group
  for group in "${ROUTE_GROUPS[@]}"; do
    [ -d "$group" ] || continue
    report "$(find_in "$group" "$RE_NEXT_HEADERS")" "$MSG_NEXT_HEADERS"
    report "$(find_in "$group" "$RE_SERVER_CLIENT")" "$MSG_SERVER_CLIENT"
    report "$(find_in "$group" "$RE_SEARCH_PARAMS" page)" "$MSG_SEARCH_PARAMS"
  done
}

# ---------------------------------------------------------------------------
# Self-test — plants each violation and confirms the guard rejects it.
# A guard that has quietly stopped working is worse than no guard.
# ---------------------------------------------------------------------------
if [ "${1:-}" = "--self-test" ]; then
  a="app/(marketing)/__guard_selftest"
  b="app/(content)/__guard_selftest"
  mkdir -p "$a" "$b"
  printf "import { cookies } from 'next/headers';\n" >"$a/a.ts"
  printf "import { createClient } from '@/lib/supabase/server';\n" >"$b/b.tsx"
  printf 'export default function P({\n  searchParams,\n}: {\n  searchParams: Promise<Record<string, string>>;\n}) {\n  return null;\n}\n' >"$b/page.tsx"

  fired=0
  [ -n "$(find_in "app/(marketing)" "$RE_NEXT_HEADERS")" ] && fired=$((fired + 1))
  [ -n "$(find_in "app/(content)" "$RE_SERVER_CLIENT")" ] && fired=$((fired + 1))
  [ -n "$(find_in "app/(content)" "$RE_SEARCH_PARAMS" page)" ] && fired=$((fired + 1))

  rm -rf "$a" "$b"

  if [ "$fired" -lt 3 ]; then
    echo "SELF-TEST FAILED: only $fired/3 rules fired. This guard is not protecting anything." >&2
    exit 2
  fi
  echo "Self-test passed: all 3 rules fired."
  exit 0
fi

run_checks

if [ "$FAILED" -eq 0 ]; then
  echo "OK — no dynamic-rendering imports in statically generated route groups."
  exit 0
fi

echo >&2
echo "  These routes will render per request instead of being served from the CDN." >&2
echo "  Confirm with: npm run build  (content routes must show ○ or ●, never ƒ)" >&2
exit 1
