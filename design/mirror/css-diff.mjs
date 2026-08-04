/**
 * css-diff — compare deux ensembles de CSS *par déclaration*, pas par texte.
 *
 * Pourquoi pas un `diff` classique : le CSS d'Astro et celui de Claude Design ne
 * seront jamais identiques au caractère près (Astro injecte `[data-astro-cid-*]`,
 * l'ordre et le formatage diffèrent, les sélecteurs de groupe sont écrits
 * autrement). On compare donc des paires {contexte + sélecteur → propriété:valeur},
 * ce qui encaisse le formatage et ne signale que les écarts réels.
 *
 * Deux modes :
 *
 *   node design/mirror/css-diff.mjs --manifest
 *       Compare composant par composant selon design/mirror/manifest.json.
 *       C'est le mode de travail : il n'apparie que ce que le manifeste déclare
 *       `mirrored`, donc il ne hurle pas sur nos primitives de layout.
 *
 *   node design/mirror/css-diff.mjs <fichiers A...> -- <fichiers B...>
 *       Compare deux ensembles arbitraires. Sert à vérifier un sync : miroir
 *       d'avant contre miroir d'après.
 *
 * Accepte des `.css` (lus tels quels) et des `.html` / `.astro` (on en extrait
 * les blocs <style>).
 *
 * ⚠ Limite : le CSS posé *inline* sur un élément est invisible ici. C'est pour ça
 * que l'ink de page doit vivre dans une feuille (`:root[data-ink]`) et non dans un
 * attribut `style` — sinon la seule valeur qui distingue un article de la home est
 * la seule qu'on ne peut pas contrôler.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
/**
 * L'ouverture doit être en début de ligne : plusieurs composants mentionnent
 * `<style>` dans un commentaire de frontmatter, et un regex laxiste avalait alors
 * tout le fichier comme du CSS.
 */
const STYLE_RE = /^[ \t]*<style[^>]*>([\s\S]*?)<\/style>/gm

function extract(file) {
  const raw = readFileSync(file, 'utf8')
  if (file.endsWith('.css')) return raw
  let out = ''
  let m
  STYLE_RE.lastIndex = 0
  while ((m = STYLE_RE.exec(raw))) out += `${m[1]}\n`
  return out
}

/**
 * `f( 90deg, x )` et `f(90deg, x)` sont la même valeur.
 *
 * Les nombres sont normalisés pour la même raison : `0.20` et `0.2` sont le même nombre,
 * et `.5` aussi. Sans ça l'outil signalait un écart sur `--line` (CD écrit
 * `rgba(27, 26, 22, 0.20)`, nous `0.2`) — du bruit qui coûte de la confiance au rapport,
 * parce qu'un lecteur qui trouve un faux positif doute des vrais.
 */
const normNum = v => v.replace(/(?<![\w.])(\d*)\.(\d+)/g, (whole, int, frac) => {
  const f = frac.replace(/0+$/, '')
  const i = int === '' ? '0' : int
  return f === '' ? i : `${i}.${f}`
})

const normVal = v => normNum(
  v.replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    // `clamp(20px,2.4vw,28px)` et `clamp(20px, 2.4vw, 28px)` sont la même valeur. Sans
    // ça, tout token dont la définition aère ses virgules ressortait en écart contre le
    // littéral serré de CD — une quinzaine de faux positifs sur les échelles fluides.
    .replace(/\s*,\s*/g, ',')
    .trim(),
)

/**
 * Table des custom properties d'un côté. Sert à départager un vrai désaccord d'une
 * simple différence d'écriture : côté code un composant dit `var(--fs-tag)`, côté CD
 * il dit `10px`. Si le token vaut 10px, il n'y a rien à signaler.
 */
function collectVars(files) {
  const vars = new Map()
  for (const f of files) {
    if (!existsSync(f)) continue
    let root
    try {
      root = postcss.parse(extract(f), { from: f })
    }
    catch {
      continue
    }
    root.walkDecls((d) => {
      if (d.prop.startsWith('--')) vars.set(d.prop.trim(), normVal(d.value))
    })
  }
  return vars
}

const VAR_RE = /var\(\s*(--[\w-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))*))?\)/g

function resolveVars(value, vars, depth = 0) {
  if (depth > 12 || !value.includes('var(')) return value
  const out = value.replace(VAR_RE, (m, name, fallback) => {
    if (vars.has(name)) return vars.get(name)
    return fallback === undefined ? m : fallback.trim()
  })
  return out === value ? out : resolveVars(out, vars, depth + 1)
}

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
function index(files, { ignore = [] } = {}) {
  const map = new Map()
  const ignoreSet = new Set(ignore.map(normSel))
  for (const f of files) {
    if (!existsSync(f)) {
      console.error(`⚠ absent : ${f}`)
      continue
    }
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
        const nsel = normSel(sel)
        if (ignoreSet.has(nsel)) continue
        const key = (ctx ? `${ctx} | ` : '') + nsel
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

function compare(A, B, varsA = new Map(), varsB = new Map(), assumed = [], assumedSelectors = []) {
  const onlyA = []
  const onlyB = []
  const changed = []
  /** même valeur, écriture différente (token d'un côté, littéral de l'autre) */
  const equivalent = []
  /** écart réel mais DÉLIBÉRÉ, déclaré dans le manifeste avec son motif */
  const declared = []
  /** sélecteur présent d'un seul côté, délibérément */
  const declaredSel = []

  /** un écart assumé est reconnu sur (propriété [, sélecteur]) — le motif vient du manifeste */
  const assumedFor = (key, prop) => assumed.find(
    r => r.prop === prop && (!r.selector || r.selector === key),
  )

  /**
   * Idem au niveau du sélecteur. `match` est comparé littéralement, `prefix` couvre une
   * famille (tout un bloc `@media`) : énumérer neuf sélecteurs de reduced-motion à la main
   * serait une liste à maintenir, donc une liste qui pourrira.
   */
  const assumedSel = (key) => {
    const r = assumedSelectors.find(x => (x.match && x.match === key)
      || (x.prefix && key.startsWith(x.prefix)))
    return r ? r.reason : null
  }

  for (const [key, a] of A) {
    const b = B.get(key)
    if (!b) {
      const why = assumedSel(key)
      if (why) declaredSel.push({ key, side: 'CD', reason: why })
      else onlyA.push(key)
      continue
    }
    for (const [prop, va] of a.decls) {
      if (!b.decls.has(prop)) {
        changed.push({ key, prop, a: va, b: null })
        continue
      }
      const vb = b.decls.get(prop)
      if (vb === va) continue
      // renormaliser APRÈS résolution : la substitution recolle des morceaux de tokens
      // dont l'écriture n'a aucune raison de coïncider avec celle du littéral d'en face
      const ra = normVal(resolveVars(va, varsA))
      const rb = normVal(resolveVars(vb, varsB))
      if (ra === rb) { equivalent.push({ key, prop, a: va, b: vb, resolved: ra }); continue }
      const why = assumedFor(key, prop)
      if (why) declared.push({ key, prop, a: va, b: vb, reason: why.reason })
      else changed.push({ key, prop, a: va, b: vb, ra, rb })
    }
    for (const [prop, vb] of b.decls) {
      if (!a.decls.has(prop)) changed.push({ key, prop, a: null, b: vb })
    }
  }
  for (const key of B.keys()) {
    if (A.has(key)) continue
    const why = assumedSel(key)
    if (why) declaredSel.push({ key, side: 'nous', reason: why })
    else onlyB.push(key)
  }
  return { onlyA, onlyB, changed, equivalent, declared, declaredSel }
}

const dupes = side => [...side].filter(([, v]) => v.origins.size > 1)
const countDecls = m => [...m.values()].reduce((n, v) => n + v.decls.size, 0)

/* ── mode manifeste ─────────────────────────────────────────────────────────── */

/**
 * Le protocole doit exister à l'identique des deux côtés (PROTOCOL §9). Une copie
 * périmée chez CD est pire que pas de copie : les deux côtés croient suivre la même
 * règle. On le dit en tête de rapport plutôt que d'espérer s'en souvenir.
 */
function checkProtocolCopy(cdRoot) {
  const mine = join(HERE, '../PROTOCOL.md')
  const theirs = join(cdRoot, 'PROTOCOL.md')
  if (!existsSync(mine)) return
  if (!existsSync(theirs)) {
    console.log('⚠ PROTOCOL.md absent côté CD — le lui envoyer (PROTOCOL §9)\n')
    return
  }
  const norm = p => readFileSync(p, 'utf8').replace(/\r\n/g, '\n').trimEnd()
  if (norm(mine) !== norm(theirs)) {
    console.log('⚠ PROTOCOL.md diverge entre le dépôt et CD — renvoyer la version du dépôt (PROTOCOL §9)\n')
  }
}

function runManifest() {
  const man = JSON.parse(readFileSync(join(HERE, 'manifest.json'), 'utf8'))
  const cdRoot = join(REPO, man.cdRoot)
  const astroRoot = join(REPO, man.astroRoot)
  const ignore = man.ignoreSelectors ?? []

  const cdPath = f => join(cdRoot, 'assets/components', f)
  const pairs = []

  // la fondation : paper.css contre tokens/ + base.css
  pairs.push({
    name: 'foundation',
    cd: man.foundation.cd.map(f => join(cdRoot, f)),
    astro: man.foundation.astro.map(f => join(astroRoot, f)),
    note: man.foundation.note,
  })

  const dette = []
  const horsPerimetre = []
  for (const [name, c] of Object.entries(man.components)) {
    if (c.scope === 'mirrored') pairs.push({ name, cd: [cdPath(c.cd)], astro: [join(astroRoot, c.astro)], note: c.note })
    else if (c.scope === 'cd-only') dette.push([name, c])
    else horsPerimetre.push([name, c])
  }

  checkProtocolCopy(cdRoot)

  // chaque côté résout avec SES propres tokens : on compare des valeurs finales
  const varsCD = collectVars(man.foundation.cd.map(f => join(cdRoot, f)))
  const varsOurs = collectVars(man.foundation.astro.map(f => join(astroRoot, f)))

  let aligned = 0
  let equivTotal = 0
  let declaredTotal = 0
  const drifted = []
  const assumed = man.assumedDiffs ?? []
  const assumedSelectors = man.assumedSelectors ?? []

  for (const p of pairs) {
    const CD = index(p.cd, { ignore })
    const OURS = index(p.astro, { ignore })
    // un composant peut définir ses propres customs en plus des tokens globaux
    const vCD = new Map([...varsCD, ...collectVars(p.cd)])
    const vOurs = new Map([...varsOurs, ...collectVars(p.astro)])
    const { onlyA, onlyB, changed, equivalent, declared, declaredSel }
      = compare(CD, OURS, vCD, vOurs, assumed, assumedSelectors)
    equivTotal += equivalent.length
    declaredTotal += declared.length + declaredSel.length
    const total = onlyA.length + onlyB.length + changed.length
    const eq = equivalent.length ? `  (+${equivalent.length} équivalents)` : ''
    if (total === 0) {
      aligned++
      console.log(`✓ ${p.name.padEnd(16)} aligné — ${CD.size} sélecteurs, ${countDecls(CD)} déclarations${eq}`)
      continue
    }
    drifted.push({ ...p, onlyA, onlyB, changed, equivalent, declared, declaredSel, total })
    console.log(`● ${p.name.padEnd(16)} ${total} écart(s)${eq}`)
  }

  for (const d of drifted) {
    console.log(`\n${'─'.repeat(72)}\n${d.name}`)
    if (d.note) console.log(`  note : ${d.note}`)
    if (d.onlyA.length) {
      console.log('  seulement chez CD :')
      d.onlyA.forEach(k => console.log(`    ${k}`))
    }
    if (d.onlyB.length) {
      console.log('  seulement chez nous :')
      d.onlyB.forEach(k => console.log(`    ${k}`))
    }
    if (d.changed.length) {
      console.log('  déclarations :')
      d.changed.forEach((c) => {
        if (c.a === null) return console.log(`    ${c.key}\n        + ${c.prop}: ${c.b}   (seulement chez nous)`)
        if (c.b === null) return console.log(`    ${c.key}\n        − ${c.prop}: ${c.a}   (seulement chez CD)`)
        // si la valeur écrite passe par des tokens, montrer aussi le résolu
        const detail = (c.ra !== c.a || c.rb !== c.b) ? `\n            résolu : ${c.ra}  vs  ${c.rb}` : ''
        console.log(`    ${c.key}\n        ${c.prop}:  CD=${c.a}  →  nous=${c.b}${detail}`)
      })
    }
    if (d.declared.length) {
      console.log('  écarts assumés (déclarés au manifeste) :')
      d.declared.forEach(c => console.log(`    ${c.key}\n        ${c.prop}:  CD=${c.a}  →  nous=${c.b}\n            motif : ${c.reason}`))
    }
    if (d.declaredSel.length) {
      // groupé par motif : neuf sélecteurs de reduced-motion partagent une seule raison
      const byReason = new Map()
      d.declaredSel.forEach((c) => {
        if (!byReason.has(c.reason)) byReason.set(c.reason, [])
        byReason.get(c.reason).push(`${c.key} (${c.side})`)
      })
      console.log('  sélecteurs assumés d\'un seul côté :')
      for (const [reason, keys] of byReason) {
        console.log(`    ${keys.length} sélecteur(s) — ${reason}`)
        keys.forEach(k => console.log(`      · ${k}`))
      }
    }
  }

  console.log(`\n${'═'.repeat(72)}`)
  console.log(`${aligned} aligné(s) · ${drifted.length} en écart · ${dette.length} de dette CD · ${horsPerimetre.length} hors périmètre`)
  console.log(`${equivTotal} déclaration(s) équivalentes — token d'un côté, littéral de l'autre, même valeur résolue`)
  if (declaredTotal) {
    console.log(`${declaredTotal} écart(s) assumé(s) — réels, délibérés, motivés au manifeste`)
  }
  if (dette.length) {
    console.log('\nDette — CD l\'a spécifié, on ne l\'a pas porté :')
    dette.forEach(([n, c]) => console.log(`  ${n.padEnd(12)} ${c.note ?? ''}`))
  }
  if (horsPerimetre.length) {
    console.log('\nHors périmètre — n\'existe que côté code, CD n\'a rien à en dire :')
    horsPerimetre.forEach(([n, c]) => console.log(`  ${n.padEnd(12)} ${c.note ?? ''}`))
  }
  process.exit(drifted.length === 0 ? 0 : 1)
}

/* ── mode deux ensembles ────────────────────────────────────────────────────── */

function runPair(filesA, filesB) {
  const A = index(filesA)
  const B = index(filesB)
  console.log(`A : ${filesA.length} fichiers · ${A.size} sélecteurs · ${countDecls(A)} déclarations`)
  console.log(`B : ${filesB.length} fichiers · ${B.size} sélecteurs · ${countDecls(B)} déclarations`)

  const { onlyA, onlyB, changed } = compare(A, B)
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
  section('DUPLIQUÉ ENTRE PLUSIEURS FICHIERS — côté A', dA.map(([k, v]) => `${k}  ←  ${[...v.origins].length} fichiers`))
  section('DUPLIQUÉ ENTRE PLUSIEURS FICHIERS — côté B', dB.map(([k, v]) => `${k}  ←  ${[...v.origins].length} fichiers`))

  const total = onlyA.length + onlyB.length + changed.length
  console.log(`\n${'═'.repeat(72)}`)
  console.log(`${total} écart(s) · ${dA.length} duplication(s) en A · ${dB.length} en B`)
  process.exit(total === 0 ? 0 : 1)
}

const argv = process.argv.slice(2)
if (argv[0] === '--manifest' || argv.length === 0) {
  runManifest()
}
else {
  const sep = argv.indexOf('--')
  if (sep === -1) {
    console.error('usage: css-diff.mjs --manifest   |   css-diff.mjs <A...> -- <B...>')
    process.exit(2)
  }
  runPair(argv.slice(0, sep), argv.slice(sep + 1))
}
