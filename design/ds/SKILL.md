---
name: exhale-design
description: Use this skill to design or build anything for exhale — Pierrick Bignet's personal index (exhale.blog). Contains the brand's colour doctrine, type, print furniture, box vocabulary, and the component contracts as implemented in production. Use it for production code, mocks, throwaway prototypes, slides, or social assets.
user-invocable: true
---

Read `README.md` first, then explore. If you produce visual artifacts (mocks, prototypes,
slides), copy the assets out and write self-contained HTML. If you work on production code,
read the component contracts in `components/` — they mirror what is actually shipped.

## What exhale is

A personal index for **Pierrick Bignet** — engineer, game art director, photographer. Not a
blog: a living archive of thinking, photographs and gear, presented as a **printed artifact**.
The site is the work as much as the writing is. Warm paper, riso dithering, print furniture,
committed typography.

## Map

- `README.md` — the design guide. **Read this first.**
- `styles.css` — link this one file to get every token and the paper surface.
- `tokens/` — colours, type, space. These are the **same files the production site uses**,
  pushed without transformation.
- `guidelines/*.card.html` — specimens: colour, type, print furniture.
- `components/` — one `.d.ts` (the API contract) and one `.prompt.md` (when and how to use it)
  per component, plus `*.card.html` previews rendered by the real component.

## Rules of thumb

- **One ink per page**, for furniture and type only: the accent drives links, tags, the topo
  tint, titles. **Olive `#3D491D`** on the index, **sepia `#9A7838`** on articles. Never blue.
  Never two accents on one page.
- **The photographic dither tone is exempt from that rule** — it can be keyed to each image.
  A blue-sky cover on a sepia article is intended, not a mistake. Corollary: **loud colour is
  a cover-only event**; body plates stay in the calm sepia duotone.
- Paper is **`#F6F5F1`** (« blanc cassé · silence »), never white. `--paper-2` `#EDEBE4` is
  **reserved** for recessed panels and hover fills — it is not an alternate page background.
- Type: **Anton** (display) / **Archivo** (UI, post titles) / **Space Mono** (print furniture,
  data) / **Newsreader** (reading body, ledes).
- **Box vocabulary** (decided July 2026): `plate` = static presentation, borrowed-grid frame
  overshooting the corners; `tile` = interactive, bare at rest then corner crosses + ink
  border + `paper-2` fill on hover; `callout` = pinned note with a mono tag breaking the top
  rule.
- **Hard bans**: no left accent bar, ever. No drop shadows. No rounding — zero radius
  site-wide. No cream/beige background without material texture. No stat counters, no gradient
  text. No softening of the home hero (the photo runs *through* the letterforms).
- Print furniture earns its place: registration marks, barcodes, coordinates, index numbers
  exist because a printed sheet would have them — never as decoration pretending to be data.
- Copy is **English**, specific and dry, never promotional. Sparse em-dashes (more than three
  on a page reads as machine-written).

## Accessibility that is part of the brand

- `--ink-3` is `#696551`, not the lighter tone the specimen shows: its job is 9–11px mono
  furniture, which must clear WCAG AA.
- Text set on a photograph needs **≥3:1 (large text) at every breakpoint** — and it must be
  **measured**, not eyeballed. On a spot-colour cover the ceiling is set by the dither
  *ground*, not by the photo: a mid grey ground caps around 3.4:1 and drops below 3 as soon as
  a kept-colour area is light.
- Reduced motion: the dither boil freezes, transitions are cut.
