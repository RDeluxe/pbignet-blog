/**
 * sync-od.mjs — amène le VRAI site dans le projet Open Design, rendable.
 *
 * Pourquoi : le moteur de rendu d'Open Design ouvre le fichier en `file://` et refuse
 * les symlinks qui sortent du projet. Or `pnpm build:cd` émet des chemins d'assets
 * racine-absolus (`/_astro/…`), qui en `file://` partent à la racine du DISQUE : la page
 * se rend, mais nue — sans CSS, sans photo, sans font. Ce script fait les trois gestes
 * qui manquent : build, copie dans `<projet OD>/site/`, réécriture des chemins en relatif.
 *
 *   pnpm build:od              → build + sync
 *   pnpm build:od --no-build   → sync seul (quand le build est déjà frais)
 *
 * Le dossier projet Open Design est une donnée de MACHINE, pas de repo : il vient de
 * la variable d'environnement `OD_PROJECT_DIR` (à exporter dans le profil shell).
 *
 * La copie est allégée : sortent `sitemap*.xml` et les `.woff` dont le `.woff2` jumeau
 * existe (@fontsource livre les deux, le moteur ne lit que le second ; le fallback
 * `url(….woff)` du CSS devient un lien mort inoffensif). `photos/source/` reste
 * (le `<img>` fallback du hero pop color pointe dessus).
 *
 * Les EFFETS JS tournent en preview depuis le 2026-08-05 : voir la passe « effets JS
 * pour file:// » plus bas (scripts module → classiques via esbuild, image du canvas
 * dither inlinée en data-URI). Vérifié au calculé sur 4 pages : grain posé, topo et
 * dither peints, zéro erreur.
 */

import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import esbuild from 'esbuild'

const REPO = resolve(import.meta.dirname, '..')
const BUILD = join(REPO, 'dist-cd')

const OD = process.env.OD_PROJECT_DIR
if (!OD) {
  console.error(
    'OD_PROJECT_DIR manquant — le dossier projet Open Design est une donnée de machine.\n'
    + 'Exemple (profil shell) :\n'
    + '  export OD_PROJECT_DIR="$HOME/Library/Application Support/Open Design/namespaces/release-stable/data/projects/<id>"',
  )
  process.exit(2)
}
if (!existsSync(OD))
  throw new Error(`OD_PROJECT_DIR n'existe pas : ${OD}`)
const OUT = join(OD, 'site')

if (!process.argv.includes('--no-build')) {
  const r = spawnSync('pnpm', ['build:cd'], { cwd: REPO, stdio: 'inherit', env: { ...process.env } })
  if (r.status !== 0)
    process.exit(r.status ?? 1)
}
if (!existsSync(BUILD))
  throw new Error(`build absent : ${BUILD}`)

/** ce qui ne sert pas au rendu ne part pas dans les Design Files */
function keep(src) {
  const rel = relative(BUILD, src)
  if (rel === '')
    return true
  const name = basename(rel)
  if (/^sitemap.*\.xml$/.test(name))
    return false
  if (name.endsWith('.woff')) {
    // le jumeau .woff2 porte un AUTRE hash : `anton….AUNGEG_V.woff` / `anton….Byf51wtH.woff2`
    const base = name.replace(/\.[^.]+\.woff$/, '')
    const twin = readdirSync(dirname(src)).some(n => n.startsWith(`${base}.`) && n.endsWith('.woff2'))
    if (twin)
      return false // .woff doublonné par son .woff2
  }
  return true
}

rmSync(OUT, { recursive: true, force: true })
cpSync(BUILD, OUT, { recursive: true, filter: keep })

/** tous les fichiers de `site/`, en chemins relatifs à `site/` */
function walk(dir, base = dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory())
      walk(p, base, acc)
    else acc.push(relative(base, p))
  }
  return acc
}

const files = walk(OUT)
const built = new Set(files)
/** de combien de `../` un fichier a besoin pour remonter à `site/` */
const upTo = f => '../'.repeat(dirname(f).split('/').filter(s => s && s !== '.').length)

/**
 * Une référence racine-absolue → sa cible relative depuis `from`.
 * Deux cas : un ASSET (il a une extension, il existe tel quel) et une ROUTE (`/setup`,
 * `/writing/torii`) que `build.format: 'file'` a écrite en `<route>.html`. Une route non
 * construite (`/travel`, `/projects`…) est laissée telle quelle : un lien mort en preview
 * est honnête, ces sections n'existent pas encore.
 */
function rebase(ref, from) {
  const [path, hash = ''] = ref.split(/(?=#)/)
  const bare = path.slice(1).replace(/\/$/, '')
  const target = built.has(bare)
    ? bare
    : built.has(`${bare}.html`)
      ? `${bare}.html`
      : built.has(`${bare}/index.html`) ? `${bare}/index.html` : null
  return target === null ? ref : upTo(from) + target + hash
}

let rewrites = 0
for (const f of files) {
  if (!/\.(?:html|css|js)$/.test(f))
    continue
  const abs = join(OUT, f)
  const before = readFileSync(abs, 'utf8')

  const after = before
    // href="/…" et src="/…" (pas "//" — ce serait un protocole-relatif)
    .replace(/(\b(?:href|src)=")(\/(?!\/)[^"]*)"/g, (m, attr, ref) => {
      const out = rebase(ref, f)
      return out === ref ? m : `${attr}${out}"`
    })
    // url(/…) dans le CSS : c'est par là que passent les fonts @fontsource
    .replace(/url\((["']?)(\/(?!\/)[^)"']*)\1\)/g, (m, q, ref) => {
      const out = rebase(ref, f)
      return out === ref ? m : `url(${q}${out}${q})`
    })
    // les littéraux JS aussi (`const photoSrc = "/photos/…"` du script inline du hero) —
    // sans risque : rebase ne touche que ce qui résout vers un fichier du build
    .replace(/(["'])(\/(?!\/)[\w\-./]+)\1/g, (m, q, ref) => {
      const out = rebase(ref, f)
      return out === ref ? m : `${q}${out}${q}`
    })

  if (after !== before) {
    writeFileSync(abs, after)
    rewrites++
  }
}

/**
 * En `file://` (le protocole du moteur d'aperçu OD), deux règles de sécurité privent le
 * build de ses effets JS, et on les neutralise ici :
 *
 * 1. Les `<script type="module">` sont bloqués par CORS (origine `null`). On bundle
 *    chaque entrée en script CLASSIQUE autonome (esbuild, IIFE) — les classiques ne
 *    subissent pas CORS — et on garde la sémantique différée avec `defer`.
 * 2. Dessiner une image `file://` SALIT le canvas : `getImageData` jette une
 *    SecurityError. Le hero pop color lit les pixels de son `img.dsrc` → on inline
 *    cette image en data-URI (same-origin, ne salit pas).
 */
const bundled = new Map() // entrée .js → nom du bundle classique
let inlined = 0
for (const f of files) {
  if (!f.endsWith('.html'))
    continue
  const abs = join(OUT, f)
  const before = readFileSync(abs, 'utf8')

  let after = before.replace(
    /<script type="module" src="([^"]+)"><\/script>/g,
    (m, src) => {
      const entryAbs = resolve(dirname(abs), src)
      if (!existsSync(entryAbs))
        return m
      if (!bundled.has(entryAbs)) {
        const outAbs = entryAbs.replace(/\.js$/, '.od.js')
        esbuild.buildSync({ entryPoints: [entryAbs], bundle: true, format: 'iife', outfile: outAbs, logLevel: 'silent' })
        bundled.set(entryAbs, outAbs)
      }
      return `<script defer src="${src.replace(/\.js$/, '.od.js')}"></script>`
    },
  )

  after = after.replace(/<img\b[^>]*>/g, (tag) => {
    if (!/\bclass="[^"]*\bdsrc\b/.test(tag))
      return tag
    return tag.replace(/(\bsrc=")([^"]+)(")/, (m, pre, src, post) => {
      const imgAbs = resolve(dirname(abs), src)
      if (!existsSync(imgAbs))
        return m
      const mime = src.endsWith('.png') ? 'image/png' : 'image/jpeg'
      inlined++
      return `${pre}data:${mime};base64,${readFileSync(imgAbs).toString('base64')}${post}`
    })
  })

  if (after !== before)
    writeFileSync(abs, after)
}

const pages = files.filter(f => f.endsWith('.html')).sort()
console.log(`site/ ← dist-cd : ${files.length} fichiers, ${rewrites} réécrits`)
console.log(`effets JS pour file:// : ${bundled.size} script(s) module → classique, ${inlined} image(s) de canvas inlinée(s)`)
console.log(pages.map(p => `  site/${p}`).join('\n'))
