#!/usr/bin/env node
/**
 * ds-build.mjs — construit le bundle à pousser vers le projet Claude Design
 * « exhale Design System ».
 *
 * Principes (cf. design/PIPELINE.md §6) :
 *   1. les `tokens/*.css` sont poussés TELS QUELS — aucune génération, donc aucune dérive ;
 *   2. on ne pousse jamais une seconde implémentation : les cards sont les pages `/ds/*`
 *      **rendues par les vrais composants**, avec leur CSS inliné pour être autonomes ;
 *   3. le contrat d'API (`.d.ts`) est extrait des `interface Props` réelles.
 *
 * Usage : node scripts/ds-build.mjs [dossier de sortie]
 * Prérequis : `npm run build` (le script lit `dist/`).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import process from 'node:process'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')
const OUT = resolve(process.argv[2] ?? join(ROOT, '.ds-bundle'))

/** les cards de composants : une page /ds/<slug> → components/<name>.card.html */
const CARDS = [
  { slug: 'hero-pop-color', name: 'HeroPopColor', group: 'Cover', viewport: 1280 },
  { slug: 'tiles', name: 'tiles', group: 'Boxes', viewport: 1280 },
  { slug: 'boxes', name: 'boxes', group: 'Boxes', viewport: 1280 },
]

/** les composants dont on publie le contrat d'API */
const CONTRACTS = [
  'components/hero/HeroPopColor.astro',
  'components/article/ArticleBar.astro',
  'components/article/ArticleHead.astro',
  'components/article/StatRow.astro',
  'components/article/PullQuote.astro',
  'components/article/ArticlePlate.astro',
  'components/primitives/Section.astro',
  'components/primitives/Wrap.astro',
  'components/primitives/Grid.astro',
  'components/primitives/Stack.astro',
  'components/primitives/Lede.astro',
  'components/primitives/Prose.astro',
  'components/print/Plate.astro',
  'components/print/Callout.astro',
  'components/print/Barcode.astro',
  'components/print/MonoLabel.astro',
  'components/print/RegMarks.astro',
  'components/CollCard.astro',
  'components/GearCard.astro',
  'components/PostRow.astro',
  'components/PhotoFrame.astro',
  'components/SectionHead.astro',
  'components/Tag.astro',
]

function write(rel, content) {
  const path = join(OUT, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
  return rel
}

/**
 * Rend une page buildée autonome : les `<link rel=stylesheet href=/_astro/…>` deviennent des
 * `<style>` inlinés, et les assets locaux sont réécrits vers le chemin du bundle.
 */
function selfContain(html, assets) {
  let out = html.replace(/<link rel="stylesheet" href="(\/_astro\/[^"]+)">/g, (_, href) => {
    const css = readFileSync(join(DIST, href.slice(1)), 'utf8')
    return `<style>${css}</style>`
  })
  // les scripts de module ne servent à rien dans une card statique : le rendu est déjà là
  out = out.replace(/<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/g, '')
  for (const [from, to] of Object.entries(assets)) out = out.split(from).join(to)
  return out
}

/** Extrait le bloc `interface Props { … }` d'un composant Astro, avec ses commentaires. */
function extractProps(src) {
  const start = src.search(/(?:export )?interface Props\s*\{/)
  if (start === -1)
    return null
  // parcourt les accolades pour trouver la fermeture de l'interface
  let depth = 0
  let i = src.indexOf('{', start)
  for (; i < src.length; i++) {
    if (src[i] === '{') {
      depth++
    }
    else if (src[i] === '}') {
      depth--
      if (depth === 0)
        break
    }
  }
  return src.slice(start, i + 1).replace(/^export /, '')
}

/** Le docblock de tête d'un composant, s'il en a un. */
function extractDoc(src) {
  const m = src.match(/^---\s*\n(\/\*\*[\s\S]*?\*\/)/)
  return m ? m[1] : null
}

// ---------------------------------------------------------------- 1. reset
if (existsSync(OUT))
  rmSync(OUT, { recursive: true })
mkdirSync(OUT, { recursive: true })
const written = []

// ------------------------------------------- 2. tokens, tels quels + point d'entrée
for (const f of ['colors.css', 'type.css', 'space.css']) {
  written.push(write(`tokens/${f}`, readFileSync(join(ROOT, 'src/styles/tokens', f))))
}
written.push(write('base.css', readFileSync(join(ROOT, 'src/styles/base.css'))))
written.push(write('styles.css', `/* styles.css — le point d'entrée unique. Lier CE fichier suffit.
 * Identique à src/styles/index.css du site : mêmes tokens, mêmes valeurs, aucune copie.
 */
@import './tokens/colors.css';
@import './tokens/type.css';
@import './tokens/space.css';
@import './base.css';
`))

// ------------------------------------------------------- 3. skill + guide
for (const f of ['SKILL.md', 'README.md']) {
  written.push(write(f, readFileSync(join(ROOT, 'design/ds', f))))
}

// ------------------------- 3b. notices d'usage, écrites à la main pour les composants
//     qui portent le plus de doctrine (les autres n'ont que leur contrat)
const PROMPTS = join(ROOT, 'design/ds/prompts')
if (existsSync(PROMPTS)) {
  for (const f of readdirSync(PROMPTS)) {
    written.push(write(`components/${f}`, readFileSync(join(PROMPTS, f))))
  }
}

// ------------------------------------------------- 4. contrats d'API (.d.ts)
for (const rel of CONTRACTS) {
  const src = readFileSync(join(ROOT, 'src', rel), 'utf8')
  const props = extractProps(src)
  const name = basename(rel, '.astro')
  const doc = extractDoc(src)
  const body = props
    ? `${doc ? `${doc}\n` : ''}export ${props}\n`
    : `/** ${name} — aucune prop : le composant se compose par slot. */\nexport interface Props {}\n`
  written.push(write(`components/${name}.d.ts`, `// Contrat extrait de src/${rel} — ne pas éditer à la main.\n${body}`))
}

// --------------------------------------------------- 5. cards autonomes
const assetsCopied = new Set()
for (const card of CARDS) {
  const page = join(DIST, 'ds', card.slug, 'index.html')
  if (!existsSync(page)) {
    console.warn(`⚠ preview absente : ${page} — lancer \`npm run build\` d'abord`)
    continue
  }
  let html = readFileSync(page, 'utf8')

  // copie les photos référencées et réécrit leur chemin
  const assets = {}
  for (const m of html.matchAll(/["'(](\/photos\/[^"')]+)["')]/g)) {
    const src = m[1]
    const dest = `assets${src}`
    if (!assetsCopied.has(src)) {
      const from = join(ROOT, 'public', src.slice(1))
      if (existsSync(from)) {
        written.push(write(dest, readFileSync(from)))
        assetsCopied.add(src)
      }
    }
    assets[src] = `../${dest}`
  }

  html = selfContain(html, assets)
  const marker = `<!-- @dsCard group="${card.group}" viewport="${card.viewport}" -->\n`
  written.push(write(`components/${card.name}.card.html`, marker + html))
}

// -------------------------------------------------------- 6. rapport
console.log(`bundle → ${OUT}`)
for (const rel of written.sort()) {
  const size = readFileSync(join(OUT, rel)).length
  console.log(`  ${rel.padEnd(44)} ${String(size).padStart(8)} o`)
}
console.log(`\n${written.length} fichiers`)
