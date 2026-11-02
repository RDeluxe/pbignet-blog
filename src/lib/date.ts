/**
 * Dates as the print furniture writes them. A frontmatter date is a day at UTC midnight,
 * so the UTC getters read the day that was written, whatever the build machine's zone.
 */

/** three letters for every month: `en-GB` writes « SEPT », which breaks the column */
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** « FEB 2026 » */
export function formatMonth(date: Date): string {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

/** « 22.01.24 », the metabar's day */
export function formatDay(date: Date): string {
  const two = (n: number) => String(n).padStart(2, '0')
  return `${two(date.getUTCDate())}.${two(date.getUTCMonth() + 1)}.${two(date.getUTCFullYear() % 100)}`
}
