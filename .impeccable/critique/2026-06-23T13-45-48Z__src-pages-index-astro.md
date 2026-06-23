---
target: the homepage (src/pages/index.astro)
total_score: 32
p0_count: 0
p1_count: 0
timestamp: 2026-06-23T13-45-48Z
slug: src-pages-index-astro
---
## Design Health Score — 2e passe (post-fixes)

| # | Heuristique | Avant | Maintenant |
|---|-----------|:--:|:--:|
| 1 | Visibility of System Status | 3 | 4 |
| 2 | Match System / Real World | 3 | 3 |
| 3 | User Control & Freedom | 3 | 3 |
| 4 | Consistency & Standards | 4 | 4 |
| 5 | Error Prevention | 3 | 3 |
| 6 | Recognition vs Recall | 3 | 3 |
| 7 | Flexibility & Efficiency | 3 | 3 |
| 8 | Aesthetic & Minimalist | 3 | 4 |
| 9 | Error Recovery | 2 | 2 |
| 10 | Help & Documentation | 3 | 3 |
| **Total** | | **30** | **32 / 40 — Good** |

## Anti-Patterns Verdict

IA ? Non. L'incohérence de marque (bleu abandonné cohabitant avec l'olive locké) a disparu : une seule encre olive traverse la page (doctrine « one ink per page »). Hero `background-clip:text` sur image = signature lockée, PAS le ban gradient-text. `shead-meta` ramené à 3×.

Scan déterministe : `[]`, exit 0 — zéro finding (layout-thrash PostRow résolu). Overlay non injecté ; évaluation par sondes DOM + screenshots live (1440px + 390px).

## What's Working

1. Fidélité de marque restaurée — accent olive #3d491d partout (7.86:1), hero role #c2c762, topo neutre. Plus de contradiction avec la source de vérité.
2. Accessibilité du mobilier print — --ink-3 à 4.76:1 (coords, code-barres, metas lisibles), reste la teinte la plus claire du ramp.
3. Robustesse responsive — zéro débordement horizontal à 390px.

## Priority Issues (toutes basses)

- **[P2] Navigation : pas de retour accueil + densité.** Logo `·●paper` non lié, pas d'item « Home » (hasHomeLink=false). 7 items > guideline de 5. Cibles tactiles mobiles à 21px de haut (< 44px), serrées. Fix : logo → `/`, alléger la nav, padding vertical des liens en mobile. Commande : /impeccable adapt
- **[P3] Aucune 404 / récupération d'erreur** (heuristique 9 = 2). Fix : `src/pages/404.astro` dans le langage print. Commande : /impeccable harden
- **[P3] Contrastes locaux sur photo.** `.fmeta` FeaturedEssay (texte sombre sans ombre) sur photo ; `street-dither.png` quasi-noir dans la grille. Fix : scrim/ombre derrière `.fmeta`, caption plus présente. Commande : /impeccable polish
- **[P3] `<html lang="en">`** alors que projet documenté en français (contenu anglais) — confirmer l'intention. Commande : /impeccable clarify

## Persona Red Flags

- Casey (mobile) : plus de scroll latéral. Reste : liens de nav 21px serrés → mis-taps.
- Sam (basse vision) : mobilier print AA atteint, focus-visible OK. Reste risque `.fmeta` sur photo + `lang` à confirmer.
- Robin (pair/recruteur) : impression de fini nettement meilleure ; dual kicker/role assumé par la source.

## Minor Observations

- Dual Lyon (édition) / Naoshima (photo) non explicité — validé par la source, laissé tel quel.
- Open Graph / Twitter / canonical ajoutés (objectif découverte PRODUCT).

## Questions to Consider

- Le logo doit-il être le retour accueil universel ?
- Une 404 « page arrachée du carnet » renforcerait-elle la métaphore print ?
