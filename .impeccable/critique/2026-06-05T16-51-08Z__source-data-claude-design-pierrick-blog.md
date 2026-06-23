---
target: source-data/claude-design/Pierrick Blog — all design variants
total_score: 27
p0_count: 0
p1_count: 2
p2_count: 3
timestamp: 2026-06-05T16-51-08Z
slug: source-data-claude-design-pierrick-blog
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Hover transitions and arrow reveals work well; no loading/async states needed for a blog |
| 2 | Match System / Real World | 3 | Print metaphor is cohesive throughout; "Travel ⌁" lock icon unexplained |
| 3 | User Control and Freedom | 3 | Navigation exits are clear; no modal traps |
| 4 | Consistency and Standards | 2 | Within each variant: solid. Body sections are identical across all 5 hero directions — design personality ends at the fold |
| 5 | Error Prevention | 3 | N/A for a reading-only blog |
| 6 | Recognition Rather Than Recall | 3 | Navigation visible; content labeled; bracket metadata takes reading effort |
| 7 | Flexibility and Efficiency | 2 | Reading interface by nature; no keyboard shortcuts or power paths |
| 8 | Aesthetic and Minimalist Design | 3 | Hero system is exceptional; body sections have shead-meta reflex on every section |
| 9 | Error Recovery | 3 | N/A — no error paths |
| 10 | Help and Documentation | 2 | "Travel ⌁" locked entry needs contextual explanation; no site orientation for new visitors |
| **Total** | | **27/40** | **Acceptable — significant improvements before full readiness** |

---

## Anti-Patterns Verdict

**Does this look AI-generated?**

**LLM assessment**: The hero system would not be mistaken for AI output. The photo-in-type effect with JS-aligned background-clip in RETRO v2, the topo canvas, the grain multiply-blend, the registration marks — these are too technically specific and reference-loaded (risograph, Swiss travel posters, printed ephemera) to read as a template reflex. The color dithering pipeline is genuinely custom craft.

The body sections are a different story. The writing list, field guides, photos, and setup are structurally identical across all five design variants. Every section wears the same `[ BRACKET METADATA ]` label. The post descriptions use em-dash-heavy prose at high density. These patterns are the AI scaffold the hero was designed to escape.

**Deterministic scan**: The detector found two issues across all 7 files:

- **Em-dash overuse** — 5–12 em-dashes per file (warning). Present in every variant. This is a genuine copy cadence tell. Most are in article descriptions and "now" copy.
- **Numbered section markers** — sequences 01/02/03/04 present in all files (advisory). Context matters here: in the writing post list, numbered article indexes are intentional archive catalog behavior. In Bold Studies, the study numbers (01/02/03/04) are sequence labels, not scaffolding. However, the `shead-meta` content (`[ OPINIONS · NOTES · 04 RECENT ]`) is the eyebrow pattern in bracket syntax — that's the genuine reflex to address.

No false positives identified. The gradient-text rule technically fires on `background-clip: text` in RETRO v2 — this is a false positive. Photo-in-type is an intentional, meaningful effect, not decorative gradient text.

**Visual overlays**: Browser injection not available for this static file review; detector ran in CLI mode only.

---

## Overall Impression

The hero system across these explorations is some of the most distinctive personal-site work in the 2026 landscape — the RETRO v2 photo-in-type, the dithering pipeline, the topo canvas — none of this would be mistaken for a Framer template. The Bold Studies files show the visual language at its most fully realized.

The single biggest opportunity: below the fold, these pages abandon the personality entirely. The visitor gets one spectacular opening screen, then standard blog infrastructure that could belong to any of a thousand sites. The design language needs to extend from the hero into the body.

---

## What's Working

**1. The texture system is extraordinary.** The topo canvas + grain multiply-blend + registration marks + vignette creates genuine paper materiality without resorting to the cream-background-and-done move. The combination makes the "warm paper" identity feel earned rather than defaulted to.

**2. The RETRO v2 photo-in-type hero.** The JS alignment script that matches the `background-clip: text` source to the photo plane below is technically clever and visually arresting. The visitor sees the photograph starting at the bottom of the frame, then continuing upward through the letterforms of "PIERRICK" — it's a real visual idea, not a stock effect.

**3. The writing post list component.** Index number, tag chip, title, serif description, and mono time — the reading hierarchy is fast to scan and the hover reveal (arrow slides in, row indents by 14px) is restrained and satisfying. This is the strongest shared UI element.

**4. Bold Studies — Study 02 (torii duotone) and Study 04 (photo-in-type NIPPON).** The vertical 鳥居 kanji + "torii" in Archivo 900 at -0.05em tracking over the red-slate duotone is the most publication-complete image in the entire set. Study 04's "NIPPON" with the inset dithered thumbnail shows the clip-text concept extended thoughtfully.

---

## Priority Issues

**[P1] The design personality ends at the fold**
- **What**: All five hero directions (01/02/03/04/RETRO v2) diverge in the hero and then share identical body sections — same writing list, same field guides cards, same gear grid, same footer. The creative investment doesn't carry through.
- **Why it matters**: The visitor who's captivated by the RETRO v2 hero scrolls down and finds a generic blog layout. The design system's unique language — dithered photos, topo lines used as accent, print furniture, the ink-blue accent in context — isn't present in the body.
- **Fix**: For RETRO v2 (the locked direction), give each body section its own print motif. The writing section could have one "featured article" card using the word-over-dithered-photo treatment. The photos section should have dithered frames as a first-class layout, not a stack of identical gray placeholders. The gear grid is close but the `border: 1px solid var(--line)` cards need the same attention as the hero.
- **Suggested command**: `/impeccable craft homepage body sections`

**[P1] Em-dashes are overused throughout — 5 to 12 per file**
- **What**: Detector found em-dash overuse in every file. Body copy reads: "Short essays and unfiled opinions — mostly about taste, building things, and the gap between the two." / "The friction is the feature. A short defence of slow tools in a fast studio." / "Where someone starts matters less than how fast they bend the curve."
- **Why it matters**: Em-dash density is a recognized AI-generation cadence tell. Multiple em-dashes per section description, combined with the "serious statement, punchy fragment" sentence rhythm, reads as AI-generated copy even when the ideas are good.
- **Fix**: Rewrite article descriptions with commas, colons, or period-new-sentence. The ideas are strong; the punctuation is working against them. "Short essays and unfiled opinions: taste, building, and the gap between" is tighter and doesn't read as generated.
- **Suggested command**: `/impeccable clarify`

**[P2] The `shead-meta` bracket notation is the eyebrow reflex in disguise**
- **What**: Every section across every design variant has `[ OPINIONS · NOTES · 04 RECENT ]`, `[ EVERGREEN · MAINTAINED · INDEXED ]`, `[ STACK · DESK · BAG · CONFIG ]`, `[ 35MM · DITHERED · 2024–26 ]`. This is the all-caps tracked eyebrow chip rendered in bracket syntax. It fires reflexively on every section.
- **Why it matters**: The absolute ban on "tiny uppercase tracked eyebrow above every section" exists precisely because this pattern is the AI scaffold. The brackets make it look different but the behavior is identical: small metadata above every heading, everywhere.
- **Fix**: Reserve the bracket notation for sections where the metadata is genuinely informative and specific (e.g., `[ 35MM · DITHERED · 2024–26 ]` on photos is a real signal). Let section headings stand alone elsewhere. Three or fewer uses per page.
- **Suggested command**: `/impeccable clarify`

**[P2] Navigation has 8 items with an unexplained locked entry**
- **What**: Nav: Writing / Articles / Projects / Now / Setup / Photos | About / Travel ⌁. That's 8 links with no visual priority. "Writing" and "Articles" appear to be the same content type with no distinction. "Travel ⌁" is labeled with an unfamiliar lock glyph and no tooltip — is the link broken? Coming soon? Behind a paywall?
- **Why it matters**: A first-time visitor parsing 8 same-weight nav links in a 12px Space Mono will either ignore the nav entirely or spend working memory resolving the ambiguity. "Travel ⌁" specifically creates a question without answering it.
- **Fix**: Combine "Writing" and "Articles" into one entry (or rename them to reflect the actual distinction — e.g., "Essays" and "Notes"). Add a `title` attribute or tooltip to "Travel ⌁" explaining it's password-protected or coming soon.
- **Suggested command**: `/impeccable clarify`

**[P2] No reduced-motion path for the hero dither animation and photo-alignment script**
- **What**: RETRO v2's hero photo-alignment runs on `img.onload`, `window.resize`, and two `setTimeout` fallbacks. The dither canvas has `boil: 0.05, fps: 12` — a continuous ambient animation. The `paper.css` `@prefers-reduced-motion` only covers `.post` and `.coll` transitions.
- **Why it matters**: Continuous canvas animations (boiling dither) are motion-sensitive. Users with vestibular disorders may experience discomfort. WCAG 2.3.3 (AAA) and best practice require reduced-motion alternatives.
- **Fix**: Wrap all `Dither.ambient` and `Dither.photo` boil parameters in a `matchMedia('(prefers-reduced-motion: reduce)')` check. Set `boil: 0` when reduced-motion is active; render a single static frame instead.
- **Suggested command**: `/impeccable harden`

---

## Persona Red Flags

**Jordan (First-Timer)** — stumbles on the site from a social link, 10 seconds to orient:
- The RETRO v2 hero is spectacular but says "PIERRICK" — that's the owner's first name, not an introduction. Jordan doesn't know the context yet. The `hero-kick` metadata strip reads (`34.46°N 133.99°E · NAOSHIMA — FROM THE FIELD`) — geographic coordinates as the first text Jordan reads requires decoding.
- The overlay text inside the photo (`CEO & FOUNDER → studio / CREATIVE DIRECTOR → games`) is positioned `position: absolute` over a dithered photo. The `color: #f3ecdb` on a complex dithered background may fail contrast at some image regions.
- "Travel ⌁" in the nav looks like a broken link. Jordan will hesitate.
- **High abandonment risk at scroll depth 0**: the page is visually arresting but communicates identity indirectly. A first-time visitor without context needs 15+ seconds to understand who this is.

**Casey (Distracted Mobile User)** — browsing on 390px phone, one-handed:
- At 390px, `clamp(96px, 17.5vw, 256px)` = `17.5% × 390 = 68px`. "PIERRICK" in Anton at 68px is ~7 chars × ~42px = ~294px wide — close to the 390px viewport. The letter-spacing of `0.012em` at 68px adds ~5px. This may clip on narrow phones.
- The `hero2-role` absolute text inside the photo (role list) and the `hero2-serif` text (paragraph) are both positioned inside the 760px hero stage. On mobile the 880px breakpoint removes `hero-serif` (actually that's `hero-role` in v1, not v2). In RETRO v2's `@media (max-width: 880px)`, only v1 selectors are present — the `hero2-role`, `hero2-serif`, `hero2-bc` inside `hero2-stage` get no mobile treatment. These will stack and overlap on narrow screens.
- The 8-item nav wraps to 2+ lines at small viewports; with `flex-wrap: wrap` and `gap: 6px 22px`, it takes significant vertical space before the hero begins.

**Riley (Stress Tester)**:
- In RETRO v2, the `ctype` heading has `color: transparent; -webkit-text-fill-color: transparent`. If `arc-cdither.png` fails to load, the heading becomes invisible — no fallback color, no alt state. "PIERRICK" disappears entirely.
- The `align()` function exits early if `!img.naturalWidth`. On a slow connection, all three setTimeout calls may fire before the image loads, and the alignment would run on a zero-size image. The text would show transparent/misaligned until the next resize event.
- The Spec Sheet (03) annotation label positions use `left: 6%; top: 12%` percentages, but the SVG `spec-lines` uses viewBox `0 0 100 100` coordinates. These don't map to the same pixel positions — the annotation labels and their connector lines will not align accurately at all viewport widths.

---

## Minor Observations

- The `post .arrow` (→) is `position: absolute; left: -4px; top: 24px` — this hangs outside the grid's first column. If the grid container has `overflow: hidden`, the arrow will clip on hover. Worth checking.
- Bold Studies uses `body { background: #161512 }` (dark) as a presentation wrapper. When this file is eventually integrated into the site, the dark body would need to be scoped or removed.
- The `barcode` CSS gradient in paper.css is a neat touch but at 180px wide fixed, it doesn't scale with the footer at very wide or narrow viewports. A max-width or responsive width would improve it.
- `04 Riso.html` footer uses `.foot-brand { font-family: var(--sans) !important; font-weight: 900; text-transform: lowercase; }` but the page's `.topbar .brand` also overrides to lowercase. The top brand and footer brand are consistent within the variant, but the `!important` override suggests fragility — if paper.css token changes, the override may break unexpectedly.
- The `index.html` gallery cards use `transform: translateY(-4px)` on hover with `box-shadow`. This is a clean card interaction but the cards are not `<a>` elements wrapping an `href` to the actual design files — they are `<a class="card" href="01 Field Notes.html">`. Good. But the `thumb-wrap img` scales on hover: `transform: scale(1.035)`. The scale is 1.035× which is very subtle — might not register on casual viewing.

---

## Questions to Consider

- The hero is a single static dithered image of a specific place (Naoshima arc). When the photo is yours, does the location-specific framing (coordinates, "FROM THE FIELD") communicate enough about you to a visitor with no prior context, or does it require them to already know you?
- The five hero directions all share the same body sections. Is the goal to pick one direction and extend it, or to keep the mix-and-match vocabulary? If the body sections will always be shared, should they be designed as a neutral but distinctive "second language" for all five to speak?
- The numbers `001 / 002 / 003` in the writing list feel like a library catalog — intentional. But what happens when there are 200 articles? Does the index display scale to 4 digits, and does that look right?
