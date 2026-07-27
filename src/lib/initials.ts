// How a person is labelled when they have not chosen a name yet.
//
// Sign-up asks for a phone number and nothing else, so `name` starts EMPTY and
// stays that way until the user edits it in Profile. Every screen that shows a
// person must therefore fall back to their phone number — and must do it the same
// way, which is why the rule lives here rather than in each screen.

/** "Jane Doe" → "JD" — avatar initials from the first letter of the first
 *  two words. Extra whitespace yields no letter for that word (never throws). */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
}

/** What to show wherever a person's name would appear.
 *
 *  Returns the name once set, otherwise the phone number ("+9647501234567"), so a
 *  brand-new account reads as "Hello +9647501234567" instead of an empty space. */
export function displayName(name: string | null | undefined, phone: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  if (trimmed) return trimmed;
  return (phone ?? '').trim();
}

/** Avatar initials, falling back to the last two digits of the phone when there
 *  is no name — a blank circle reads as broken, and "TU" would be a lie. */
export function displayInitials(name: string | null | undefined, phone: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.slice(-2) || '#';
}
