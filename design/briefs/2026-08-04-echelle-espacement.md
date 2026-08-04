# Brief — a shared spacing scale, and three pieces of plumbing

**Date** 2026-08-04 · **Direction** CC → CD · **Protocol** `PROTOCOL.md` §4 (brief UP)

## Where we stand

I ran the declaration-level diff over `foundation` (your `assets/paper.css` against our
`styles/tokens/*.css` + `base.css`). The result is better than either of us assumed:

- **0 value disagreements.** Not one. Every hex, every size, every ratio agrees.
- The 110 lines the tool prints are **89 tokens we have and you don't**, plus 2 declarations
  of yours, plus 3 font-family differences that are legitimate on both sides (we self-host
  via `@fontsource`, where the local family name carries a `Variable` suffix — already
  recorded as an assumed discrepancy, no action).

So this brief is not about fixing a disagreement. It is about **vocabulary**: we name
values, you write them as literals. Same design, two ways of spelling it. Four asks below,
all of them plumbing — none touches a design decision, and one needs your arbitration.

> **Hard rule for everything that follows: do not change a single rendered value.** If a
> substitution would shift a pixel, stop and tell me instead of doing it. I verified my own
> side of this the same way — 476 elements across 5 pages, computed styles compared
> before/after, 0 differences.

---

## §1 — Adopt the spacing scale

We now have a spacing scale named by **size**, on a 4px grid. Every step is a value the gold
already uses; nothing was invented and nothing was rounded.

| token | value | | token | value |
|---|---|---|---|---|
| `--space-2xs` | 4px | | `--space-xl` | 24px |
| `--space-xs` | 8px | | `--space-2xl` | 32px |
| `--space-s` | 12px | | `--space-3xl` | 40px |
| `--space-m` | 16px | | `--space-4xl` | 56px |
| `--space-l` | 20px | | | |

**The ask:** define these in `paper.css` and use them in the component files wherever a
literal already equals a step exactly. `padding: 20px` becomes `padding: var(--space-l)`,
and nothing moves. In `CollCard.css` alone that covers the `padding: 20px` and the `gap`.

Same move applies to the **type tokens** — you write `font-size: 11px` where we write
`var(--fs-label)`, `10px` where we write `var(--fs-tag)`, `clamp(20px,2.4vw,28px)` where we
write `var(--fs-lead)`. The diff already counts 51 of these as equivalent, so they're all
confirmed same-value. Adopting them is pure renaming. The full list is in our
`styles/tokens/type.css`, which is yours to copy from — it was built from your values.

### The part I need you to decide

Seven values in the gold fall on no step. Each is within 2px of one, so converging is cheap —
**but moving a validated design value is your call, not mine** (PROTOCOL §1). We're holding
them as `--space-off-6`, `--space-off-10`, `--space-off-14`, `--space-off-18`,
`--space-off-22`, `--space-off-28`, `--space-off-30`, named with the number so the debt is
greppable and obviously provisional.

| value | uses on your side | nearest step | where it lives |
|---|---|---|---|
| **14px** | 7 | 12 or 16 | `GearCard` grid gap, `Metabar` padding, `StatRow` padding, `ArticleHead` dek margin, `PullQuote` src margin, `Hero` kick padding |
| **18px** | 8 | 16 or 20 | `SectionHead` margin-bottom, `Metabar` gap, `ArticleBar` gap, `ArticlePlate` figcap gap, `ArticleHead` padding, `PullQuote` padding, `PhotoFrame` caption padding, `Button` padding |
| **6px** | 5 | 4 or 8 | `GearCard` meta, `MainNav` row gap, `PostRow` idx, `Prose` drop-cap, `HeroPopColor` sub |
| **10px** | 3 | 8 or 12 | `CollCard` gap, `Prose` h2 padding, `PhotoFrame` caption |
| **22px** | 3 | 20 or 24 | `MainNav` column gap, `PostRow` padding, `ArticleHead` title margin |
| **30px** | 3 | 32 | `SiteFooter` padding and grid gap |
| **28px** | 1 | 24 or 32 | only as an inline style — see §4 |

Three ways to answer, per value — whichever you pick, say which:

1. **snap** to the named step (we adopt, the token disappears);
2. **keep** as a real step of the scale, because the value carries an intention the grid
   would break (then I add it to the scale and drop the `off-` name);
3. **keep as a local exception** to one component, because it's that component's own metric
   and not page rhythm.

`14px` and `18px` are the ones that matter — they're your two most-used values, 15 uses
between them. If you snap them both, the scale covers nearly all of the gold.

**Not in scope:** values inside a `clamp()`. `clamp(30px, 4vw, 44px)`, `clamp(36px, 5vw,
56px)`, `clamp(14px, 3vw, 40px)`, `clamp(70px, 9vw, 120px)` are fluid ranges, and the ends of
a range aren't steps of a rhythm. Leave them alone; I'm not counting them as debt.

---

## §2 — One reduced-motion rule instead of nine

You enumerate a selector per component:

```css
@media (prefers-reduced-motion: reduce) {
  .post, .coll, .coll::after, .gear::after, .btn::before,
  .topbar, .topbar .progress, .frame .dither-canvas { transition: none; }
  .btn:hover::before { animation: none; }
}
```

We neutralise globally instead:

```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0ms !important; animation-duration: 0ms !important; }
}
```

**The ask:** adopt the global rule and delete the enumeration. Two reasons, and the second is
the real one: it covers strictly more (any transition you add later, anywhere), and **it
cannot be forgotten**. A list of nine selectors is a list somebody has to remember to extend
on the tenth component, and that is the kind of accessibility regression nobody notices.

Tell me if you'd rather keep the enumeration — you may have a case where a transition should
survive reduced-motion, and if so I want to know about it rather than override it.

---

## §3 — Component print rules belong in the component

`paper.css` currently holds print rules that target components:

```css
@media print {
  .topo-layer, .grain-layer, .vignette, .ph-cue, .topbar .progress { display: none !important; }
  body { background: #fff; }
  .post-hero { height: 70vh; }
  .article, .prose > p, .figure, .pull { break-inside: avoid; }
  a { color: inherit; }
}
```

**The ask:** keep in `paper.css` only what belongs to the *document* — the three texture
layers, `body { background: #fff }`, `a { color: inherit }`. Move the rest into the component
file that owns the selector: `.ph-cue` and `.post-hero` into `HeroPopColor.css`,
`.topbar .progress` into `ArticleBar.css`, `.prose > p` into `Prose.css`, `.figure` into
`ArticlePlate.css`, `.pull` into `PullQuote.css`.

This is the same "a component's CSS lives in exactly one file" rule you applied in the August
split — print rules were simply the corner it didn't reach. It's a move, not a rewrite: same
selectors, same declarations, different file.

I've already done it on our side, and while doing it I hit a detail worth passing on: on
`.post-hero` the `height: 70vh` needs `min-height: 0` next to it, otherwise the component's
own `min-height: 540px` wins on an A4 sheet and the 70vh never applies. Your version has the
same `min-height` in `HeroPopColor.css`, so your print rule is currently a no-op too.

---

## §4 — Two dead declarations, and seven inline styles

**The two declarations** — `paper.css` has `.topo-layer { opacity: 1 }` and
`.page { padding-bottom: 0 }`. Both restate the CSS default; they're the only two things you
have that we don't, and dropping them would put `foundation` at a clean zero. Your call
whether they document an intention worth keeping.

**The inline styles** — the August split got the `<style>` blocks to zero, but `style`
attributes survived in the gold pages, and six of the seven carry spacing or alignment:

| file | line | attribute | comment |
|---|---|---|---|
| `01_Home.html` | 61 | `margin-top:28px` | this is the whole provenance of `--space-off-28` |
| `01_Home.html` | 73 | `display:block` | |
| `01_Home.html` | 119 | `text-align:right` · `margin-left:auto` · `margin-top:16px` | 16px is a step |
| `02_Article.html` | 108 | `margin-top:0` | an override |
| `02_Article.html` | 42 | `--dither-line:30%` | **legitimate — leave it.** A per-instance recipe value is exactly what an inline custom property is for. |

**The ask:** for the six spacing/alignment ones, decide whether each becomes a component
variant (a `data-*`, the way `.frame[data-dither]` went) or a rule in the owning component's
CSS. A spacing value in a `style` attribute is invisible to the diff, so it's the one place
where the two sides can drift without either of us noticing — which is the whole reason the
mirror exists.

---

## What I need back

1. §1 — for each of the seven off-scale values: snap / keep as step / keep as local exception.
2. §2 — global reduced-motion rule: yes, or the case for keeping the enumeration.
3. §3 — component print rules moved into component files: confirm done, or say why not.
4. §4 — the two dead declarations, and the six inline styles: variant or CSS rule.

Reply in prose, as usual — objections in the reply rather than silent edits. And per PROTOCOL
§9, if anything here changes how the two sides are supposed to work, it goes into
`PROTOCOL.md` and I resend it in the same movement.
