# Brief 2 — page ink as `:root[data-ink]`, not an inline style

Small follow-up to the CSS split. **Mechanism only — no design decision, no value change.**

## What we hit

The split is clean: 1010 declarations before, 1011 after, 9 cross-file duplicates
down to 0, and both gold pages render identically (Home differs by 13 pixels out of
5.9M; the Article's 16.5% is entirely the non-reproducible dither canvas — rendering
the *same* page twice gives 16.6%).

One thing does not survive though. The article's page ink now lives in an inline
`style` on `<html>`:

```html
<html style="--accent:#9a7838; --topo:rgba(154,120,56,.06); --post-hero-h:100vh">
```

That is invisible to any static analysis of the CSS. Our diff tool — which compares
your CSS to the Astro components declaration by declaration — reads the stylesheets
and therefore believes the article's accent is olive. It is not, it is sepia, and it
renders correctly. But it means **the one value that distinguishes an article page
from the home is the one value we cannot check**, and every future article will
report a false divergence.

## What we would like instead

Put page ink in the stylesheet, keyed on an attribute:

```css
/* paper.css, next to the :root defaults */
:root[data-ink='olive'] {
  --accent: #3d491d;
  --topo: rgba(61, 73, 29, 0.06);
}
:root[data-ink='sepia'] {
  --accent: #9a7838;
  --topo: rgba(154, 120, 56, 0.06);
}
```

```html
<!-- 02_Article.html -->
<html data-ink="sepia">
<!-- 01_Home.html — olive is the default, so nothing needed; add data-ink="olive" if you prefer it explicit -->
```

Same rendering, same values, zero `<style>` block — and now diffable. This is exactly
how the Astro side already does it (`src/styles/tokens/colors.css`), so the two sides
converge on one mechanism instead of two.

`--post-hero-h: 100vh` is a per-page layout value rather than an ink: put it wherever
you think it belongs — a `[data-ink]` block, its own attribute, or `HeroPopColor.css`
if 100vh is simply the default. Your call, we will mirror it.

## Two things to leave alone

- **`--grain` stays inline on `<html>`.** `texture.js` generates that data-URI at
  runtime; it *has* to be inline, and it is not design state. No change wanted.
- **The print block.** Moving it into shared `paper.css` was the right move. We
  checked: the article's print rules are byte-identical to before, and the home —
  which previously had no print rules at all, in the page or in `paper.css` — now
  prints on white with the registration marks and without the two `position: fixed`
  canvases that never printed properly anyway. Screen rendering is untouched
  (`matchMedia('print')` is false, `.grain-layer` and `.topo-layer` compute to
  `display: block`). Keep it.

## While you are in there

Unrelated to the split, found while measuring: on `01_Home.html` at 1440px wide, the
intro lede (`.lede[data-size='intro']`, x 871→1190) overlaps the big display type
(`.ctype`, x 178→939) by about 68px, so the first word of each of its three lines sits
behind the letters of RESPIRE. Identical on screen and in print, so it predates the
split — we are not asking you to change it, just flagging it in case it is not
intentional. If it is deliberate, say so and we will mirror it as-is.
