/** Minimal className joiner. Deliberately not clsx — one fewer dependency. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
