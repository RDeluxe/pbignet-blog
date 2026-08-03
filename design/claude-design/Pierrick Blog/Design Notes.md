# exhale — design notes

## Locked direction (approved)
**RETRO Home v2** is the agreed hero treatment:
- Photo **cropped at the top edge by the type**; the picture **continues up through the letterforms** (background-clip:text aligned to the photo plane below).
- **Color dithering** (ordered Bayer, ~4 levels/channel) — riso halftone, in colour. No text outline.
- Warm paper + grain + faint topo, mono metadata, barcode, blue accent.
- Static dithered images (no "blinking" animation) baked as PNGs.

## Inspiration library (refs the user is collecting)
Stored in `uploads/` — motifs to reuse across the site:

1. **TOKYO** — giant condensed sans behind/over a cropped tower photo; body copy knocked over the image; CJK label (東京タワ) + index "03"; teal duotone, paper grain.
2. **WORK** — huge orange display word straddling a boat/water photo; mono tabular strip ("SLOW DAY AT WORK · FORMAT JPG · ISSUE Nº"); index ".049"; vintage print grain. Single bold ink colour.
3. **MONDAY** — elegant high-contrast **serif** display over a muted photo; top metadata in columns ("Darling- / Don't- / You-"); lyric caption bottom. Shows a serif counterpoint to the condensed grotesque.
4. **RETRO** — condensed word knocked over a coastal photo on yellow halftone paper; barcode; mono intro split across a rule.
5. **Serendipity** — clean editorial: bold sans word + `[noun]` definition, sepia photo block to the right, index "001 ▼", quote + JP caption at the foot. Heavy paper negative space = calm.
6. **SoundToy (CJK grid)** — airy modular grid of photo blocks, mixed CJK + small Latin, thin diagonal rules, **hex colour swatches** as a footer motif. Good model for the Photos / gallery page.

## Motifs to carry into inner pages
- Index numbers (01 / .049 / 003) top-right of features.
- Mono "spec strip" above big words (format, issue, coords).
- CJK accent labels alongside Latin.
- Colour-swatch chips w/ hex (palette footer, photo pages).
- A **serif** display option (MONDAY) for softer pages (About / essays).
- Definition / `[noun]` device for an About or glossary moment.
- Barcodes + registration marks as print furniture.

## Inspiration library — batch 2
7. **NATURE (Coco biker)** — graph-paper grid bg + small "+" registration crosses; cut-out subject (no box) floating on grid; vertical thin-sans title; body text overlapping the cut-out. → grid + crop-cross furniture; cut-out (alpha) subjects.
8. **VYSOKÉ HORY NITRA** — B/W mountain knocked into a soft circle "sun" + flowing contour lines bleeding off it; big stacked date (17/11/2018); blue mono accent; tidy sponsor logo row at foot. → contour-line motif tied to a photo; big date stack; partner/footer strip.
9. **the silence that heals (dila)** — full grid w/ corner "⌐ ⌙" ticks; giant ghosted index number behind text; ↗ arrows; tiny green hex chip; mixed weights; camera credit. → grid ticks, oversized ghost numerals, arrow glyphs.
10. **Raja Ampat** — Swiss travel poster: huge tight grotesque name + inline "610 Island"; **N/E/W/S colour-coded location columns**; date + coords rail across top w/ rainbow tab bar; grainy photo block; "INDONESIA" footer rule. → directional column data block; coords rail; country footer.
11. **from deep space** — vintage gig poster; photo masked inside **geometric shapes (circle + teardrop)** over a faint grid; ghosted big glyph; layered event credits. → photo-in-shape masks (not just type).
12. **THE ATLANTIC OCEAN ROAD** — single dark-green duotone; thin light grotesque title overlapping a **posterized 2-tone photo**; **stat columns** ("1989 / 8 bridges / 8.3 km / 12 hurricanes"). → monochrome duotone treatment + factual stat row (good for an article header / project page).

## Box audit — July 2026 (open questions, decide with Pierrick)
Current box vocabulary, as found in code:
- **`.plate` + 4 corner ticks** (12px, ink-2) — figure plates in Pâte graphique ×4 + NORTHSTAR demos. BUT: bg is `--paper` on graphique pages vs `--paper-2` in NORTHSTAR; the dot-grid inside comes from diagram.js's SVG, not from the plate itself.
- **Fused grids** (`gap:1px; background:var(--line)`) — .coll-grid, .g4/.dna.
- **`.callout`** — left accent bar, 4px in NORTHSTAR vs 3px in Article spot colour (.method-note). Also the exact "left accent bar" trope the guardrails ban.
- **Article `.frame-marks`** (fm1/fm2) — a third corner language on photos.
- **Labels**: .anno-box/.lbl/.codebox (accent border) vs .badge/.tag (border-radius 2px — the only rounding in the system).
- **Interactive**: .coll (lift −3px + border), .gear (bg + border), .post (slide 14px), index.html .card (lift −4px + **box-shadow** — only shadow on the site, off-brand for flat print).
- **`.btn` hover**: invert-to-ink (Spec Sheet/Topo) vs fill-accent (animation page). Two behaviours.

Direction being explored: split the vocabulary into **plates** (static presentation: corners + technical-paper fill) vs **tiles** (interactive: fewer/no corners at rest, one unified hover). Test bench: `research/Boxes - banc d'essai.html`. DECIDED (final, July 2026):
- **Plate (static presentation)** = **B6**: # "grille empruntée" frame (1.2px ink lines running ~13px past the corners) on **plain paper**, with an ultra-light 16px grid (majeure 64px @ .05, mineure 16px @ .022). B4 (same on paper-2) kept only as a secondary "recessed" variant for busy surroundings — paper-2 stays reserved for recessed panels & hover fills.
- **Tile (interactive)** = **D2**: bare at rest (1px line border) → 1px corner crosses + ink border + paper-2 bg on hover. Corners = focus signal.
- **Charts/diagrams**: keep their own internal dot grid, points snapped to it (previous behaviour); the plate only frames. Bar tracks get solid paper bg so grids never show through data.
- **Callout** = E1 pinned note: hairline box, 2 crosses (tl+br), faint dots, mono "N.B." tag breaking the top border. No left accent bar anywhere.
- **Buttons**: hover = light animated dither fill (boil, steps, reduced-motion safe), ink or accent trame; ink inversion kept as a secondary mode for select buttons.
- No floating photos inside plates. No drop shadows anywhere. `.frame-marks` (film notches) retired from gold — article photos are bare frames; the CSS stays in paper.css only for research archives. `.tag`/`.badge` radius removed (zero rounding site-wide). `.post` keeps its 14px slide, hover arrow removed — more life/animation is a wanted future direction, not less.
NEXT: propagate plate/tile/callout/button into paper.css + gold pages + NORTHSTAR components section (awaiting go).

## File organisation (decided July 2026)
Root = **gold** (validated, kept up to date), numbered by Pierrick: 0_NORTHSTAR, 01_Home, 02_Article, Pâte graphique + animation, the two "Test Export" carrés, assets/, Design Notes. `research/` = studies & benches (directions 01–04 + index hub, Bold Studies, Article studies, Pâte graphique benches, Boxes bench). New research goes in research/; a validated result graduates to root.

## Libs to test / keep at hand (July 2026)
- **dither-kit** (tripwire.sh/dither-kit) — dithered charts (area/bar/line/pie/radar) as shadcn/React components. Requires Tailwind + shadcn build → can't drop into our vanilla pages. Treat as **inspiration**: their dithered-fill chart language can be re-implemented natively in `diagram.js` if we want more chart types.
- **Paper Shaders** (shaders.paper.design) — zero-dependency GLSL/React shaders. Relevant: paper-texture, image-dithering, halftone-dots, dot-grid, grain-gradient. Could replace `texture.js`/`dither.js` at runtime, BUT brand rule stays: hero dither is baked to PNG; WebGL only if it earns its cost. → candidate for a research bench.
- **Contour Map Creator** (contourmapcreator.urgr8.ch) — real topo contours from a lat/long rectangle; exports SVG + raw elevation grid ("Save Data" text). No API → manual, pre-build. Plan: Pierrick pulls the data for the article photo's coordinates; a small project script/page converts the exported grid or SVG into our `--topo` styled layer (colors, stroke weights, crop) + coords caption. TO BUILD: `research/Topo import` tool.

## Next pages to build
Writing index · Article (long-form) · Photos (grid + swatches) · Now · Setup.

## Couleur Paper — décision août 2026
- `--paper: #f6f5f1` (« Blanc cassé · silence », retenu au banc `research/Paper - couleur.html`) ; `--paper-2: #edebe4` (même delta oklch que la paire v1 #ece6da/#e3dccd).
- Propagé : gold (01_Home, 02_Article, NORTHSTAR, Pâte graphique ×2, Test Export ×2), paper.css, bancs actifs (Boxes, Article spot colour). Études research 01–04 & archives laissées en v1.
- `dither.js` accepte `'var(--token)'` / `#hex` / `'r,g,b'`, résolus à CHAQUE rendu → les cellules claires suivent `--paper` en live (défaut du mode photo, utilisé par 02_Article fig1). Duotones par image (hero 02_Article navy/ciel) gardés volontairement.
- À revoir : `--card` des carrés Test Export (#f1ece2, désormais plus sombre que paper) ; PNG hero cuits (01-dither…) encore teintés v1 → à re-cuire.

## CSS per component — décision août 2026
- `paper.css` = tokens + reset + texture layers + focus/print/reduced-motion only; every component lives in exactly ONE file, `assets/components/<Name>.css`, @imported at the top of paper.css. Gold pages carry **no `<style>` block**; the page ink (`--accent`/`--topo`/`--post-hero-h`) sits inline on `<html>`.
- Variants are `data-*`, never suffixed classes: `.tag[data-accent='on']` · `.rule[data-weight='thick']` · `.lede[data-size='intro'|'section']` (ex `.hero-intro`/`.lead-serif`) · `.figure[data-width='wide']` · `.pframe[data-ratio='tall'|'wide']` · `footer.site[data-variant='index'|'article']`.
- **§3 ruling**: the article frame is the SAME `.frame` component with a dither variant → `.frame[data-dither='on']` (overflow + dark ground + 1066/1422 + canvas on); base stays dither-off. Lives in `ArticlePlate.css`.
- **§6 rulings**: `.frame-marks` NOT deleted — research/02 Topographic still uses it; kept in paper.css, flagged legacy. `.rule`/`.rule-thick`/`.tick` kept (`Rule.css`, data-weight form).
- Kept as class variants for now (NORTHSTAR specimens + archives use them): `.plate.plain/.recessed`, `.btn.accent/.invert`, `.regmark.tl…br`. Convert when those pages get their own pass.
- Footer collision the brief missed: home and article `footer.site` differ (margin-top, padding, inner classes `.foot-*` vs `.fin/.f-*`) → one `SiteFooter.css` with `data-variant`.
- Hero photo URLs in `Hero.css` rewritten `assets/photos/…` → `../photos/…` (same files; CSS-relative).
- Markup touched for renames: 01_Home, 02_Article, NORTHSTAR + archives using `.tag-accent` off shared CSS.
