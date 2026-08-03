# Brief for Claude Design — restructure the CSS into per-component files

## Why

The blog is being built in Astro, where each component owns its own scoped CSS.
Today your CSS lives in two places at once: `assets/paper.css` (398 lines) and the
`<style>` blocks of the gold pages (101 lines in `01_Home.html`, 275 in `02_Article.html`).
That makes it impossible to tell, mechanically, whether a component has changed —
and five classes exist in **both** places, so one silently wins by cascade order.

If your CSS is split the same way the Astro components are, a change on either side
becomes a readable diff instead of a guess. **You stay the author of the design.**
This is about where the CSS lives, not what it says.

## Hard rule

**Do not change a single value.** No colour, size, spacing, timing, or selector
semantics. This is a move-and-split operation only. The two gold pages must render
pixel-identical before and after. If you find yourself wanting to improve something
while moving it, stop and note it separately instead.

## 1. Split into one file per component

Create `assets/components/<Name>.css`, one per component, named exactly as listed in
the table below. `paper.css` keeps only the shared foundation and gains an `@import`
list at the top:

```css
/* paper.css */
@import 'components/Wrap.css';
@import 'components/Metabar.css';
/* … one line per component, in the order below … */

/* then, as today: reset, :root tokens, paper surface + texture layers,
   .page, .topo-layer, .grain-layer, .vignette, focus-visible, print
   and reduced-motion rules */
```

The gold pages keep their single unchanged `<link rel="stylesheet" href="assets/paper.css">`.
Nothing to edit in the `<head>`.

If `@import` does not resolve in the preview renderer, tell us — the fallback is one
`<link>` per component in each page, and we would rather know than have you work
around it silently.

## 2. Empty the `<style>` blocks of the gold pages

All 376 lines move into the component files. After this, `01_Home.html` and
`02_Article.html` should contain **no `<style>` block at all**.

Four of the five duplicated classes are pure disorder — move them and delete the
duplicate:

- **`.coll-grid`** — the three rules in `paper.css:385-387` and `01_Home:68-70` are
  identical. Keep one, in `CollCard.css`.
- **`.gear`** — the component is cut in half: `paper.css` has `position: relative`
  plus the tile hover, the page has the actual box (border, padding, flex, hover).
  Both go to `GearCard.css`, except the shared tile hover → see `Tile.css` below.
- **`.page`** — `paper.css` has `position/z-index`, the page adds `padding-bottom: 0`.
  Both belong in `paper.css`; keep them together there.
- **`.topo-layer`** — not a real collision, the article only adds a print rule. Leave
  the print rule in the page-level print block or in `paper.css`, your call.

## 3. One question we cannot answer for you

**`.frame` genuinely diverges.** In `paper.css` it is `position: relative` with
`.dither-canvas { display: none }` — dither off by default. In `02_Article` it becomes
`overflow: hidden`, `background: #14110a`, `aspect-ratio: 1066/1422`, and
`.dither-canvas { display: block }` — dither on, fixed ratio.

Is the article version a **variant of the same component** (so:
`.frame[data-dither='on']` with the ratio as a variant too), or are these **two
different components** that happen to share a name? Pick one and say which — we will
mirror your decision, not invent one.

## 4. Variants as `data-*` instead of suffixed classes

Astro passes component options as props, which land in the DOM as `data-*`
attributes. Writing your variants the same way makes the two sides comparable
line by line. This is plain valid CSS and changes nothing about the rendering:

| today | instead |
| --- | --- |
| `.tag-accent` | `.tag[data-accent='on']` |
| `.rule-thick` | `.rule[data-weight='thick']` |
| `.lead-serif` | `.lede[data-size='section']` |
| `.hero-intro` | `.lede[data-size='intro']` |
| `.figure.wide .frame` | `.figure[data-width='wide'] .frame` |

Update the markup in the gold pages to match (`class="tag tag-accent"` becomes
`class="tag" data-accent="on"`). Apply the same shape to any other variant you find
expressed as a suffixed class or a second class.

Note `.lead-serif` and `.hero-intro` become **one** component, `Lede`, with two
scales. They stay two distinct sizes — we are not merging the values, only the name.

## 5. File names and what goes in them

Use these exact file names. The class list is what we found on your side; move
each class into the file on its row.

| file | classes to move |
| --- | --- |
| `Wrap.css` | `.wrap` |
| `Metabar.css` | `.metabar`, `.metabar .m`, `.metabar .brand` |
| `MainNav.css` | `nav.main`, `.lock`, `.sp` |
| `Hero.css` | `.hero2`, `.hero2-stage`, `.hero2-bc`, `.hero2-credit`, `.photo-plane`, `.ctype`, `.hero-kick`, `.hero-role`, `.hero-serif` |
| `Lede.css` | `.lead-serif`, `.hero-intro` → `.lede[data-size]` |
| `SectionHead.css` | `.shead`, `.shead-meta` |
| `PostRow.css` | `.post`, `.idx`, `.ptitle`, `.pdesc`, `.pmeta` |
| `Tag.css` | `.tag`, `.tag-accent` → `.tag[data-accent]` |
| `CollCard.css` | `.coll`, `.coll-foot`, `.coll-grid` |
| `GearCard.css` | `.gear`, `.gear-grid`, `.gnum`, `.gname`, `.gmeta` |
| `Tile.css` | the shared interactive-box hover: the corner crosses currently written as `.coll:hover::after, .gear:hover::after`. It is one behaviour used by two components (the D2 vocabulary) — give it its own file so it has one definition. |
| `PhotoFrame.css` | `.pframe`, `.pc` |
| `FeaturedEssay.css` | `.feature`, `.ftag`, `.fword`, `.fmeta` |
| `SiteFooter.css` | `footer.site`, `.foot-grid`, `.foot-brand`, `.fb-sub`, `.foot-col`, `.foot-credit`, `.foot-right` |
| `Plate.css` | `.plate` and its grid/frame rules (B6) |
| `Callout.css` | `.callout` and its parts (E1) |
| `Button.css` | `.btn` and the dither hover fill |
| `Barcode.css` | `.barcode`, `.barcode-num` |
| `RegMarks.css` | `.regmark` and its corner rules |
| `MonoLabel.css` | `.mono-label`, `.mono` |
| `Rule.css` | `.rule`, `.rule-thick` → `.rule[data-weight]`, `.tick` |
| `ArticleBar.css` | `.topbar`, `.tb-in`, `.tb-back`, `.tb-title`, `.progress` |
| `ArticleHead.css` | `.art-title`, `.art-byline`, `.art-dek`, `.art-tags`, `.art-end` |
| `ArticlePlate.css` | `.figure`, `.figcap`, `.frame` (per your answer in §3) |
| `PullQuote.css` | `.pull` |
| `StatRow.css` | `.statrow` |
| `HeroPopColor.css` | `.post-hero`, `.ph-word`, `.ph-sub`, `.ph-vcap`, `.ph-cue`, `.ph-kicker` |
| `Prose.css` | `.prose` |
| `ImageSlot.css` | the `image-slot` empty-state rules |

Stays in `paper.css`: reset, `:root` tokens, the paper surface and texture layers
(`.page`, `.topo-layer`, `.grain-layer`, `.vignette`), the focus ring, the print
block, the reduced-motion block.

## 6. Dead and unused, for you to rule on

Seven classes in `paper.css` are not used by either gold page:

- **`.frame-marks`** — `Design Notes.md` records the film notches as *removed from the
  gold* (July 2026), and nothing uses it. Delete unless you disagree.
- **`.plate`, `.callout`, `.btn`** — the July 2026 box vocabulary, validated but not yet
  used in a gold page. Keep, obviously. Flagging them only so you know we know.
- **`.rule`, `.rule-thick`, `.tick`** — unused. Still wanted, or gone? Your call.

## 7. Keep it this way

Two conventions worth recording in `0_NORTHSTAR.html` under build conventions, so
they survive the next session:

1. **A component's CSS lives in exactly one file**, `assets/components/<Name>.css`.
   Page `<style>` blocks stay empty — if a page needs something, it is either a
   component or a variant of one.
2. **Variants are `data-*` attributes**, never suffixed classes.
