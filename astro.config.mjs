// @ts-check
import process from 'node:process'
import markdoc from '@astrojs/markdoc'
import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
import { defineConfig } from 'astro/config'

// `pnpm build:cd` — export lisible pour une session d'idéation Claude Design
// (PROTOCOL §3) : CSS en fichiers séparés et rien de minifié, pour que CD lise
// le CSS tel qu'on l'écrit.
const cdExport = process.env.CD_EXPORT === '1'

export default defineConfig({
  site: 'https://exhale.blog',
  ...(cdExport && {
    outDir: './dist-cd',
    build: { inlineStylesheets: 'never' },
    vite: { build: { minify: false, cssMinify: false } },
  }),
  integrations: [
    markdoc(),
    // les pages `/ds/*` sont des previews de design system : hors sitemap
    sitemap({ filter: page => !page.includes('/ds/') }),
    svelte(),
  ],
})
