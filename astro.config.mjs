// @ts-check
import { readdirSync, readFileSync, rmSync } from 'node:fs'
import process from 'node:process'
import markdoc from '@astrojs/markdoc'
import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
import { defineConfig } from 'astro/config'

/**
 * Translated pairs, for the sitemap's hreflang links: `translation:` in the posts'
 * frontmatter (written by scripts/vault-to-post.ts). Read from the files, the config has no
 * content collections. Slug → [{ lang, slug }] of the whole pair.
 */
function translatedPairs() {
  const dir = new URL('./src/content/writing/', import.meta.url)
  /** @type {Map<string, { lang: string, translation?: string }>} */
  const posts = new Map()
  for (const file of readdirSync(dir).filter(f => /\.mdoc?$/.test(f))) {
    const fm = readFileSync(new URL(file, dir), 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
    const field = (/** @type {string} */ k) => fm.match(new RegExp(`^${k}: *(\\S+)`, 'm'))?.[1]
    posts.set(file.replace(/\.mdoc?$/, ''), { lang: field('lang') ?? 'en', translation: field('translation') })
  }
  /** @type {Map<string, { lang: string, slug: string }[]>} */
  const pairs = new Map()
  for (const [slug, { lang, translation }] of posts) {
    const other = translation && posts.get(translation)
    if (other && translation)
      pairs.set(slug, [{ lang, slug }, { lang: other.lang, slug: translation }])
  }
  return pairs
}
const pairs = translatedPairs()

// `pnpm build:cd` — export lisible pour une session d'idéation Claude Design
// (PROTOCOL §3) : CSS en fichiers séparés et rien de minifié, pour que CD lise
// le CSS tel qu'on l'écrit.
const cdExport = process.env.CD_EXPORT === '1'

// The `/ds/*` design system previews: the production build leaves them out. Dev and the
// CD export keep them.
const keepDs = cdExport

/** @type {import('astro').AstroIntegration} */
const dropDsPages = {
  name: 'drop-ds-pages',
  hooks: {
    'astro:build:done': ({ dir }) => rmSync(new URL('ds/', dir), { recursive: true, force: true }),
  },
}

// the public URL is deployment data: SITE_URL, else the old Ghost domain this site replaces
const site = process.env.SITE_URL || 'https://blog.pierrickbignet.com'

export default defineConfig({
  site,
  ...(cdExport && {
    outDir: './dist-cd',
    // format 'file' : /writing → writing.html (pas writing/index.html) — le composer
    // de claude.ai décompresse le zip en pièces jointes À PLAT, les pages doivent
    // porter des noms uniques.
    build: { inlineStylesheets: 'never', format: 'file' },
    vite: { build: { minify: false, cssMinify: false } },
  }),
  integrations: [
    markdoc(),
    // les pages `/ds/*` sont des previews de design system : hors sitemap
    sitemap({
      filter: page => !page.includes('/ds/'),
      // each version of a translated post names the other, itself included
      serialize(item) {
        const slug = new URL(item.url).pathname.match(/^\/writing\/([^/]+)\/?$/)?.[1]
        const pair = slug && pairs.get(slug)
        if (pair)
          item.links = pair.map(v => ({ lang: v.lang, url: new URL(`/writing/${v.slug}/`, item.url).href }))
        return item
      },
    }),
    svelte(),
    ...(keepDs ? [] : [dropDsPages]),
  ],
})
