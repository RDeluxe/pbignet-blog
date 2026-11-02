/**
 * vault-to-post.ts — turns an Obsidian note from the vault into a `writing` entry.
 *
 *   pnpm post:import                     → every note of VAULT_ARTICLES_DIR
 *   pnpm post:import <note.md> [...]     → only these notes
 *
 * One note becomes `src/content/writing/<slug>.mdoc`, and its images land in
 * `public/writing/<slug>/`. Re-running rewrites the same files: images already on disk
 * are not downloaded again (and never re-encoded), so a re-run is offline and stable.
 *
 * VAULT_ARTICLES_DIR is machine data, not repo data: it comes from the shell or the
 * repo's `.env` (gitignored), like OD_PROJECT_DIR for sync-od.
 *
 * What the conversion does, in order:
 * - frontmatter: title (file name without the « FR - » prefix and « (EN) » suffix,
 *   `title:` in the note wins), `posted_on`, the kind (Note up to a 5-minute read, else
 *   Essay; `tag:` in the note wins), tags as readable labels, series, language, the old
 *   Ghost URL (`link`), a description (first paragraph, `description:` in the note wins), a
 *   reading time;
 * - slug: the Ghost slug when the note has a `link` (old URLs keep their path), else the
 *   title, slugified;
 * - Obsidian callouts become `{% callout %}`; the « imported from the blog » callout goes;
 * - a post migrated from Ghost loses the feature image the import put at the top of its
 *   body (only callouts before it): it will get a cover of its own;
 * - `![[file]]` and remote images are copied into `public/writing/<slug>/`; an image a
 *   translation shares with its original is stored once, in the first note's folder;
 * - wikilinks and links to the old Ghost blog point at the migrated post when there is
 *   one (any note of the same folder), else become plain text (wikilinks) or stay as is;
 * - bold that Markdown would print as `**` (a space inside the delimiters) is mended;
 * - when the body uses `#` headings, every heading moves down a level: the page owns h1.
 */

import { Buffer } from 'node:buffer'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import process from 'node:process'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

const REPO = resolve(import.meta.dirname, '..')
const CONTENT_DIR = join(REPO, 'src/content/writing')
const PUBLIC_DIR = join(REPO, 'public')
const GHOST_HOST = 'blog.pierrickbignet.com'
const WORDS_PER_MINUTE = 230

interface Note {
  path: string
  meta: Record<string, unknown>
  body: string
  title: string
  slug: string
  lang: 'fr' | 'en'
}

/* ------------------------------------------------------------------ reading notes */

function splitFrontmatter(source: string): { meta: Record<string, unknown>, body: string } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match)
    return { meta: {}, body: source }
  return { meta: (parseYaml(match[1]) ?? {}) as Record<string, unknown>, body: source.slice(match[0].length) }
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function ghostSlug(url: string): string | undefined {
  try {
    const u = new URL(url)
    if (u.hostname !== GHOST_HOST)
      return undefined
    const slug = u.pathname.split('/').filter(Boolean)[0]
    return slug && slug !== 'content' ? slug : undefined
  }
  catch {
    return undefined
  }
}

/** French or English: the file name says it for translations, the words say it otherwise */
function detectLang(name: string, meta: Record<string, unknown>, body: string): 'fr' | 'en' {
  if (meta.lang === 'fr' || meta.lang === 'en')
    return meta.lang
  if (name.startsWith('FR - '))
    return 'fr'
  if (/\(EN\)$/.test(name))
    return 'en'
  const count = (re: RegExp) => (body.match(re) ?? []).length
  const fr = count(/\b(?:le|la|les|des|est|une|et|que|pour|dans)\b/gi)
  const en = count(/\b(?:the|and|is|are|of|that|for|with|this)\b/gi)
  return fr > en ? 'fr' : 'en'
}

function readNote(path: string): Note {
  const name = basename(path, extname(path))
  const { meta, body } = splitFrontmatter(readFileSync(path, 'utf8'))
  const title = typeof meta.title === 'string'
    ? meta.title
    : name.replace(/^FR - /, '').replace(/\s*\(EN\)$/, '').trim()
  const link = typeof meta.link === 'string' ? meta.link : undefined
  const slug = (link && ghostSlug(link)) || slugify(title)
  return { path, meta, body, title, slug, lang: detectLang(name, meta, body) }
}

/* ------------------------------------------------------------------ images */

/** Obsidian keeps attachments in an `attachments/` folder somewhere above the note */
function findAttachment(noteDir: string, file: string): string | undefined {
  let dir = noteDir
  for (let i = 0; i < 6; i++) {
    for (const candidate of [join(dir, file), join(dir, 'attachments', file)]) {
      if (existsSync(candidate))
        return candidate
    }
    dir = dirname(dir)
  }
  return undefined
}

function imageFileName(src: string): string {
  if (/^https?:/.test(src)) {
    const u = new URL(src)
    const base = basename(u.pathname)
    const fm = u.searchParams.get('fm')
    const ext = extname(base) || (fm ? `.${fm}` : '.jpg')
    return `${slugify(basename(base, extname(base)))}${ext.toLowerCase()}`
  }
  return `${slugify(basename(src, extname(src)))}${extname(src).toLowerCase()}`
}

async function fetchImage(url: string, dest: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`${response.status} ${response.statusText} — ${url}`)
  writeFileSync(dest, Buffer.from(await response.arrayBuffer()))
}

/**
 * copies or downloads every image of the body, returns the body with local paths.
 * An image several notes use (a translation's) is stored once, in the folder of the
 * first of them by file name: the others point at it.
 */
async function localizeImages(body: string, note: Note, siblings: Note[]): Promise<string> {
  const jobs: Promise<void>[] = []
  const used = new Set<string>()

  const place = (src: string): string => {
    // the `![[file]]` pass already wrote this one
    if (src.startsWith('/writing/'))
      return src
    const owner = siblings
      .filter(n => n.body.includes(src))
      .sort((a, b) => a.path.localeCompare(b.path))[0] ?? note
    const file = imageFileName(src)
    const dir = join(PUBLIC_DIR, 'writing', owner.slug)
    const dest = join(dir, file)
    if (!used.has(dest)) {
      used.add(dest)
      mkdirSync(dir, { recursive: true })
      if (!existsSync(dest)) {
        if (/^https?:/.test(src)) {
          jobs.push(fetchImage(src, dest))
        }
        else {
          const found = findAttachment(dirname(owner.path), src)
          if (!found)
            throw new Error(`${basename(owner.path)}: attachment not found — ${src}`)
          copyFileSync(found, dest)
        }
      }
    }
    return `/writing/${owner.slug}/${file}`
  }

  const out = body
    // ![[file.png]] or ![[file.png|300]]
    .replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (_, file: string) => `![](${place(file.trim())})`)
    // ![alt](url)
    .replace(/!\[([^\]]*)\]\((\S+?)(?:\s+"[^"]*")?\)/g, (_, alt: string, src: string) => `![${alt}](${place(src)})`)

  await Promise.all(jobs)
  return out
}

/* ------------------------------------------------------------------ body transforms */

/** applies `fn` to the parts of the body outside fenced code blocks */
function outsideCode(body: string, fn: (text: string) => string): string {
  return body
    .split(/(^```[\s\S]*?\n```[^\n]*$)/m)
    .map((part, i) => (i % 2 === 1 ? part : fn(part)))
    .join('')
}

const CALLOUT_TAGS: Record<string, string | undefined> = {
  note: undefined, // the component's default, « N.B. »
  info: 'Info',
  tip: 'Tip',
  hint: 'Tip',
  important: 'Important',
  warning: 'Caveat',
  caution: 'Caveat',
  attention: 'Caveat',
  quote: 'Quote',
  example: 'Example',
}

const IMPORT_NOTICE = /import[ée]+s? depuis le blog/i

function markdocString(value: string): string {
  return JSON.stringify(value)
}

/** `> [!type] title` blocks → `{% callout %}`. Plain blockquotes stay blockquotes. */
function convertCallouts(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i].match(/^> *\[!(\w+)\][+-]?(.*)$/)
    if (!head) {
      out.push(lines[i])
      continue
    }
    const content: string[] = []
    while (i + 1 < lines.length && lines[i + 1].startsWith('>')) {
      i++
      content.push(lines[i].replace(/^>\s?/, ''))
    }
    const type = head[1].toLowerCase()
    const title = head[2].trim()
    if (IMPORT_NOTICE.test(title) || IMPORT_NOTICE.test(content.join(' ')))
      continue
    const attrs: string[] = []
    const tag = CALLOUT_TAGS[type] ?? (type in CALLOUT_TAGS ? undefined : type.toUpperCase())
    if (tag)
      attrs.push(`tag=${markdocString(tag)}`)
    if (title)
      attrs.push(`title=${markdocString(title)}`)
    out.push(`{% callout${attrs.length ? ` ${attrs.join(' ')}` : ''} %}`, ...content, '{% /callout %}')
  }
  return out.join('\n')
}

/**
 * Ghost's feature image, which the import put at the top of the body: an image line
 * with nothing but callouts before it. Only for posts migrated from Ghost; the post
 * gets a new cover of its own.
 */
function dropGhostCover(text: string, fromGhost: boolean): string {
  if (!fromGhost)
    return text
  const match = text.match(/^((?:\s*\{% callout[\s\S]*?\{% \/callout %\})*\s*)!\[[^\]]*\]\([^)\s]+(?:\s+"[^"]*")?\)[ \t]*(?:\n|$)/)
  return match ? match[1] + text.slice(match[0].length) : text
}

/** a blockquote line holding nothing but an image is a Ghost import artefact */
function unquoteImages(text: string): string {
  return text.replace(/^>\s*(!\[[^\]]*\]\([^)]+\))\s*$/gm, '$1')
}

/**
 * `**` that Markdown would print as is: a space just inside the delimiters (`**word **`)
 * moves outside, and an opening `**` glued to an emoji and followed by punctuation
 * (`💡**"…"**`) gets a space before it.
 */
function fixBold(text: string): string {
  return text
    .replace(/\*\*([^*`\n]+)\*\*/g, (whole, inner: string) => {
      const trimmed = inner.trim()
      if (!trimmed || trimmed === inner)
        return whole
      return `${inner.match(/^\s*/)![0]}**${trimmed}**${inner.match(/\s*$/)![0]}`
    })
    .replace(/(\p{Extended_Pictographic}\uFE0F?)\*\*(?=\p{P})/gu, '$1 **')
}

function demoteHeadings(text: string, enabled: boolean): string {
  if (!enabled)
    return text
  return text.replace(/^(#{1,6})(\s)/gm, (_, hashes: string, space: string) => `${'#'.repeat(Math.min(hashes.length + 1, 6))}${space}`)
}

function rewriteLinks(text: string, bySlug: Set<string>, byTitle: Map<string, string>): string {
  return text
    // [[Target]], [[Target|alias]], [[Target#heading|alias]] — not embeds
    .replace(/(?<!!)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, target: string, alias?: string) => {
      const label = (alias ?? target).trim()
      const slug = byTitle.get(target.trim())
      return slug ? `[${label}](/writing/${slug})` : label
    })
    // links to a post of the old Ghost blog that has been migrated
    .replace(/\]\((https?:\/\/[^)\s]+)\)/g, (whole, url: string) => {
      const slug = ghostSlug(url)
      return slug && bySlug.has(slug) ? `](/writing/${slug})` : whole
    })
}

/** the first real paragraph, as plain text */
function describe(body: string): string {
  const paragraph = body
    .replace(/^```[\s\S]*?\n```.*$/gm, '')
    .replace(/^\{%[\s\S]*?\n\{% \/callout %\}$/gm, '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .find(p => p
      && !/^(?:#|>|!\[|\{%|[-*_]{3,}$|[-*+] |\d+\. )/.test(p)
      && !/^([*_]).*\1$/s.test(p))
    ?? ''
  const plain = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= 200)
    return plain
  const cut = plain.slice(0, 200)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '')}…`
}

function readingTime(body: string): number {
  const words = body
    .replace(/\{%[^%]*%\}/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .length
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}

function asDate(value: unknown): string | undefined {
  if (value instanceof Date)
    return value.toISOString().slice(0, 10)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))
    return value.slice(0, 10)
  return undefined
}

/**
 * Essay or Note, the site's two kinds of post (NORTHSTAR: « short essays and field
 * notes »): a short read is a note. `tag:` in the note wins.
 */
const NOTE_MAX_MINUTES = 5

function postTag(meta: Record<string, unknown>, minutes: number): 'Essay' | 'Note' {
  if (meta.tag === 'Essay' || meta.tag === 'Note')
    return meta.tag
  return minutes <= NOTE_MAX_MINUTES ? 'Note' : 'Essay'
}

/** the vault's tags are short slugs; the article head prints them as secondary tags */
const TAG_LABELS: Record<string, string> = {
  ai: 'AI',
  dev: 'Dev',
  gd: 'Game design',
  management: 'Management',
  social: 'Social',
}

function asList(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((v): v is string => typeof v === 'string' && v.trim() !== '')
  return typeof value === 'string' && value.trim() ? [value.trim()] : []
}

/* ------------------------------------------------------------------ conversion */

async function convert(note: Note, siblings: Note[]): Promise<string> {
  const bySlug = new Set(siblings.map(n => n.slug))
  const byTitle = new Map(siblings.map(n => [basename(n.path, extname(n.path)), n.slug]))

  let date = asDate(note.meta.posted_on) ?? asDate(note.meta.pubDate)
  if (!date) {
    // a translation without a date takes its original's, the note it links to
    const linked = [...note.body.matchAll(/\[\[([^\]|#]+)/g)]
      .map(m => siblings.find(n => basename(n.path, extname(n.path)) === m[1].trim()))
      .find(n => n && asDate(n.meta.posted_on))
    date = linked && asDate(linked.meta.posted_on)
    if (!date)
      throw new Error(`${basename(note.path)}: no posted_on, and no dated note linked from it`)
    console.warn(`  ! ${basename(note.path)}: no posted_on, takes ${date} from « ${basename(linked!.path)} »`)
  }

  const link = typeof note.meta.link === 'string' && note.meta.link ? note.meta.link : undefined
  let body = dropGhostCover(outsideCode(note.body, text => fixBold(convertCallouts(unquoteImages(text)))), Boolean(link && ghostSlug(link)))
  const hasH1 = /^# /m.test(body.replace(/^```[\s\S]*?\n```.*$/gm, ''))
  body = outsideCode(body, text => rewriteLinks(demoteHeadings(text, hasH1), bySlug, byTitle))
  body = await localizeImages(body, note, siblings)
  body = `${body.trim().replace(/\n{3,}/g, '\n\n')}\n`

  const minutes = readingTime(body)
  const series = typeof note.meta.serie === 'string' && note.meta.serie ? note.meta.serie : undefined
  const frontmatter = {
    title: note.title,
    description: typeof note.meta.description === 'string' ? note.meta.description : describe(body),
    pubDate: date,
    tag: postTag(note.meta, minutes),
    readTime: minutes,
    lang: note.lang,
    tags: asList(note.meta.tags).map(t => TAG_LABELS[t] ?? t),
    ...(series && { series }),
    ...(link && { link }),
  }

  const file = join(CONTENT_DIR, `${note.slug}.mdoc`)
  writeFileSync(file, `---\n${stringifyYaml(frontmatter, { lineWidth: 0 })}---\n\n${body}`)
  return file
}

function loadEnv(): void {
  if (process.env.VAULT_ARTICLES_DIR)
    return
  try {
    process.loadEnvFile(join(REPO, '.env'))
  }
  catch {}
}

async function main(): Promise<void> {
  loadEnv()
  const args = process.argv.slice(2)
  let targets: string[]
  if (args.length) {
    targets = args.map(a => resolve(a))
  }
  else {
    const dir = process.env.VAULT_ARTICLES_DIR
    if (!dir)
      throw new Error('give note paths, or set VAULT_ARTICLES_DIR (shell or .env)')
    targets = readdirSync(dir).filter(f => f.endsWith('.md')).sort().map(f => join(dir, f))
  }

  // the notes next to each target are the posts a link may point at
  const folders = new Map<string, Note[]>()
  for (const dir of new Set(targets.map(t => dirname(t)))) {
    folders.set(dir, readdirSync(dir).filter(f => f.endsWith('.md')).map(f => readNote(join(dir, f))))
  }

  mkdirSync(CONTENT_DIR, { recursive: true })
  for (const target of targets) {
    const siblings = folders.get(dirname(target))!
    const note = siblings.find(n => n.path === target) ?? readNote(target)
    const file = await convert(note, siblings)
    console.log(`✓ ${basename(target)} → ${file.slice(REPO.length + 1)}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
