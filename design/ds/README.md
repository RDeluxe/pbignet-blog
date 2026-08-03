# exhale — design system

The production design system of **exhale.blog**, pushed from the codebase. Everything here
mirrors what actually ships; the `tokens/` files are byte-identical to the ones the site loads.

> **Where the truth lives.** For now, the research project (`Pierrick Blog`) is the source of
> truth for *design* decisions — colour, scale, form, composition. This project is the source
> of truth for *implementation* — the component contracts and the exact token values. When the
> two disagree, it is a bug worth naming, not a preference.

---

## Foundations

### Colour

A warm-paper base that never changes, plus **one accent ink per page**.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#F6F5F1` | page surface — « blanc cassé · silence » |
| `--paper-2` | `#EDEBE4` | recessed panels, hover fills — **nothing else** |
| `--ink` | `#1B1A16` | primary text, rules, display |
| `--ink-2` | `#4C483D` | body / secondary text |
| `--ink-3` | `#696551` | mono labels, captions, hints (AA at 9–11px) |
| `--line` / `--line-soft` | ink @ 20% / 12% | hairlines |
| `--line-strong` | ink @ 55% | the plate frame — reads as a printed stroke |

Accent inks, green-forward, **never blue**:

| Token | Value | Use |
|---|---|---|
| `--olive` | `#3D491D` | the working ink — the index. Links, dot, topo tint, titles. |
| `--sepia` | `#9A7838` | editorial — articles |
| `--lime` | `#C2C762` | highlight / fill only. Too light to carry text on paper. |
| `--riso-red` | `#D44A2C` | art covers, photo. Sparingly. |

The page picks its ink once: `<html data-ink="olive|sepia">` sets `--accent` and `--topo`
together. **The dither tone is not bound by it** (see `SKILL.md`).

Inks laid **on photographs** are a separate family — they are type on an image, not furniture:
`--cover-ink-light` `#F4EFE3`, `--cover-ink-dark` `#241606`, `--cover-ink-quiet` `#DED7C8`.

### Type

`--display` Anton · `--sans` Archivo · `--mono` Space Mono · `--serif` Newsreader.

Scales worth knowing: `--fs-hero` (the home word, up to 256px), `--fs-cover` (an article
cover word), `--fs-shead` (section opening), `--fs-title` (post title), `--fs-body` 16.5/1.55
(reading), `--fs-lead` and `--fs-lead-intro` (the two lede scales — they are **not**
interchangeable), and the mono furniture ladder `--fs-micro/tag/label/data` where the smaller
the size, the wider the tracking.

Reading measure is `--measure-body` (66ch **of text**; gutters add to it, they do not eat it).

### Space

`--maxw` 1180px, `--gutter` `clamp(20px, 4vw, 56px)`, `--rhythm-section` between sections.
Corner crosses share one set of tokens — `--cross-size/weight/out` — because the interactive
tile and the callout use the same object. Durations are three: `--dur-fast` (crosses appearing),
`--dur-base` (fill, border), `--dur-slow` (movement).

---

## Components

Every component ships its **`<name>.d.ts`** — the API contract, extracted from the real
`interface Props`, docblock included. If a prop is not there, the component does not do it.

The components that carry the most doctrine also ship a **`<name>.prompt.md`**: when to reach
for it, what it refuses to do, and the traps. Today: `HeroPopColor`, `Plate`, `Callout`,
`CollCard` (the tile contract), `Prose`.

Two conventions the contracts follow:

1. **Props express intentions, not CSS values.** `height="immersive"`, not `height="82vh"`.
   The one deliberate exception is cover art direction — a cover is placed per image, so
   `titleY`, `titleYMobile` and `focal` take real values.
2. **Variants are `data-*` attributes driven by a TypeScript union.** No class concatenation,
   no runtime.

---

## What this system will not do

- No left accent bar, no drop shadow, no rounded corner.
- No second implementation of a component: the previews here are rendered by the real
  component, so they cannot drift from it.
- No photo floating inside a plate; a plate only frames.
- No colour decided in a stylesheet. If it is not in the tokens, it is not a brand colour.
