# exhale — CLAUDE.md

> **Nom de marque : `exhale`** (logotype en minuscules, Anton — plus de `·●paper`).
> Domaine : **exhale.blog**. L'ancien nom « dot·paper » est mort.

## Règles de travail avec Pierrick — 2026-08-05

1. **Rôle : exécutant.** Pierrick demande une modification, je la fais, point. La
   vérification (visuelle, mesures, tests au rendu) est de SON côté — et de celui d'Open
   Design, qui « fait ses affaires de vérification ». Pas de passes Playwright, captures
   ou mesures de contraste de ma propre initiative : **uniquement si le message courant
   le demande explicitement**. Un commentaire dans du contenu collé (ex. « contraste
   ≥3:1 MESURÉ ») n'est pas une demande.
2. **Le serveur dev ne se coupe jamais.** Pierrick teste dessus (`pnpm dev`, port 4321).
   Mes éventuels serveurs de vérification à moi utilisent d'autres ports et se coupent.
3. **Pas de mémoire `~/.claude`.** Toute note persistante (règles de travail, décisions,
   idées) vit **dans le repo** — ici même ou dans `design/`. Le dossier memory du
   harness ne doit pas être utilisé ; s'il contient quelque chose, le rapatrier ici.

## LE CODE EST LA SOURCE DE VÉRITÉ DU DESIGN — pivot du 2026-08-04

**Ce qui est dans `src/` est le site.** Les valeurs (hex, tailles, espacements) vivent
dans `src/styles/tokens/*.css` et le CSS scopé des composants — il n'y a plus d'autre
source de valeurs.

**L'atelier d'idéation est Open Design** (depuis le 2026-08-05) : une app desktop locale
qui lit une copie du build sur le disque — le transport claude.ai/Claude Design (zip,
upload, Cloudflare, `DesignSync`, rapatriement Playwright) est **mort**, il coûtait trop
de tokens. Le protocole complet : **[`design/PROTOCOL.md`](design/PROTOCOL.md)**.
L'ancien protocole de convergence continue (miroir par composant, `mirror:diff`, briefs,
gate à deux modes) avait déjà été démonté — historique au commit `d40181b` et avant ;
l'ère claude.ai (skill `session-cd`, `SESSION-CD.md`) est l'étape intermédiaire du
2026-08-04, morte le lendemain.

> ⛔ **La gate, forme actuelle** : rien de visible n'entre dans `src/` sans l'œil de
> Pierrick. C'est lui qui idéationne dans CD et lui qui décide ce qui revient. Ne
> demandent l'accord de personne : le rangement à valeur constante, un mécanisme dont on
> a **mesuré** que le rendu ne bouge pas, les corrections de bug. En cas de doute, ça ne
> passe pas. La mesure (Playwright : styles calculés, avant/après, captures) est de mon côté.

**La doctrine design est rapatriée dans le repo : `design/doctrine/`**

- **`design/doctrine/0_NORTHSTAR.html`** — LE document de doctrine : north star, brand &
  voice, couleur (« one ink per page »), type, mobilier d'impression, anatomie de page,
  guardrails. **Le lire en premier** avant toute décision de design.
  ⚠️ Ses valeurs (`--ink: #18170f`, `--maxw: 1080px`…) sont celles de son **specimen** :
  doctrine oui, hex jamais.
- **`design/doctrine/Design Notes.md`** — le journal historique des décisions datées
  (audit des boîtes, couleur papier). Les nouvelles décisions se journalisent en
  **commits du repo**, une décision ramenée de session = un commit qui la nomme.

**Doctrine CODE : [`design/PIPELINE.md`](design/PIPELINE.md)** — comment le HTML/CSS
d'idéation devient du code maintenable : le tri (token / primitive / composant / effet /
poubelle), les règles dures (zéro `<style>` de page, `:global()` interdit, props =
intentions, les 3 mécanismes props→style d'Astro et le piège `define:vars`). À lire avant
d'écrire un composant.

```
design/
  PROTOCOL.md                    ← ★ le protocole : code = vérité, sessions d'idéation CD
  SESSION-CD.md                  ← prompt à coller dans CD en début de session
  PIPELINE.md                    ← ★ doctrine code : idéation → design system
  doctrine/
    0_NORTHSTAR.html             ← ★ doctrine design (canonique ici depuis le 2026-08-04)
    Design Notes.md              ← journal historique des décisions de design
  claude-design/Pierrick Blog/   ← ARCHIVE du dernier état ramené de CD (plus une référence)
  briefs/                        ← archive de l'ancien flux UP (plus alimenté)
  impeccable/                    ← artefacts Impeccable
```

**Règle inchangée sur le fond** : ne jamais improviser une décision de design. Ce qui a
changé, c'est où on la cherche — la doctrine dans `design/doctrine/`, les valeurs dans
`src/styles/tokens/` et les composants. Si une réponse n'y est pas, la question est pour
Pierrick (en session CD ou directement), pas pour moi.

### La boucle Open Design, en bref (détail : PROTOCOL §3)

```
éditer src/  →  pnpm build:od  →  rafraîchir l'onglet d'aperçu Open Design
```

- `pnpm build:od` = `build:cd` + copie vers `<OD_PROJECT_DIR>/site/` + réécriture des
  chemins en relatif (le moteur OD rend en `file://` ; `OD_PROJECT_DIR` est une variable
  d'env, donnée de machine). `--no-build` pour resync seul.
- **L'aperçu montre tout, effets JS compris** (depuis le 2026-08-05) : `sync-od.mjs`
  rebundle les scripts module en classiques (CORS `file://`) et inline l'image du canvas
  dither en data-URI (tainting). `pnpm dev` reste la référence au plus près de la prod.
- Retour : l'atelier travaille en local, le rapatriement est une lecture de dossier.
  Pierrick tranche ; je porte dans `src/` selon le tri de PIPELINE §3 et je vérifie au
  rendu.

### Captures de vérification : toujours dans `.screenshots/`

Les screenshots pris pour valider un rendu (vérif Astro, debug visuel, etc.) sont **jetables** et
vont **exclusivement dans `.screenshots/`** à la racine du repo (dossier gitignored). Jamais à la
racine ni ailleurs dans l'arbre. Ne pas laisser de `homepage-*.png` & co traîner dans le projet.

---

## Stack technique

- **Framework** : Astro 6 + Svelte 5
- **CSS** : CSS pur, scopé par composant (pas de framework utilitaire — UnoCSS a été retiré).
  Global = `src/styles/tokens/{colors,type,space}.css` (custom properties **uniquement**) +
  `base.css` (reset, surface papier, a11y), agrégés par `src/styles/index.css`. Plus
  **aucune** classe globale hors `base.css`. Variantes de composant = `data-*` + union TS.
  Détails et règles dures : `design/PIPELINE.md`.
- **Fonts** : self-hosted via `@fontsource` (Anton, Space Mono, Archivo Variable, Newsreader Variable)
- **Content** : Astro Content Collections (`src/content.config.ts`) — `writing` + `guides`, format Markdoc (`.md` / `.mdoc`)
- **Photos** : PNGs dithérés dans `public/photos/` — **ne jamais recompresser ni optimiser** les images dithérées, l'effet serait détruit. Les sources couleur `public/photos/source/*.jpg` sont **intentionnellement** en prod (décision 2026-08-05) — les covers pop-color lisent dessus, ne pas les « nettoyer »

## Direction design lockée

Détails complets dans **`design/doctrine/0_NORTHSTAR.html`** (north star, color, type, page
anatomy, guardrails). En une phrase : index personnel sur papier, hero home (la photo
**traverse les lettres**, `background-clip: text`), dithering Bayer riso, un seul accent par
page, mobilier d'impression (repères, code-barre, coords), typo Anton · Archivo · Space Mono ·
Newsreader.

**Valeurs concrètes (couleurs, tokens) : ne pas les recopier — lire `src/styles/tokens/`.**
Le NORTHSTAR pour la doctrine seulement (ses hex sont ceux du specimen).

> **Papier (décision août 2026)** : `--paper: #f6f5f1` « Blanc cassé · silence » + `--paper-2: #edebe4`. Les anciennes valeurs `#ece6da`/`#e3dccd` sont mortes. `--paper-2` reste **réservé** aux panneaux en retrait et aux remplissages de hover.

> L'accent home est **olive `#3d491d`** ; les articles roulent en **sépia `#9a7838`**. L'ancien bleu `#2230c2` est abandonné.

### Vocabulaire des boîtes — DÉCIDÉ juillet 2026 (`doctrine/Design Notes.md`, audit des boîtes)

- **plate** (présentation statique) = **B6** : cadre « grille empruntée » (lignes 1.2px ink dépassant ~13px des angles) sur papier nu + grille ultra-légère. La variante sur `paper-2` n'est qu'un secondaire « en retrait ».
- **tile** (interactif) = **D2** : nu au repos (bordure 1px `--line`) → croix d'angle 1px + bordure ink + fond `paper-2` au hover. Les angles sont le signal de focus.
- **callout** = **E1** : note épinglée, filet, 2 croix (tl+br), points estompés, tag mono « N.B. » cassant la bordure du haut.
- **boutons** : hover = remplissage dither animé (boil, steps, reduced-motion safe) ; l'inversion en ink reste un mode secondaire.
- **Interdits** : aucune **barre d'accent à gauche**, **aucune ombre portée**, **zéro arrondi** (`.tag`/`.badge` ont perdu leur radius). `.post` garde son glissement de 14px mais **plus de flèche au hover**.

### Vocabulaire (utiliser celui de Claude Design, pas du jargon dev)

**cover** = le hero d'un article · **recipe** = la config par image d'un hero (dither tone, placement et couleur du titre, point focal) · **study** = une exploration/variante · **plate** = image du corps d'article · **tile** = boîte interactive · **hero pop color** = le hero d'article qui fait popper une couleur extraite de l'image (`src/lib/spot-hero.ts`). Le mot « polymorphe » est banni.

> **Doctrine couleur (NORTHSTAR §05/§08) : « one ink per page » ne régit que le MOBILIER + le TYPE** (dot, liens, topo, tags, accents ; jamais bleu, jamais deux accents ; olive=home, sépia=articles). **Le ton du dither photographique en est exempté** : il peut être keyé à l'image (ex. ciel bleu → duotone marine sur un article sépia, c'est voulu, pas une faute). Corollaire : la couleur forte est un **événement de hero** — les plates du corps d'article restent en duotone sépia calme. Les covers d'article sont **art-directées par image** (placement titre à la main + override mobile + point focal `object-position`, contraste ≥3:1 par breakpoint, **mesuré**). Donc : **un dither non-olive/non-sépia n'est PAS une violation.**

## Anti-patterns à éviter

Voir `PRODUCT.md` pour la liste complète. En résumé :
- Pas de fond crème/beige sans texture matière
- Pas de compteurs de stats ni de texte en dégradé
- Pas d'eyebrow uppercase tracké au-dessus de **chaque** section (`shead-meta` max 3×/page)
- Pas d'em-dashes en excès dans le copy (>3 par page = signal AI)
- Ne jamais softener l'effet hero (c'est une décision engagée)

## Critique Impeccable

`.impeccable/critique/2026-06-05T16-51-08Z__source-data-claude-design-pierrick-blog.md` — score 27/40, P1/P2 issues documentés, consulter avant d'itérer sur le design.

## Pages à construire (prochaines étapes)

Writing index · Article (long-form) · Photos (grid + swatches) · Now · Setup

## Idées en réserve

- **QR géo dans le hero** (floatée le 2026-06-23) : remplacer l'ancien code-barre décoratif
  (retiré car « ça signifie rien ») par un QR code maison, thématisé print/riso, qui renvoie
  vers le lieu de la photo sur Google Maps — dérivable des métadonnées EXIF (lieu · appareil ·
  coords), dans la doctrine « le mobilier print est de la donnée, pas de la déco ».
