/**
 * Display helpers for the eSIM usage / countdown row.
 *
 * The provider reports usage with byte-level precision but we previously
 * rounded the remaining MB up to the nearest 0.1 GB, which made a bundle
 * with 974 MB left display as "1.0 GB left" — indistinguishable from a
 * fresh bundle. These helpers prefer the precise unit (MB) when the
 * remaining is small, and surface hours when there's less than a full day
 * left so the user's number matches the provider's countdown exactly.
 */

/** "974 MB left" / "0.9 GB left" / "12.5 GB left" depending on magnitude. */
export function formatRemainingData(remainingMb: number, unlimited?: boolean): string {
  if (unlimited) return 'Unlimited';
  const mb = Math.max(0, Math.floor(remainingMb));
  if (mb < 1024) return `${mb} MB left`;
  // Floor to 1 decimal so a 974 MB row never reads as "1.0 GB left".
  const gb = Math.floor((mb / 1024) * 10) / 10;
  return `${gb.toFixed(1)} GB left`;
}

/** "6 days 14h left" / "12 hours left" / "27 min left" — matches the
 *  granularity the eSIM Access dashboard shows the provider operator. */
export function formatTimeRemaining(hoursLeft: number): string {
  const minutes = Math.max(0, Math.floor(hoursLeft * 60));
  if (minutes <= 0) return 'Expired';
  if (minutes < 60) return `${minutes} min left`;
  const totalHours = Math.floor(minutes / 60);
  if (totalHours < 24) return `${totalHours} ${totalHours === 1 ? 'hour' : 'hours'} left`;
  const days = Math.floor(totalHours / 24);
  const hoursRem = totalHours - days * 24;
  if (hoursRem === 0) return `${days} ${days === 1 ? 'day' : 'days'} left`;
  return `${days}d ${hoursRem}h left`;
}
