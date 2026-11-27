// @ts-check
/**
 * cover-save — the "Save" button of the cover editor (`/ds/hero-pop-color`), dev server only.
 *
 * An Astro integration whose only hook is `astro:server:setup`: the endpoint exists in
 * `astro dev` and nowhere else, never in a build. It writes the recipe the editor sends
 * (the same one "Copy recipe" prints) into the `cover:` block of a post's frontmatter,
 * and of its translation when asked. Fields the recipe does not carry (`kind`, `alt`,
 * `kicker`, `place`, `method`, `vcap`) are kept as they are; the rest of the file is not
 * touched.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const ROUTE = '/__cover-save'
const WRITING = new URL('../src/content/writing/', import.meta.url)
const PUBLIC = new URL('../public/', import.meta.url)

/** the recipe fields, in the order the block is written; `src` and `alt` come from the request or the file */
const KEPT = ['kicker', 'place', 'method', 'vcap']

/** the `spot` fields the editor sets; any other one in the file (e.g. `fps`) is kept as it is */
const MODELLED = ['keepColor', 'ink', 'paper', 'cell', 'contrast', 'brightness', 'boil', 'hueMode', 'hueTol', 'hueSoft', 'satMin', 'satSoft', 'hueLo', 'hueSpan', 'satBoost', 'invert', 'pop', 'keepSharp', 'ground', 'groundMix', 'groundSat', 'groundLift', 'masks']

/**
 * The editor reads only a plain `<n>%` titleX and a plain `<n>vh` height; anything else (unset,
 * `var(--gutter)`, `min(92vh, 880px)`) comes back as its fallback, `4%` or `100vh`. That
 * fallback, unedited, must not replace what the file says.
 * @param {unknown} old @param {unknown} sent @param {RegExp} plain @param {string} fallback
 */
function unread(old, sent, plain, fallback) {
  return sent === fallback && !(typeof old === 'string' && plain.test(old.trim())) ? old : sent
}

/** @param {string} slug */
function postFile(slug) {
  if (!/^[\w-]+$/.test(slug))
    return null
  for (const ext of ['mdoc', 'md']) {
    const url = new URL(`${slug}.${ext}`, WRITING)
    if (existsSync(url))
      return url
  }
  return null
}

/** a photo of the repo: a path under `/photos/source/` that exists in `public/` */
/** @param {unknown} src */
export function repoPhoto(src) {
  return typeof src === 'string'
    && /^\/photos\/source\/[\w.-]+$/.test(src)
    && !src.includes('..')
    && existsSync(new URL(`.${src}`, PUBLIC))
    && statSync(new URL(`.${src}`, PUBLIC)).isFile()
}

/* ---- YAML, in the hand-written style of the existing cover blocks ---- */

/** invisible characters (soft hyphen, zero-width, controls) stay visible in the file as escapes */
// eslint-disable-next-line no-control-regex -- control characters are exactly what it looks for
const INVISIBLE = /[\u0000-\u001F\u007F\u00AD\u200B-\u200F\u2060\uFEFF]/g

/** @param {string} s */
function str(s) {
  if (INVISIBLE.test(s)) {
    INVISIBLE.lastIndex = 0
    return `"${s.replace(/["\\]/g, c => `\\${c}`).replace(INVISIBLE, c => `\\u${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`)}"`
  }
  INVISIBLE.lastIndex = 0
  // plain when YAML reads it back as this very string, quoted otherwise
  const plain = s.trim() === s && s !== '' && !/^[-?:,[\]{}#&*!|>'"%@`]/.test(s) && !/: | #|[\n\t]/.test(s) && !s.endsWith(':')
  if (plain) {
    try {
      if (parse(`k: ${s}`)?.k === s)
        return s
    }
    catch {}
  }
  return `'${s.replace(/'/g, '\'\'')}'`
}

/** @param {unknown} v */
function scalar(v) {
  if (typeof v === 'string')
    return str(v)
  if (Array.isArray(v))
    return `[${v.map(scalar).join(', ')}]`
  return String(v)
}

/**
 * @param {Record<string, any>} m
 * @param {string} pad
 */
function maskLines(m, pad) {
  const keys = ['mode', 'ink', 'paper', 'contrast', 'brightness', 'cell', 'curve', 'pts'].filter(k => m[k] != null)
  return keys.map((k, i) => `${pad}${i ? '  ' : '- '}${k}: ${scalar(m[k])}`)
}

/**
 * The `cover:` block.
 * @param {Record<string, any>} cover
 */
export function coverBlock(cover) {
  const lines = ['cover:']
  for (const [k, v] of Object.entries(cover)) {
    if (v == null)
      continue
    if (k === 'focal') {
      lines.push(`  focal: { x: ${v.x}, y: ${v.y} }`)
    }
    else if (k === 'spot') {
      lines.push('  spot:')
      for (const [sk, sv] of Object.entries(v)) {
        if (sk === 'masks') {
          lines.push('    masks:')
          for (const m of sv)
            lines.push(...maskLines(m, '      '))
        }
        else {
          lines.push(`    ${sk}: ${scalar(sv)}`)
        }
      }
    }
    else {
      lines.push(`  ${k}: ${scalar(v)}`)
    }
  }
  return lines.join('\n')
}

/**
 * The same value with its keys sorted and its empty entries dropped: two covers compare by it.
 * @param {unknown} v
 * @returns {unknown} the canonical value
 */
function canonical(v) {
  if (Array.isArray(v))
    return v.map(canonical)
  if (v && typeof v === 'object')
    return Object.fromEntries(Object.entries(v).filter(([, x]) => x != null).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, canonical(x)]))
  return v
}

/**
 * The block, refused unless YAML reads it back as this very cover: a key or a value that
 * would write anything else into the frontmatter (a line break, an object where a number
 * goes, a field the block does not know) stops the save.
 * @param {Record<string, any>} cover
 */
function safeBlock(cover) {
  const block = coverBlock(cover)
  let back
  try {
    back = parse(block)?.cover
  }
  catch {}
  if (JSON.stringify(canonical(back)) !== JSON.stringify(canonical(cover)))
    throw new Error('the recipe does not write back as itself: refused')
  return block
}

/**
 * The post's source with its `cover:` block replaced (or added at the end of the frontmatter).
 * @param {string} text the whole file
 * @param {{ src: string, alt?: string, recipe: Record<string, any> }} input
 */
export function withCover(text, { src, alt, recipe }) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)
  if (!fm)
    throw new Error('no frontmatter')
  const old = parse(fm[1])?.cover ?? {}
  const finalAlt = old.alt ?? alt
  if (!finalAlt)
    throw new Error('this post has no cover yet: give its alt text')
  const cover = {
    kind: old.kind ?? 'pop-color',
    src,
    alt: finalAlt,
    word: recipe.word,
    ...Object.fromEntries(KEPT.map(k => [k, old[k]])),
    titleX: old.titleX == null ? recipe.titleX : unread(old.titleX, recipe.titleX, /^-?[\d.]+%$/, '4%'),
    titleY: recipe.titleY,
    titleYMobile: recipe.titleYMobile,
    titleInk: recipe.titleInk,
    height: unread(old.height, recipe.height, /^[\d.]+vh$/, '100vh'),
    focal: recipe.focal,
    spot: {
      ...Object.fromEntries(Object.entries(old.spot ?? {}).filter(([k]) => !MODELLED.includes(k))),
      // no boil sent (an editor under reduced motion shows it at 0): the file's stays
      ...(recipe.spot.boil == null && old.spot?.boil != null ? { boil: old.spot.boil } : {}),
      ...recipe.spot,
    },
  }

  const lines = fm[1].split('\n')
  const start = lines.findIndex(l => l.startsWith('cover:'))
  let end = start
  if (start >= 0) {
    end = start + 1
    while (end < lines.length && !/^\S/.test(lines[end]))
      end++
  }
  const block = safeBlock(cover).split('\n')
  if (start >= 0)
    lines.splice(start, end - start, ...block)
  else
    lines.push(...block)
  return text.replace(fm[0], () => `---\n${lines.join('\n')}\n---`)
}

/** @param {import('node:http').IncomingMessage} req */
async function body(req) {
  let raw = ''
  for await (const chunk of req)
    raw += chunk
  return JSON.parse(raw)
}

/**
 * @param {{ slug: string, translation?: boolean, src: string, alt?: string, recipe: Record<string, any> }} input
 * @returns {string[]} the files written, relative to the repo
 */
export function saveCover({ slug, translation, src, alt, recipe }) {
  if (!repoPhoto(src))
    throw new Error(`${src} is not a photo of the repo (public/photos/source/)`)
  if (!recipe || typeof recipe !== 'object' || !recipe.spot)
    throw new Error('no recipe')
  const file = postFile(slug)
  if (!file)
    throw new Error(`no post ${slug}`)
  const files = [file]
  if (translation) {
    const other = parse(readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '')?.translation
    const otherFile = other && postFile(other)
    if (otherFile)
      files.push(otherFile)
  }
  // every file is rendered before any is written: a refusal leaves both untouched
  const next = files.map(f => withCover(readFileSync(f, 'utf8'), { src, alt, recipe }))
  files.forEach((f, i) => writeFileSync(f, next[i]))
  return files.map(f => `src/content/writing/${f.pathname.split('/').pop()}`)
}

/** @returns {import('astro').AstroIntegration} the integration, which only hooks the dev server */
export default function coverSave() {
  return {
    name: 'cover-save',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(ROUTE, async (req, res) => {
          const reply = (/** @type {number} */ code, /** @type {unknown} */ data) => {
            res.statusCode = code
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(data))
          }
          if (req.method !== 'POST')
            return reply(405, { error: 'POST only' })
          // only the editor's own page: a JSON request from this very origin, which another
          // site cannot send without a preflight the dev server does not answer
          if (!req.headers['content-type']?.startsWith('application/json'))
            return reply(415, { error: 'JSON only' })
          const origin = req.headers.origin
          if (!origin || origin !== `http://${req.headers.host}`)
            return reply(403, { error: 'same origin only' })
          try {
            reply(200, { files: saveCover(await body(req)) })
          }
          catch (e) {
            reply(400, { error: e instanceof Error ? e.message : String(e) })
          }
        })
      },
    },
  }
}
