import type { APIContext } from 'astro'
import rss from '@astrojs/rss'
import { getWorks } from '../lib/posts'

/**
 * The feed of the published posts, at a stable path: `/rss.xml`. Ghost's `/rss/` and
 * `/feed/` redirect here (redirects/redirects.map), so existing subscribers keep it.
 * One item per work: a translated pair gives its English version (lib/posts.ts, getWorks).
 */
export async function GET(context: APIContext) {
  const posts = (await getWorks()).map(({ versions }) => versions[0])
  return rss({
    title: 'exhale — Pierrick Bignet',
    description: 'Short essays and field notes by Pierrick Bignet.',
    site: context.site!,
    items: posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/writing/${post.id}/`,
      categories: [post.data.tag, ...post.data.tags],
      customData: `<language>${post.data.lang}</language>`,
    })),
    customData: '<language>en</language>',
  })
}
