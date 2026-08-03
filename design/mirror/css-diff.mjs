/**
 * css-diff — compare deux ensembles de CSS *par déclaration*, pas par texte.
 *
 * Pourquoi pas un `diff` classique : le CSS d'Astro et celui de Claude Design ne
 * seront jamais identiques au caractère près (Astro injecte `[data-astro-cid-*]`,
 * l'ordre et le formatage diffèrent, les sélecteurs de groupe sont écrits
 * autrement). On compare donc des paires {contexte + sélecteur → propriété:valeur},
 * ce qui encaisse le formatage et ne signale que les écarts réels.
 *
 * Usage :
 *   node design/mirror/css-diff.mjs <fichiers côté A...> -- <fichiers côté B...>
 *
 * Accepte des `.css` (lus tels quels) et des `.html` / `.astro` (on en extrait
 * les blocs <style>). L'expansion des globs est laissée au shell.
 */
import { readFileSync } from 'node:fs'
import postcss from 'postcss'

const STYLE_RE = /<style[^>]*>([\s\S]*?)<\/style>/g

function extract(file) {
  const raw = readFileSync(file, 'utf8')
  if (file.endsWith('.css')) return raw
  let out = ''
  let m
  STYLE_RE.lastIndex = 0
  while ((m = STYLE_RE.exec(raw))) out += `${m[1]}\n`
  return out
}

const normVal = v => v.replace(/\s+/g, ' ').trim()

/**
 * Le scope d'Astro disparaît : c'est un détail d'implémentation, pas du design.
 * Les guillemets de `[data-x="y"]` sont uniformisés, sinon `'y'` et `"y"`
 * compteraient comme deux sélecteurs différents.
 */
const normSel = s => s
  .replace(/\[data-astro-cid-[^\]]*\]/g, '')
  .replace(/"/g, '\'')
  .replace(/\s*([>+~])\s*/g, '$1')
  .replace(/\s+/g, ' ')
  .trim()

function ctxOf(node) {
  const parts = []
  let p = node.parent
  while (p && p.type !== 'root') {
    if (p.type === 'atrule') parts.unshift(`@${p.name} ${normVal(p.params)}`)
    p = p.parent
  }
  return parts.join(' / ')
}

/** @returns {Map<string, {decls: Map<string,string>, origins: Set<string>}>} */
function index(files) {
  const map = new Map()
  for (const f of files) {
    let root
    try {
      root = postcss.parse(extract(f), { from: f })
    }
    catch (e) {
      console.error(`⚠ parse impossible : ${f} — ${e.message}`)
      continue
    }
    root.walkRules((rule) => {
      const ctx = ctxOf(rule)
      // les "sélecteurs" d'un @keyframes sont des pourcentages : hors sujet
      if (ctx.includes('@keyframes')) return
      const decls = []
      rule.walkDecls(d => decls.push([d.prop.trim(), normVal(d.value) + (d.important ? ' !important' : '')]))
      if (!decls.length) return
      for (const sel of rule.selectors) {
        const key = (ctx ? `${ctx} | ` : '') + normSel(sel)
        if (!map.has(key)) map.set(key, { decls: new Map(), origins: new Set() })
        const entry = map.get(key)
        entry.origins.add(f)
        // dernier gagne : c'est ce que fait la cascade
        for (const [p, v] of decls) entry.decls.set(p, v)
      }
    })
  }
  return map
}

const argv = process.argv.slice(2)
const sep = argv.indexOf('--')
if (sep === -1) {
  console.error('usage: node css-diff.mjs <A...> -- <B...>')
  process.exit(2)
}
const filesA = argv.slice(0, sep)
const filesB = argv.slice(sep + 1)

const A = index(filesA)
const B = index(filesB)

const onlyA = []
const onlyB = []
const changed = []

for (const [key, a] of A) {
  const b = B.get(key)
  if (!b) {
    onlyA.push(key)
    continue
  }
  for (const [prop, va] of a.decls) {
    if (!b.decls.has(prop)) changed.push({ key, prop, a: va, b: null })
    else if (b.decls.get(prop) !== va) changed.push({ key, prop, a: va, b: b.decls.get(prop) })
  }
  for (const [prop, vb] of b.decls) {
    if (!a.decls.has(prop)) changed.push({ key, prop, a: null, b: vb })
  }
}
for (const key of B.keys()) if (!A.has(key)) onlyB.push(key)

// une clé définie dans plusieurs fichiers du même côté = duplication réelle
const dupes = side => [...side].filter(([, v]) => v.origins.size > 1)

const countDecls = m => [...m.values()].reduce((n, v) => n + v.decls.size, 0)

console.log(`A : ${filesA.length} fichiers · ${A.size} sélecteurs · ${countDecls(A)} déclarations`)
console.log(`B : ${filesB.length} fichiers · ${B.size} sélecteurs · ${countDecls(B)} déclarations`)

const section = (title, lines) => {
  console.log(`\n${'═'.repeat(72)}\n${title} (${lines.length})`)
  if (!lines.length) console.log('  — aucun')
  else lines.forEach(l => console.log(`  ${l}`))
}

section('SEULEMENT DANS A', onlyA)
section('SEULEMENT DANS B', onlyB)
section('DÉCLARATIONS DIVERGENTES', changed.map(c =>
  c.a === null
    ? `${c.key}\n      + ${c.prop}: ${c.b}   (ajouté en B)`
    : c.b === null
      ? `${c.key}\n      − ${c.prop}: ${c.a}   (absent en B)`
      : `${c.key}\n      ${c.prop}:  A=${c.a}  →  B=${c.b}`,
))

const dA = dupes(A)
const dB = dupes(B)
section('DUPLIQUÉ ENTRE PLUSIEURS FICHIERS — côté A', dA.map(([k, v]) => `${k}  ←  ${[...v.origins].join(' + ')}`))
section('DUPLIQUÉ ENTRE PLUSIEURS FICHIERS — côté B', dB.map(([k, v]) => `${k}  ←  ${[...v.origins].join(' + ')}`))

const total = onlyA.length + onlyB.length + changed.length
console.log(`\n${'═'.repeat(72)}`)
console.log(`${total} écart(s) · ${dA.length} duplication(s) en A · ${dB.length} en B`)
process.exit(total === 0 ? 0 : 1)
