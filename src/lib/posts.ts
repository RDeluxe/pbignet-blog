import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'

export type Post = CollectionEntry<'writing'>

/**
 * The published posts, newest first, each with its catalogue number.
 *
 * A draft (`draft: true`) stays in the repo but out of every list; its page is only built
 * by `pnpm dev`. The number counts from the OLDEST post, so it belongs to the post: a new
 * post takes the next number instead of shifting all the others (critique 2026-11-02, n° 31).
 */
export async function getPosts(): Promise<{ post: Post, number: string }[]> {
  const posts = (await getCollection('writing', p => !p.data.draft))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
  return posts.map((post, i) => ({ post, number: String(posts.length - i).padStart(3, '0') }))
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
