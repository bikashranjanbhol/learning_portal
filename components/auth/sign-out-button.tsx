/**
 * Sign-out as a plain form POST.
 *
 * No "use client" and no JavaScript required — the form works before hydration
 * and cannot be triggered by a cross-site GET.
 */
export function SignOutButton() {
  return (
    <form action="/auth/sign-out" method="post">
      <button
        type="submit"
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
      >
        Sign out
      </button>
    </form>
  );
}
