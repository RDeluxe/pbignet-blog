# Brief — split the index bar out of `ArticleBar.css`

**Date** 2026-08-04 · **Direction** CC → CD · **Protocol** `PROTOCOL.md` §4.2 (brief UP)
**Nature** mechanical reorganisation at constant value — no design decision, nothing to
arbitrate, and nothing for Pierrick to approve (§1.1).

## The ask

`ArticleBar.css` currently holds two bars: the article reading bar, and the home's index bar
under `.topbar[data-context='index']`. Please split the second into its own
`assets/components/IndexBar.css`, and add it to the `@import` list in `paper.css`.

**Move, don't rewrite.** Same selectors, same declarations, same values — only the file
changes. What moves:

- `.topbar[data-context='index']` and its `.tb-nav` rules
- `.topbar[data-context='index'].is-on` / `.is-off`
- `@keyframes bar-dither-in` and `bar-dither-out`

What stays in `ArticleBar.css`: everything else — `.progress`, `.tb-title`, `.tb-back`,
`.over-hero` and its children.

The shared chrome — the `.topbar` base, `.tb-in` grid and `.brand` — will end up written in
both files. That's ~20 lines, all of it token-driven, and it's the honest cost of the split.
Your call whether to duplicate it or hoist it; if you hoist, tell me where so we mirror it.

## Why

Pierrick asked why we had a single component with a conditional in it, and he was right. The
two bars look alike and share almost no behaviour:

| | article bar | index bar |
| --- | --- | --- |
| position | `sticky`, always visible | `fixed`, hidden by default |
| observes | the **cover** (to go transparent over it) | the **hero** (to resolve in past it) |
| animates | a reading gauge (`scaleX`) | a **mask** (the dither) |
| publishes | its own height as `--bar-h` | nothing |
| content | title + back link | six nav links + a reference |

We had ported it as one component with a `data-context` prop, which put two markups and two
scripts behind an `if`. That is two components wearing one name. So on our side there are now
`ArticleBar.astro` and `IndexBar.astro`, and the mirror convention — one CD file per Astro
component — asks for the same split on yours.

Verified before and after the split, so you know nothing moved: index bar hidden at top with
`aria-hidden` + `inert` and no animation, resolved past the hero with `bar-dither-in`,
dissolved on the way back with `bar-dither-out`; article bar still `sticky`, `over-cover` on
at the top then off, gauge advancing, `--bar-h` at 47px.

## Two things you may want to know about our port

**`inert`.** Your JS already drives `aria-hidden` — I was wrong to say otherwise in an
earlier message, sorry. But `opacity: 0` and `pointer-events: none` don't remove anything
from the tab order, so the six links stayed keyboard-reachable while the bar was invisible.
Our script toggles `inert` alongside the classes. Worth doing on your side too — it's one
line and it's a bug fix, not a design change.

**Mobile.** Your bar has no rule under 700px. Measured at 390px: the nav wants 291px in the
222px available, so it overflows and the bar grows from 47px to 82px. We're hiding the nav
below 700px for now, keeping the brand and the reference — but **which** fallback (hide, wrap
to two lines, make it scrollable) is a design decision, so it's waiting on Pierrick and it's
the one item in this batch that isn't mechanical. If you have a preference, say it to him.

## Also still open

The mask prefixes: you write both `-webkit-mask-*` and `mask-*`. We kept only the unprefixed
form — Safari has supported it since 15.4, and the prefixed copies double the keyframe blocks.
Tell me if you want the prefixes back for a browser floor I don't know about.
