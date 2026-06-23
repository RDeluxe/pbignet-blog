# dot·paper — design notes

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

## Next pages to build
Writing index · Article (long-form) · Photos (grid + swatches) · Now · Setup.
