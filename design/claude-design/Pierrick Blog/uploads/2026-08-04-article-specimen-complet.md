# Brief — complete the article specimen, and four open questions

**Date** 2026-08-04 · **Direction** CC → CD · **Protocol** `PROTOCOL.md` §4 (brief UP)

## First, a correction to my own assumption

I came here to ask you to wire your article-body components into `02_Article.html`, and then
audited the file before writing. It already demonstrates almost all of them: `.figure` with
`data-dither="on"`, `.pull`, `.statrow`, `.art-end`, and the `data-variant="article"` footer.
That's on us, not you — our Astro article renders only `Prose`, so those components exist in
our repo with no caller. Porting them is our work, and your gold is the reference we'll follow.

Which leaves a narrow ask.

## §1 — Two boxes your reference article never shows

`Callout` (E1) and `Plate` (B6) appear in the NORTHSTAR and in `Pâte graphique`, but **not once
in `02_Article.html`**. Specimens show us the box; only the article shows us the box *in a
reading context*, and that's the part we can't infer:

- **Where does a callout sit** relative to the prose column? Inside `.prose` like `.pull`, or a
  sibling that breaks out like `.figure`?
- **What does its tag actually say** in a real article? `N.B.` is the documented default, but a
  real one may be `MÉTHODE`, `CAVEAT`, `SOURCE` — the choice tells us what the component is
  *for*, which no specimen conveys.
- **Does a B6 plate carry a `.ptag`** in the body of an article, and what goes in it?
- **How do they interact with `data-flow="continued"`?** Your plate splits `.prose` in two and
  the second block continues. Does a callout split it the same way, or does it sit inside?

**The ask:** add one `Callout` and one `Plate` to `02_Article.html`, placed where you'd
genuinely put them in that piece — not appended at the end as a demo. If the honest answer is
"a callout doesn't belong in this article", say that instead of forcing one; that's useful too,
and it tells us the component is for the guides rather than the essays.

## §2 — Four questions from the component-by-component audit

I went through all 24 components in the mirror (`design/mirror/BILAN.md`). Result worth
reporting: **the value disagreements are down to 19, and every one is classified.** Most of
what the tool flagged was notation — you qualify selectors by their root because your CSS is
global, we don't because Astro scopes. Both correct.

Four things I can't decide, in order of importance:

### 1. The photo inks — a method question, not a value one

Our tokens `--cover-ink-light: #f4efe3`, `--cover-ink-quiet: #ded7c8` and
`--cover-ink-dark: #241606` hold values that **exist nowhere in the gold**. They exist in your
`research/Article - hero studies.html` and `research/Article - spot colour.html` — so we sourced
from the bancs, and "a validated result graduates to root" means the bancs don't rule.

Meanwhile the gold uses **five distinct light inks**:

| where | gold value |
|---|---|
| `Hero.css` `.hero2-credit` | `#f3ecdb` |
| `HeroPopColor.css` `.ph-sub` | `#e9e3d6` |
| `HeroPopColor.css` `.ph-vcap` | `#ece6d8` |
| `HeroPopColor.css` `.ph-sub .sm` | `#cfc9bb` |
| `HeroPopColor.css` `.ph-cue` | `rgba(241,235,221,0.7)` |

We collapsed five into two, which PROTOCOL §1 says isn't ours to decide. So: **are the five
distinct on purpose — each keyed to what sits behind it — or did they accumulate?** If they
should unify, give us the values and we'll take them. If they shouldn't, we drop the tokens and
each site carries its own ink. These tokens feed 6 components, so we're holding until you answer.

### 2. RegMarks — `absolute` or `fixed`?

You have `position: absolute`, we have `fixed`. Not cosmetic: in `fixed` the registration marks
stick to the viewport and don't scroll with the sheet. Marks belong to the *sheet*, which argues
for yours — but a deliberate screen choice is defensible too. Your call.

### 3. CollCard — translucent or opaque ground?

Yours is `color-mix(in srgb, var(--ink) 2%, transparent)`. Ours is `var(--paper)`, opaque, and
deliberately so: it masks the hairline of a `Grid gap="hairline"` behind it. If the 2% tint
matters, we need another way to hide that hairline. If it doesn't, confirm and we align.

### 4. PostRow — is `.post .arrow` a leftover?

You still carry it, but the July 2026 doctrine says `.post` keeps its 14px slide and **loses the
hover arrow**. Vestige to delete, or something the doctrine didn't mean to kill?

## §3 — Two small notes, no decision needed

- **`h2.sub` numbering.** You put the number in the markup (`<span class="n">01</span>`); we use
  a CSS counter, because our headings come from Markdoc and there's no span to write. Same
  output, and ours can't drift out of sequence. Flagging it so it doesn't read as drift.
- **`.callout::before { content: attr(data-tag) }`.** CSS-generated content isn't reliably
  announced by screen readers, so we put the tag in the DOM as a `<span class="nb">`. Same
  render. If you ever need the tag readable, that's the reason.
- **Vestigial `!important`.** `.ph-cue { display: none !important }` in your print rules needed
  the `!important` while it lived in global `paper.css`. Now that it's in `HeroPopColor.css`
  nothing competes with it.

## What I need back

1. §1 — a `Callout` and a `Plate` placed in `02_Article.html` where they belong, or the ruling
   that they don't belong in an essay.
2. §2 — the four decisions, the photo inks first.

Reply in prose, objections in the reply rather than silent edits. And thank you for the scale
arbitration — promoting 14 and 18 to half-steps rather than rounding them was the right call,
and `sm`/`ml` work fine on our side. We've adopted the whole scale; no literal spacing value
remains outside it in our components.
