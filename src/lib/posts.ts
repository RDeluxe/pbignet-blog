import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'

export type Post = CollectionEntry<'writing'>

/** the reader's languages; the site chrome stays in English */
export type Lang = 'en' | 'fr'

/**
 * A work: one post, in one language or two. `versions[0]` is the one shown without a
 * language choice (English when there is one); a translated pair has two.
 */
export interface Work {
  number: string
  versions: Post[]
}

/**
 * The published works, newest first, each with its catalogue number.
 *
 * A post and its translation (`translation:` on both sides, written by the import) make one
 * work: one row in a list, one number, one feed item. The list shows the reader's language
 * (`html[data-lang]`, base.css); a post in one language only shows as it is.
 *
 * A draft (`draft: true`) stays in the repo but out of every list; its page is only built
 * by `pnpm dev`. The number counts from the OLDEST work, so it belongs to the work: a new
 * post takes the next number instead of shifting all the others (critique 2026-11-02, n° 31).
 */
export async function getWorks(): Promise<Work[]> {
  const posts = await getCollection('writing', p => !p.data.draft)
  const byId = new Map(posts.map(p => [p.id, p]))
  const seen = new Set<string>()
  const works: Post[][] = []
  for (const post of posts) {
    if (seen.has(post.id))
      continue
    const other = post.data.translation ? byId.get(post.data.translation) : undefined
    const versions = other ? [post, other] : [post]
    versions.sort((a, b) => (a.data.lang === 'en' ? -1 : b.data.lang === 'en' ? 1 : 0))
    versions.forEach(v => seen.add(v.id))
    works.push(versions)
  }
  // a work dates from its first version
  const date = (w: Post[]): number => Math.min(...w.map(v => v.data.pubDate.getTime()))
  works.sort((a, b) => date(b) - date(a))
  return works.map((versions, i) => ({ number: String(works.length - i).padStart(3, '0'), versions }))
}

/**
 * Does the post open on a paragraph of its own text? The drop cap goes there and nowhere
 * else: not on a callout, a quote, a heading or an image, and not on an editor's note set
 * in italic, which a Roman capital would contradict (critique 2026-11-02, n° 8).
 */
export function opensOnText(body: string | undefined): boolean {
  const first = (body ?? '').trim().split(/\n\s*\n/)[0]?.trim() ?? ''
  if (!first || /^(?:\{%|[>#|]|!\[|[-*+] |\d+\. |```)/.test(first))
    return false
  // a paragraph in italic from end to end: *…* or _…_, not **bold**
  return !/^([*_])(?!\1)[\s\S]*[^*_]\1[.!?…]?$/.test(first)
}
