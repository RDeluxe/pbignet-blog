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
