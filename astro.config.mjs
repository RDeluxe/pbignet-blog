// @ts-check
import { rmSync } from 'node:fs'
import process from 'node:process'
import markdoc from '@astrojs/markdoc'
import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
import { defineConfig } from 'astro/config'

// `pnpm build:cd` — export lisible pour une session d'idéation Claude Design
// (PROTOCOL §3) : CSS en fichiers séparés et rien de minifié, pour que CD lise
// le CSS tel qu'on l'écrit.
const cdExport = process.env.CD_EXPORT === '1'

// BUILD_TARGET=staging (set by scripts/deploy-staging.sh) keeps the `/ds/*` design system
// previews; the default build is production and leaves them out. Dev and the CD export
// keep them.
const keepDs = process.env.BUILD_TARGET === 'staging' || cdExport

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
    sitemap({ filter: page => !page.includes('/ds/') }),
    svelte(),
    ...(keepDs ? [] : [dropDsPages]),
  ],
})
