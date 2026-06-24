---
target: Article.html (gabarit post)
total_score: 32
p0_count: 0
p1_count: 1
timestamp: 2026-06-23T20-42-44Z
slug: design-claude-design-pierrick-blog-article-html
---
## Design Health Score — Article.html

| # | Heuristique | Score | Point clé |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | barre de progression + bar sticky + scroll cue + hovers : fort pour une page de lecture |
| 2 | Match System / Real World | 3 | métaphore print cohérente, mais « DITHERED 8×8 » alors que le hero est un duotone bleu |
| 3 | User Control & Freedom | 4 | retour Writing, logo→home, footer ; sorties claires |
| 4 | Consistency & Standards | 2 | la page ride le sépia mais le hero est dithéré BLEU → deux encres sur une page (brise la loi « one ink ») |
| 5 | Error Prevention | 3 | page de lecture, peu applicable ; liens en # (placeholders) |
| 6 | Recognition vs Recall | 4 | titre sticky garde le contexte, stat row, tout est labellisé |
| 7 | Flexibility & Efficiency | 3 | progress bar ok ; pas de TOC mais essai court |
| 8 | Aesthetic & Minimalist | 3 | superbe et engagé ; mais liseré gauche sur la citation + discorde bleu/sépia |
| 9 | Error Recovery | 3 | pas d'états d'erreur (n/a) |
| 10 | Help & Documentation | 3 | article auto-explicite |
| **Total** | | **32/40** | **Good — première coupe solide** |

## Anti-Patterns Verdict

IA ? Non. La couverture, le mobilier print, le pipeline dither, et le confort de lecture du corps sont distinctifs. La **barre sticky est faite dans les règles** (présente par défaut, JS = enrichissement seul, reduced-motion géré) — exactement le garde-fou demandé.

Scan déterministe (3) : **side-stripe** `border-left: 3px solid accent` sur la citation (l.211, ban absolu) ; **layout-transition** `transition: width` sur la barre de progression (l.51, mineur) ; **numbered markers** 01/02/03 (advisory — défendable ici : vraie séquence argumentative, une page).

Le détecteur ne voit PAS le vrai sujet : le **dither bleu** du hero, qui n'est pas un tell IA mais une **rupture de doctrine** (revue design seulement).

## Overall Impression

C'est une très bonne première coupe : la couverture est saisissante, le corps se lit vraiment (mesure 66ch, Newsreader, hiérarchie nette), et la mécanique sticky/progress est propre. Le sujet n°1 n'est pas un bug mais une **décision de doctrine** : le hero est dithéré en **bleu marine** (pour matcher le ciel, ce que tu avais demandé), or la page ride le **sépia** et le NORTHSTAR dit noir sur blanc « one ink per page · no blue, ever · never two accents ». On voit littéralement un dither bleu en haut et un dither sépia au milieu. Magnifique **et** hors-la-loi. À trancher consciemment.

## What's Working

1. **Barre de lecture sticky exemplaire** : solide et atteignable sans JS, l'IntersectionObserver n'ajoute que l'état immersif transparent sur la couverture, reduced-motion coupe les transitions. C'est le modèle.
2. **Le corps est une vraie lecture** : 66ch, Newsreader 16.5/1.55, stat row instrument, drop cap sépia, sections cadencées. Confortable et de marque.
3. **La couverture** : composition Study 01 réussie (titre dans le ciel négatif, caption verticale, crédit EXIF), titre lisible car posé sur la zone de dither dense.

## Priority Issues

**[P1] Hero dithéré en BLEU → brise la loi couleur la plus explicite de la marque**
`Dither.photo(.post-hero, { ink:'22,46,74' … })` + `topoHero rgba(24,46,72,…)` = bleu marine. La page est sépia (`--accent:#9a7838`). NORTHSTAR (Color) : « one ink per page · **no blue, ever** · never two accents ». Visuellement : couverture bleue + plate sépia dans le corps = deux encres photographiques. **Ce n'est pas une négligence** : c'est la réponse à ton souhait (dither qui matche la photo → ciel = bleu). Collision réelle doctrine ↔ instinct photographique. **À trancher** :
- **A — tenir la doctrine** : dithérer le hero dans le **sépia** de la page (duotone tonal), titre sur halftone sépia. Garde « one ink ». Perd le réalisme ciel.
- **B — faire évoluer la doctrine** : autoriser un dither **keyé par image** → alors il faut **réécrire** dans le NORTHSTAR le « no blue ever / one ink » en « une encre pour le mobilier + le type ; le dither photographique peut suivre l'image ». Légitime (le brand register autorise « art direction per section »), mais ça doit être un **choix conscient**, pas un accident.
- Reco : c'est la colonne vertébrale de la marque, donc à toi. Si tu adores le per-image (et c'est beau), évolue la doctrine explicitement. Sinon, sépia. Ne le laisse pas implicite.
- Commande : décision de direction, puis `/impeccable colorize` (ou tweak Claude Design).

**[P2] Liseré gauche sur la citation (ban absolu « side-stripe »)**
`.pull { border-left: 3px solid var(--accent) }` (l.211) — le tell IA le plus reconnaissable. Fix : cadre filet complet, glyphe/guillemet mono en attaque, fond sépia léger, ou rien. Commande : `/impeccable typeset` (ou `quieter`).

**[P2] Lisibilité du titre dépend du recouvrement avec la zone de dither dense**
Lisible ici car le titre est posé haut sur le halftone dense + ombre. Mais fragile **par image** : descends-le dans le ciel clair, ou prends une photo claire, et le crème-sur-pâle échoue. Comme chaque hero est placé à la main : pose une **règle** — le titre vit sur la bande masquée dense (haut ~20%), ou ajoute un scrim localisé derrière le titre. Vérifier ≥3:1 (grand texte) par photo. Commande : discipline per-image / `harden`.

**[P3] La barre de progression anime `width`** (l.51) → `transform: scaleX()`. Trivial. Commande : `optimize`.

**[P3] Hero `margin-top: calc(-1*(48px+2px))`** hardcode la hauteur de la topbar → fragile si la barre change (chargement de font, mobile). Lier à une vraie variable / mesurer. Commande : `polish`.

## Persona Red Flags

- **Sam (basse vision)** : corps ink-2 AA ✓, labels ink-3 au plancher AA ✓, reduced-motion géré (dither figé + transitions off) ✓. Risque = titre crème sur photo (par image). Couleur jamais seule porteuse de sens ✓.
- **Casey (mobile)** : zéro débordement ✓, caption verticale masquée ✓, titre tient. Vérifier les cibles tactiles de la barre sticky (liens mono ~11px) ≥ 44px.
- **Robin (pair/recruteur)** : couverture qui accroche, essai qui se lit vite ; le split bleu/sépia peut faire « c'est le même site ? » à l'inspection rapprochée — la plupart ne le verront pas.

## Minor Observations

- « DITHERED 8×8 » dans le crédit alors que c'est un duotone bleu → donnée-mobilier incohérente.
- Numbered 01/02/03 : défendable (vraie séquence), mais à réserver aux vraies séquences, pas un réflexe sur chaque article.
- Drop cap Anton/accent : joli, mais cliché éditorial connu — un seul, ça va.
- Le corps appuie fort sur la cadence aphoristique (« It is not weather. » « Convenient. It is also wrong. » « All of it compounds. ») : c'est la voix PRODUCT (sèche/wry) mais c'est pile le watch Impeccable ; sur 20 articles ça deviendra un tic. (Copie placeholder de toute façon.)
- Hero = pas un drop-in : pour l'implémentation Astro, exposer en props (photo, ink/paper du dither, texte+position du titre, stops du masque, caption verticale, crédit).
- Liens footer/retour en `#` → câbler aux vraies routes à l'implémentation.

## Questions to Consider

- Le dither keyé-par-image vaut-il de réécrire « no blue, ever » ? (la question de la colonne vertébrale)
- Le hero d'article : gabarit strict (une encre) ou surface art-directée par pièce (le brand register autorise l'art direction par section) ?
- Un sommaire (TOC) pour les essais plus longs ?
