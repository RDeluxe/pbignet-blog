# exhale — CLAUDE.md

> **Nom de marque : `exhale`** (logotype en minuscules, Anton — plus de `·●paper`).
> Domaine : **exhale.blog**. L'ancien nom « dot·paper » est mort (zéro occurrence côté
> Claude Design depuis le sync du 2026-08-03).

## SOURCE DE VÉRITÉ DESIGN : `design/claude-design/Pierrick Blog/`

Le projet distant est organisé en deux étages depuis juillet 2026 :

- **racine = « gold »** — validé et tenu à jour : `0_NORTHSTAR.html`, `01_Home.html`,
  `02_Article.html`, `Pâte graphique*.html`, les deux `Test Export`, `assets/`.
- **`research/`** — studies & bancs d'essai. « A validated result graduates to root. »

**LE document de référence : `0_NORTHSTAR.html`** — le northstar specimen. Il consolide :
north star · brand & voice · **color** (base fixe + accent inks, règle « one ink per page ») ·
type · print furniture · components · page anatomy · inspiration motifs · build conventions ·
guardrails. **Le lire en premier**, avant toute décision de design.

⚠️ **Le NORTHSTAR porte ses propres valeurs de specimen** (`--ink: #18170f`,
`--ink-3: #8b8672`, `--maxw: 1080px`) qui ne valent **pas** pour le site. Les hex de
production sont ceux d'`assets/paper.css` + du `:root` des pages gold (`01_Home`,
`02_Article`), qui sont d'accord entre elles. Le NORTHSTAR fait foi sur la **doctrine**,
jamais sur les valeurs.

Avant de toucher à quoi que ce soit (composant, style, layout, animation), chercher la réponse dans ce dossier. Ne jamais improviser une décision de design.

**Doctrine CODE : `design/PIPELINE.md`** — comment la research Claude Design (HTML/CSS de page)
devient un design system maintenable : le tri (token / primitive / composant / effet / poubelle),
les règles dures (zéro `<style>` de page, `:global()` interdit, props = intentions, les 3
mécanismes props→style d'Astro et le piège `define:vars`), les écarts assumés face au NORTHSTAR,
et les deux procédures de sync. Le NORTHSTAR dit **quoi**, PIPELINE.md dit **comment ça devient
du code**. À lire avant d'écrire un composant.

```
design/
  PIPELINE.md                    ← ★ doctrine code : research → design system
  claude-design/Pierrick Blog/   ← MIROIR 100% Claude Design (écrasé à chaque sync, ne rien y éditer à la main)
    0_NORTHSTAR.html             ← ★ doctrine : northstar specimen, à lire en premier
    01_Home.html                 ← gold : la home (hero « la photo traverse les lettres »)
    02_Article.html              ← gold : le gabarit d'article (cover + corps)
    assets/paper.css             ← ★ SOURCE DES VALEURS (hex, tokens) avec le :root des pages gold
    assets/texture.js            ← Grain + Topo originaux
    assets/dither.js · assets/diagram.js · assets/image-slot.js · assets/spot-hero.js
    assets/photos/               ← les sources photo du gold (JPG + PNG dithérés)
    Pâte graphique*.html · Test Export*.html   ← exports (LinkedIn, tokens, sections)
    Design Notes.md              ← ★ JOURNAL DE DÉCISIONS (audit des boîtes, couleur paper, orga) — daté
    research/                    ← studies & bancs : directions 01–04, Bold Studies,
                                   « Article - hero studies », « Article - spot colour »,
                                   « Boxes - banc d'essai », « Paper - couleur », index.html
    uploads/ · screenshots/ · thumbs/
  impeccable/                    ← artefacts Impeccable (hors miroir, jamais écrasés par le sync)
```

**Règle** : si une décision de design n'est pas dans ce dossier, elle n'a pas été validée. Proposer avant d'implémenter.

**Préséance en cas de conflit** :
1. **`Design Notes.md`** pour les décisions **datées** (c'est le journal : « DECIDED (final, July 2026) », « décision août 2026 ») ;
2. **`assets/paper.css` + le `:root` des pages gold** pour les **valeurs** (hex, tailles) ;
3. **`0_NORTHSTAR.html`** pour la **doctrine** (règles, anatomie, guardrails) — mais pas pour ses hex, qui sont ceux du specimen ;
4. le reste de `Design Notes.md` (refs d'inspiration) en dernier.

Un narratif périmé ne fait jamais foi contre les valeurs. **Lire les dates** : `Design Notes.md` contient des décisions de juillet et août 2026 qui invalident des sections plus anciennes.

### Sync depuis Claude Design (piloté via MCP Playwright)

Source distante : **claude.ai/design**, projet `Pierrick Blog`
(`https://claude.ai/design/p/e60b80b7-668a-4d7c-a86d-36bb397d9245`).

> **Pourquoi pas un script standalone ?** L'export est pourtant un simple GET REST
> (`https://claude.ai/design/v1/design/projects/<id>/download` → `.zip`), mais
> **Cloudflare bloque tout login depuis un navigateur lancé par Playwright** (détection bot,
> challenge infini). Seul le **navigateur du MCP Playwright** — où Pierrick s'est connecté à la
> main — passe Cloudflare. On pilote donc le sync via le MCP, à la demande.

### Push UP : le projet « exhale Design System »

Un **second** projet Claude Design existe, de type Design System, qui reçoit le code comme
référence : **`cc9e3407-7dd6-4647-bb7a-f64e48c433eb`** (créé le 2026-08-03). Il est
**writable** par `DesignSync`, contrairement au projet de research.

```sh
npm run ds:build     # → .ds-bundle/ (tokens tels quels, contrats .d.ts, cards autonomes)
```
puis `DesignSync finalize_plan` (localDir = `.ds-bundle`) → `write_files` en `localPath`.
Détail et principes : `design/PIPELINE.md` §6.

Les deux projets ne se marchent pas dessus : **research → DOWN uniquement**, **DS → UP
uniquement**. Voir aussi `PIPELINE.md` §9 : tant que CD est la source de vérité du design, les
divergences du code sont une dette, et le DS poussé sert à les rendre visibles.

> **Lire UN fichier distant ne demande PAS de sync.** L'outil **`DesignSync get_file`**
> (`projectId` + `path`) lit le projet à l'unité via le login Claude Code, **sans navigateur
> et sans Cloudflare** — et `DesignSync list_files` donne l'arborescence distante, donc de
> quoi détecter en un appel que le miroir a dérivé. Validé 2026-08-03. Le zip ne sert qu'au
> miroir complet (binaires, screenshots, photos).
> ⚠️ `DesignSync` ne peut pas **écrire** dans ce projet : il est de type
> `PROJECT_TYPE_PROJECT`, et seuls les `PROJECT_TYPE_DESIGN_SYSTEM` sont writable (type
> immuable à la création — dupliquer n'y change rien).

Procédure (Claude la déroule quand Pierrick demande un sync) :

1. **`browser_navigate`** vers l'URL du projet. Si redirection vers `/login` → demander à
   Pierrick de se connecter dans la fenêtre MCP. La session **expire** (constaté ~6 semaines) :
   un 401 sur l'URL de download est le symptôme, il faut alors relancer la fenêtre et
   redemander le login.
2. **Export** — deux voies :
   - ✅ **Voie rapide (préférée, ~1 appel, peu de tokens, validée 2026-06-24)** : `browser_navigate`
     directement vers l'**URL REST de download** →
     `https://claude.ai/design/v1/design/projects/<id>/download` (id du projet ci-dessus).
     Le navigateur MCP est déjà passé Cloudflare, donc le GET télécharge le zip dans
     `.playwright-mcp/Pierrick-Blog.zip` sans la danse UI. (Un `curl` externe avec cookies
     échoue : `cf_clearance` est lié à l'empreinte TLS du navigateur + cookies httpOnly.)
   - Voie UI (fallback si l'URL change) : cliquer `Share` → onglet **Export** →
     **Project archive `.zip`** → **Download**.
   ⚠️ Pas dans le menu projet (Rename/Duplicate/Delete) ni via `DesignSync` (pas d'export zip).
3. **Miroir** (le dossier est 100% distant → miroir pur, pas d'`--exclude`). `ditto` gère l'UTF-8
   des noms accentués que `unzip` casse sur macOS :
   ```sh
   STAGE="$(mktemp -d)"
   ditto -x -k ".playwright-mcp/Pierrick-Blog.zip" "$STAGE"
   rsync -a --delete "$STAGE/" "design/claude-design/Pierrick Blog/"
   rm -rf "$STAGE" .playwright-mcp/Pierrick-Blog.zip
   ```
   `--delete` purge ce qui a disparu côté distant (ex. l'ancien `_ds/`). Les artefacts hors
   miroir (`design/impeccable/…`) ne sont pas touchés.

### Captures de vérification : toujours dans `.screenshots/`

Les screenshots pris pour valider un rendu (vérif Astro, debug visuel, etc.) sont **jetables** et
vont **exclusivement dans `.screenshots/`** à la racine du repo (dossier gitignored). Jamais à la
racine ni ailleurs dans l'arbre. Ne pas laisser de `homepage-*.png` & co traîner dans le projet.

---

## Stack technique

- **Framework** : Astro 6 + Svelte 5
- **CSS** : CSS pur, scopé par composant (pas de framework utilitaire — UnoCSS a été retiré).
  Global = `src/styles/tokens/{colors,type,space}.css` (custom properties **uniquement**, artefact
  partagé tel quel avec Claude Design) + `base.css` (reset, surface papier, a11y), agrégés par
  `src/styles/index.css`. Plus **aucune** classe globale hors `base.css` (l'ex-`paper.css` a
  atteint zéro). Variantes de composant = `data-*` + union TS. Détails et règles dures :
  `design/PIPELINE.md`.
- **Fonts** : self-hosted via `@fontsource` (Anton, Space Mono, Archivo Variable, Newsreader Variable)
- **Content** : Astro Content Collections (`src/content.config.ts`) — `writing` + `guides`, format Markdoc (`.md` / `.mdoc`)
- **Photos** : PNGs dithérés dans `public/photos/` — **ne jamais recompresser ni optimiser** les images dithérées, l'effet serait détruit

## Direction design lockée

Détails complets dans **`0_NORTHSTAR.html`** (north star, color, type, page anatomy, guardrails). En une phrase : index personnel sur papier, hero `01_Home.html` (la photo **traverse les lettres**, `background-clip: text`), dithering Bayer riso, un seul accent par page, mobilier d'impression (repères, code-barre, coords), typo Anton · Archivo · Space Mono · Newsreader.

**Valeurs concrètes (couleurs, tokens) : ne pas les recopier — lire la source.** `assets/paper.css` (`:root`) + le `:root` des pages gold pour les hex exacts ; le NORTHSTAR pour la doctrine seulement (ses hex sont ceux du specimen).

> **Papier (décision août 2026, banc `research/Paper - couleur.html`)** : `--paper: #f6f5f1` « Blanc cassé · silence » + `--paper-2: #edebe4`. Les anciennes valeurs `#ece6da`/`#e3dccd` sont mortes. `--paper-2` reste **réservé** aux panneaux en retrait et aux remplissages de hover.

> L'accent home est **olive `#3d491d`** ; les articles roulent en **sépia `#9a7838`**. L'ancien bleu `#2230c2` est abandonné.

### Vocabulaire des boîtes — DÉCIDÉ juillet 2026 (`Design Notes.md`, audit des boîtes)

- **plate** (présentation statique) = **B6** : cadre « grille empruntée » (lignes 1.2px ink dépassant ~13px des angles) sur papier nu + grille ultra-légère (majeure 64px @.05, mineure 16px @.022). La variante sur `paper-2` n'est qu'un secondaire « en retrait ».
- **tile** (interactif) = **D2** : nu au repos (bordure 1px `--line`) → croix d'angle 1px + bordure ink + fond `paper-2` au hover. Les angles sont le signal de focus.
- **callout** = **E1** : note épinglée, filet, 2 croix (tl+br), points estompés, tag mono « N.B. » cassant la bordure du haut.
- **boutons** : hover = remplissage dither animé (boil, steps, reduced-motion safe) ; l'inversion en ink reste un mode secondaire.
- **Interdits ajoutés** : aucune **barre d'accent à gauche**, **aucune ombre portée**, **zéro arrondi** (`.tag`/`.badge` ont perdu leur radius), `.frame-marks` (encoches film) retiré du gold. `.post` garde son glissement de 14px mais **plus de flèche au hover**.

> **Doctrine couleur (NORTHSTAR §05/§08) : « one ink per page » ne régit que le MOBILIER + le TYPE** (dot, liens, topo, tags, accents ; jamais bleu, jamais deux accents ; olive=home, sépia=articles). **Le ton du dither photographique en est exempté** : il peut être keyé à l'image (ex. ciel bleu → duotone marine sur un article sépia, c'est voulu, pas une faute). Corollaire : la couleur forte est un **événement de hero** — les plates du corps d'article restent en duotone sépia calme. Les covers d'article sont **art-directées par image** (placement titre à la main + override mobile + point focal `object-position`, contraste ≥3:1 par breakpoint).

### Vocabulaire (utiliser celui de Claude Design, pas du jargon dev)

**cover** = le hero d'un article · **recipe** = la config par image d'un hero (dither tone, placement et couleur du titre, point focal) · **study** = une exploration/variante · **plate** = image du corps d'article · **tile** = boîte interactive · **hero pop color** = le hero d'article qui fait popper une couleur extraite de l'image (`assets/spot-hero.js`, banc `research/Article - spot colour.html`). Le mot « polymorphe » est banni.

> **Doctrine couleur (mise à jour 2026-06-24, NORTHSTAR §05/§08) : « one ink per page » ne régit que le MOBILIER + le TYPE** (dot, liens, topo, tags, accents ; jamais bleu, jamais deux accents ; olive=home, sépia=articles). **Le ton du dither photographique en est exempté** : il peut être keyé à l'image (ex. ciel bleu → duotone marine sur un article sépia, c'est voulu, pas une faute). Les heros d'article sont **art-directés par image** (placement titre à la main + override mobile + point focal `object-position`, contraste ≥3:1 par breakpoint). Donc : **un dither non-olive/non-sépia n'est PAS une violation.**

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
