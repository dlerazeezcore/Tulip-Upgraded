/** "Jane Doe" → "JD" — avatar initials from the first letter of the first
 *  two words. Extra whitespace yields no letter for that word (never throws). */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
}
