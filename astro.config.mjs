import markdoc from '@astrojs/markdoc'
import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
// @ts-check
import { defineConfig } from 'astro/config'
import UnoCSS from 'unocss/astro'

export default defineConfig({
  site: 'https://pierrickbignet.com',
  integrations: [
    UnoCSS({ injectReset: false }),
    markdoc(),
    sitemap(),
    svelte(),
  ],
})
