import markdoc from '@astrojs/markdoc'
import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
// @ts-check
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://exhale.blog',
  integrations: [
    markdoc(),
    // les pages `/ds/*` sont des previews de design system : hors sitemap
    sitemap({ filter: page => !page.includes('/ds/') }),
    svelte(),
  ],
})
