---
target: the homepage (src/pages/index.astro)
total_score: 30
p0_count: 0
p1_count: 2
timestamp: 2026-06-23T13-21-52Z
slug: src-pages-index-astro
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Hover/active states solid; « Travel ⌁ » verrouillé paraît cliquable mais mène à un cul-de-sac (tooltip seul) |
| 2 | Match System / Real World | 3 | Métaphore print cohérente, mais les « données » se contredisent (Lyon vs Naoshima, deux jeux de coords) |
| 3 | User Control & Freedom | 3 | Pas de lien retour accueil sur le logo ·●paper ; nav sans « Home » |
| 4 | Consistency & Standards | 4 | Système visuel très cohérent (tokens, tags, cards, mobilier print) |
| 5 | Error Prevention | 3 | Peu applicable (statique) ; léger piège du lien verrouillé |
| 6 | Recognition Rather Than Recall | 3 | Nav en texte (pas d'icônes nues), sections claires ; 7 items > guideline de 5 |
| 7 | Flexibility & Efficiency | 3 | Affordances hover correctes ; rien pour power users mais non requis |
| 8 | Aesthetic & Minimalist | 3 | Force du projet, mais labels ink-3 illisibles + shead-meta 4× (règle maison: max 3) |
| 9 | Error Recovery | 2 | Aucune gestion d'erreur/404 ; liens verrouillés sans message de récup |
| 10 | Help & Documentation | 3 | Index perso auto-explicite, docs non nécessaires |
| **Total** | | **30/40** | **Good — fondation solide, corriger les points faibles** |

## Anti-Patterns Verdict

**Est-ce que ça a l'air généré par IA ? Non.** Le site a un POV engagé (artefact imprimé riso), un hero signature (la photo traverse les lettres via `background-clip:text` sur **une image**, pas un dégradé), et du mobilier d'impression spécifique (edition, filed by, coords, code-barre). Il passe le brand slop test et les deux altitudes du category-reflex check : ni SaaS-cream, ni le piège « editorial-typographic » par défaut. C'est un specimen print, pas un template.

**Scan déterministe** : 1 warning — `layout-transition` dans `PostRow.astro:38` (`transition: padding-left` au hover → layout thrash). Le détecteur n'a **pas** flaggé le hero : `background-clip:text` y est combiné à une **image**, pas à un dégradé → ce n'est PAS le ban « gradient text » (c'est la signature lockée, défendue par PRODUCT principe 4). À ne pas « corriger » par réflexe.

**Inspection navigateur** : pas d'overlay injecté ; évaluation via screenshots live (1440px + 390px) + sondes DOM (contraste tokens, débordements, état des images). Aucun overlay visible côté navigateur à revendiquer.

## Overall Impression

C'est bon, et c'est rare : le homepage a une vraie personnalité et tient la promesse de PRODUCT (« comprendre qui est Pierrick en 10s »). Le hero est engagé et juste. Ce qui plombe la note n'est pas le design mais la **fidélité à la source de vérité et l'accessibilité** : le site shippe encore l'**accent bleu abandonné** au lieu de l'olive locké, et les labels du mobilier print sont sous le seuil de contraste AA. La plus grande opportunité : aligner l'encre + remonter le contraste des labels, et le site passe de « beau mais inachevé à l'inspection » à « fini ».

## What's Working

1. **Le hero photo-dans-les-lettres.** Décision engagée, exécutée proprement (alignement JS du `background-clip` sur le `photo-plane`, fallback `@supports`, fallback couleur). C'est la signature et elle marche.
2. **Le système print, cohérent de bout en bout.** Metabar, tags, code-barres, repères de coupe, numéros d'index : un vocabulaire unique appliqué partout. Score consistance 4/4 mérité.
3. **Le rythme de mise en page.** Le `FeaturedEssay` full-bleed qui casse le `wrap` entre deux sections cadrées crée une vraie respiration éditoriale, pas une liste de cards uniformes.

## Priority Issues

- **[P1] L'accent shippé est le bleu `#2230c2` abandonné, pas l'olive `#3d491d` locké**
  - **Pourquoi** : NORTHSTAR + CLAUDE.md (2026-06-23) ont locké l'olive avec la doctrine « one ink per page ». `paper.css:17` (`--accent`), `:21` (`--topo` bleu), le fallback `rgba(37,48,194)` dans `texture.js`/BaseLayout, et `hero2-role b { color:#aeb6ff }` portent tous l'ancienne encre. Le site contredit sa propre source de vérité sur l'élément le plus visible de l'identité.
  - **Fix** : passer `--accent` → `#3d491d`, recalculer `--topo` et le fallback rgba sur l'olive, remplacer le `#aeb6ff` du hero par un ton clair dérivé de l'olive. Vérifier le contraste accent/papier après.
  - **Commande** : `/impeccable colorize`

- **[P1] Labels du mobilier print sous le seuil de contraste AA (`--ink-3 #8b8672` sur papier ≈ 2.9:1)**
  - **Pourquoi** : tout le mobilier signature (shead-meta, mono-label, idx PostRow, gnum, coll-foot, footer h4, metabar `.k`) est en ink-3 à 10–11px. ~2.9:1 échoue AA (4.5:1 requis pour ce corps). Les détails qui font la marque sont les plus durs à lire — et PRODUCT vise WCAG AA.
  - **Fix** : foncer ink-3 vers ~`#6e6a56` (≈4.5:1) ou réserver ink-3 aux éléments non-texte ; revalider chaque usage.
  - **Commande** : `/impeccable polish`

- **[P2] Scroll horizontal sur mobile (`shead-meta` en `white-space:nowrap`)**
  - **Pourquoi** : à 390px, `document.scrollWidth = 414px`. Deux metas de section (`[ PHOTO-ESSAY · TRAVEL ]`, `[ 35MM · DITHERED · 2024–26 ]`) en `nowrap` dans un flex `space-between` débordent le viewport. La fenêtre fait partie du design (brand.md).
  - **Fix** : dans `SectionHead`, sous ~520px, empiler la meta sous le titre (ou `flex-wrap` + `white-space:normal`, ou masquer la meta).
  - **Commande** : `/impeccable adapt`

- **[P2] Les « données » du mobilier print se contredisent**
  - **Pourquoi** : le concept repose sur « le mobilier d'impression est de la donnée, pas de la déco » (PRODUCT principe 2). Or Metabar dit `Lyon, FR` + footer `45.76N 4.83E` (Lyon), tandis que le Hero dit `NAOSHIMA` + `34.46N 133.99E` (Naoshima). Et l'identité varie : kicker `ENGINEER / ARTIST` vs role `CEO & FOUNDER → studio / CREATIVE DIRECTOR → games / PHOTOGRAPHER` vs PRODUCT « engineer, creative director, photographer ». À l'inspection, la donnée ne tient pas.
  - **Fix** : un seul jeu de coordonnées cohérent par contexte (lieu de l'édition vs lieu de la photo, assumé), une seule formulation d'identité.
  - **Commande** : `/impeccable clarify`

- **[P2] `shead-meta` utilisé 4× (règle maison : max 3/page)**
  - **Pourquoi** : Writing, Latest Field Note, Field Guides, Photographs portent tous une meta tracked-uppercase. CLAUDE.md plafonne explicitement à 3 — au-delà, ça glisse vers la cadence « eyebrow » d'IA, même aligné à droite.
  - **Fix** : retirer une meta (ex. « The Setup » n'en a déjà pas — en retirer une autre) ou varier la cadence.
  - **Commande** : `/impeccable typeset`

- **[P3] `PostRow` anime `padding-left` (layout thrash)**
  - **Pourquoi** : `.post:hover { padding-left:14px }` + `transition: padding-left` reflow chaque rangée au survol (hit détecteur).
  - **Fix** : animer `transform: translateX()` sur le contenu interne au lieu du padding.
  - **Commande** : `/impeccable optimize`

## Persona Red Flags

**Casey (mobile, une main)** : la page scrolle latéralement de ~24px (débordement `shead-meta`) — sensation « cassé ». Les metas de section sont rognées/serrées. Les liens de nav (mono 12px, gap 6px vertical) forment des cibles tactiles < 44px, collées les unes aux autres → mis-taps probables.

**Sam (lecteur d'écran / basse vision)** : tout le mobilier print à ~2.9:1 est sous AA — coords, code-barres, metas illisibles en basse vision. `focus-visible` est bien implémenté (bon point). La texture canvas (Topo/Grain) et le script d'alignement hero ignorent `prefers-reduced-motion` (la règle CSS ne couvre que les transitions, pas le JS/canvas) — PRODUCT le signale déjà comme à faire.

**Robin (pair / recruteur qui scanne le goût en 10s)** : le hero communique fort, mais le bloc role « CEO & FOUNDER → studio » entre en concurrence avec le kicker « ENGINEER / ARTIST » et avec PRODUCT — qui est Pierrick au juste, en 10s ? Deux villes en coordonnées. Le design impressionne ; à l'inspection rapprochée, la donnée donne une impression « pas tout à fait fini ».

## Minor Observations

- Le logo `·●paper` (metabar + footer) n'est pas un lien vers l'accueil ; pas d'item « Home ».
- « Travel ⌁ » verrouillé navigue quand même (`href="/travel"`) → cul-de-sac ; le désactiver (`aria-disabled`, pas de href) ou le marquer plus clairement.
- `street-dither.png` (photo de nuit) rend quasi-noir dans la grille — peut passer pour une image cassée pour un nouveau venu ; caption peu visible.
- Pas de méta Open Graph / Twitter / canonical dans `BaseLayout` — handicape l'objectif PRODUCT « découverte via social/search » au partage.
- `.fmeta` du FeaturedEssay (texte sombre `#36281f`, sans ombre) sur la photo torii en bas-droite : risque de contraste selon la zone d'image.
- `<html lang="en">` alors que le contenu est anglais mais le projet documenté en français — confirmer l'intention.

## Questions to Consider

- Et si une seule encre d'accent (l'olive locké) traversait *vraiment* toute la page, code-barres et coords compris, au lieu de cohabiter avec des restes de bleu ?
- Les coordonnées et le lieu doivent-ils raconter l'édition (où le site est « imprimé ») ou la photo en cours ? Le choisir rend la donnée crédible.
- À quoi ressemblerait une version où le mobilier print est aussi lisible qu'il est beau ?
