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
 * - translation: the note's `translation: "[[Other note]]"`, or the other note's pointing
 *   back, gives `translation: <other slug>` on both sides of the pair;
 * - Obsidian callouts become `{% callout %}`; the « imported from the blog » callout goes,
 *   and so do Ghost's flag callouts (« Looking for the english version? ») in a post that
 *   has a translation: the post's language switch replaces them;
 * - a post migrated from Ghost loses the feature image the import put at the top of its
 *   body (only callouts before it): it will get a cover of its own;
 * - `![[file]]` and remote images are copied into `public/writing/<slug>/`; an image a
 *   translation shares with its original is stored once, in the first note's folder;
 * - wikilinks and links to the old Ghost blog point at the migrated post when there is
 *   one (any note of the same folder), else become plain text (wikilinks) or stay as is;
 * - bold that Markdown would print as `**` (a space inside the delimiters) is mended, and
 *   so are stray single `*`;
 * - Ghost's 💡 cards keep a callout only when they open on a title, else they go back
 *   into the text; the 💡 marks go;
 * - headings lose their emoji and their bold, never skip a level, and lose the `---` Ghost
 *   put under them; a one-line quote opening on an emoji becomes a heading;
 * - a quote ending on its source (a URL, a link) becomes `{% quote source href %}`;
 * - an image and its caption become `{% figure %}`, with a real alt;
 * - a French post gets French spacing before `; : ? ! »` and after `«`;
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

/** the 💡 or the flag a Ghost card opens on */
const GHOST_MARK = /^\s*(?:💡|\p{Regional_Indicator}{2})\s*/u

/**
 * A Ghost 💡 card is a real aside only when it opens on a title (a short line, not a
 * sentence, followed by its text): it keeps a callout, the title in its attribute. Any
 * other card was a highlighted sentence, and the caller puts it back into the text: five
 * pinned notes on one post is wallpaper, not punctuation (critique 2026-11-02, n° 21).
 */
function ghostCard(lines: string[]): { title: string, body: string[] } | undefined {
  const first = lines[0].trim().replace(/^\*\*(.*)\*\*$/, '$1').trim()
  const rest = lines.slice(1)
  const plain = first.replace(/^"(.*)"$/, '$1')
  if (!rest.some(l => l.trim()) || plain.length > 90 || /[.:;,…]$/.test(plain))
    return undefined
  return { title: plain, body: rest.join('\n').trim().split('\n') }
}

/** `> [!type] title` blocks → `{% callout %}`. Plain blockquotes stay blockquotes. */
function convertCallouts(text: string, dropFlags = false): string {
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
    let title = head[2].trim()
    if (IMPORT_NOTICE.test(title) || IMPORT_NOTICE.test(content.join(' ')))
      continue
    // a Ghost card: an untitled note opening on 💡 (or on a flag, for the language switch)
    if (!title && content.length && GHOST_MARK.test(content[0])) {
      if (dropFlags && /^\s*\p{Regional_Indicator}{2}/u.test(content[0]))
        continue
      const isTip = content[0].trimStart().startsWith('💡')
      content[0] = content[0].replace(GHOST_MARK, '')
      if (isTip) {
        const card = ghostCard(content)
        if (!card) {
          // a highlighted sentence, not an aside: it goes back into the text
          out.push('', ...content, '')
          continue
        }
        title = card.title
        content.splice(0, content.length, ...card.body)
      }
    }
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

/**
 * Single `*` that Markdown would print: an empty emphasis between two words (`À* *priori`)
 * goes, a space just inside a closing `*` (`*hard skills – *`) moves outside, and a caption
 * Ghost split around a blank line (`*` alone, then `… ui.*`) is joined again.
 */
function fixItalic(text: string): string {
  return text
    .replace(/(\S)\* \*(\S)/g, '$1 $2')
    .replace(/(^|[\s(])\*([^*\s][^*\n]*?) \*(?=[\s,.;:!?)]|$)/gm, '$1*$2*')
    .replace(/^\*[ \t]*\n[ \t]*\n([^\n*][^\n]*\*)$/gm, '*$1')
}

/** a pictograph at the start of a heading or a pseudo-title (✅ 🤔 ❌ 🎯) */
const LEAD_EMOJI = /^(?:\p{Extended_Pictographic}\uFE0F?\s*)+/u

/**
 * What Ghost made of headings, mended in one pass over the lines:
 * - an emoji opening a heading goes (it broke the page's one ink), and so does bold
 *   wrapping a whole heading;
 * - a level never skips: `#####` under `###` becomes `####`;
 * - a one-line quote opening on an emoji was a pseudo-title (« 🎯 Faire passer un
 *   entretien… »): it becomes the heading one level under the current one;
 * - a `---` right under a heading drew a second rule under the heading's own.
 */
function mendHeadings(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  let level = 1
  let afterHeading = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const heading = line.match(/^(#{1,6})\s(.*)$/)
    const pseudo = !heading
      && /^>\s*\p{Extended_Pictographic}/u.test(line)
      && !(lines[i + 1] ?? '').startsWith('>')
      && !(lines[i - 1] ?? '').startsWith('>')
    if (heading || pseudo) {
      const wanted = heading ? heading[1].length : Math.min(level + 1, 4)
      const depth = Math.max(2, Math.min(wanted, level + 1))
      const title = (heading ? heading[2] : line.replace(/^>\s*/, ''))
        .trim()
        .replace(LEAD_EMOJI, '')
        .replace(/^\*\*(.*)\*\*$/, '$1')
        .trim()
      out.push(`${'#'.repeat(depth)} ${title}`)
      level = depth
      afterHeading = true
      continue
    }
    if (afterHeading && /^[-*_]{3,}\s*$/.test(line))
      continue
    if (line.trim())
      afterHeading = false
    out.push(line)
  }
  return out.join('\n')
}

/**
 * Plain quotes, the ones that are not callouts:
 * - a line glued under a quote without `>` is Markdown's lazy continuation, which pulled
 *   the author's own comment into the quote: a blank line ends the quote first;
 * - a last line that is a bare URL or opens on a link names the source: the quote becomes
 *   `{% quote source href %}`, the source out of the quoted text (critique 2026-11-02, n° 6).
 */
function mendQuotes(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('>')) {
      out.push(lines[i])
      continue
    }
    const block: string[] = []
    while (i < lines.length && lines[i].startsWith('>'))
      block.push(lines[i++].replace(/^>\s?/, ''))
    i--
    if (lines[i + 1]?.trim())
      lines.splice(i + 1, 0, '')
    const last = block.at(-1)!.trim()
    const url = last.match(/^(https?:\/\/\S+)$/)
    const link = last.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)(.*)$/)
    if (block.length > 1 && (url || link)) {
      const source = url ? new URL(url[1]).hostname.replace(/^www\./, '') : `${link![1]}${link![3]}`.trim()
      const href = url ? url[1] : link![2]
      out.push(`{% quote source=${markdocString(source)} href=${markdocString(href)} %}`, ...block.slice(0, -1).map(l => l.trim()), '{% /quote %}')
      continue
    }
    out.push(...block.map(l => `> ${l}`))
  }
  return out.join('\n')
}

/** a 💡 opening a paragraph, as Ghost wrote its tips outside the cards */
function dropTipMarks(text: string): string {
  return text.replace(/^💡\s*/gmu, '')
}

/** the alt texts written for the migrated images, by public path and language */
const IMAGE_ALTS = JSON.parse(readFileSync(join(REPO, 'scripts/image-alts.json'), 'utf8')) as Record<string, Partial<Record<'fr' | 'en', string>>>

function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]+/g, '')
    .replace(/[^\S\u00A0\u202F]+/g, ' ')
    .trim()
}

/**
 * An image alone on its line, and its caption when the next line is one (`*…*` in italic,
 * or a bare URL: the tweet it shows) → `{% figure %}`, the caption as its children. The alt
 * comes from `scripts/image-alts.json`, else the note's own unless it is the post's title,
 * else the caption: Ghost gave every image the post's title (critique 2026-11-02, n° 9).
 * A new image without an entry in the file is reported on the console.
 */
function figures(text: string, note: Note): string {
  return text.replace(
    /^!\[([^\]]*)\]\((\S+?)\)[ \t]*(?:\n(\*[^\n]+\*|https?:\/\/\S+)[ \t]*)?$/gm,
    (_, alt: string, src: string, caption?: string) => {
      let children = ''
      if (caption?.startsWith('http')) {
        const u = new URL(caption)
        children = `[${u.hostname.replace(/^www\./, '')}${u.pathname}](${caption})`
      }
      else if (caption) {
        children = caption.replace(/^\*(.*)\*$/, '$1').trim()
      }
      const own = alt.trim() && alt.trim() !== note.title ? alt.trim() : ''
      const text = IMAGE_ALTS[src]?.[note.lang] || own || (children && plainText(children)) || ''
      if (!text)
        console.warn(`  ! ${basename(note.path)}: no alt for ${src}`)
      const attrs = `src=${markdocString(src)} alt=${markdocString(text)} kind="capture"`
      return children ? `{% figure ${attrs} %}\n${children}\n{% /figure %}` : `{% figure ${attrs} /%}`
    },
  )
}

/**
 * French typography for a French post: a narrow no-break space before `; ? ! »` and after
 * `«`, a no-break space before `:`. Only where the author typed a space, so URLs and code
 * are left alone; inline code spans are skipped (critique 2026-11-02, n° 16).
 */
function frenchSpacing(text: string): string {
  return text
    .split(/(`[^`\n]*`)/)
    .map((part, i) => (i % 2 === 1
      ? part
      : part
          .replace(/ +([;?»]|!(?!\[))/g, '\u202F$1')
          .replace(/ +:(?=\s|$)/gm, '\u00A0:')
          .replace(/« +/g, '«\u202F')))
    .join('')
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
    // a block tag and its content (not a self-closing `/%}` one)
    .replace(/^\{% (\w+)\b[^\n]*[^/\n] %\}\n[\s\S]*?\{% \/\1 %\}$/gm, '')
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
    .replace(/[^\S\u00A0\u202F]+/g, ' ')
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

/**
 * Publication dates of migrated posts whose note has no `posted_on`, keyed by Ghost slug.
 * Source: the `article:published_time` of the post on the old Ghost blog. A `posted_on`
 * in the note wins; once the note has one, its line here can go.
 */
const GHOST_DATES: Record<string, string> = {
  'looking-for-a-seed-en': '2024-01-22', // 2024-01-22T20:53:52Z, the day after the French one
}

/** the other note of a translated pair: its own `translation` wikilink, or the one pointing back */
function translationOf(note: Note, siblings: Note[]): Note | undefined {
  const target = (n: Note): string | undefined => {
    const m = typeof n.meta.translation === 'string' ? n.meta.translation.match(/\[\[([^\]|#]+)/) : undefined
    return m?.[1].trim()
  }
  const name = (n: Note): string => basename(n.path, extname(n.path))
  const own = target(note)
  return own
    ? siblings.find(n => name(n) === own)
    : siblings.find(n => target(n) === name(note))
}

async function convert(note: Note, siblings: Note[]): Promise<string> {
  const bySlug = new Set(siblings.map(n => n.slug))
  const byTitle = new Map(siblings.map(n => [basename(n.path, extname(n.path)), n.slug]))

  let date = asDate(note.meta.posted_on) ?? asDate(note.meta.pubDate) ?? GHOST_DATES[note.slug]
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
  const translation = translationOf(note, siblings)
  if (typeof note.meta.translation === 'string' && !translation)
    throw new Error(`${basename(note.path)}: translation ${note.meta.translation} is not a note of the folder`)
  let body = dropGhostCover(outsideCode(note.body, text => fixItalic(fixBold(convertCallouts(unquoteImages(text), Boolean(translation))))), Boolean(link && ghostSlug(link)))
  const hasH1 = /^# /m.test(body.replace(/^```[\s\S]*?\n```.*$/gm, ''))
  body = outsideCode(body, text => mendQuotes(dropTipMarks(mendHeadings(rewriteLinks(demoteHeadings(text, hasH1), bySlug, byTitle)))))
  body = await localizeImages(body, note, siblings)
  body = outsideCode(body, text => figures(text, note))
  if (note.lang === 'fr')
    body = outsideCode(body, frenchSpacing)
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
    ...(translation && { translation: translation.slug }),
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
