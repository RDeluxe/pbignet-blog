# PIPELINE — de la research Claude Design au design system en prod

> **Ce document est la doctrine CODE.** La doctrine DESIGN est dans
> `claude-design/Pierrick Blog/0_NORTHSTAR.html` (north star, couleur, type, anatomie de
> page, guardrails). Le NORTHSTAR dit **quoi**, ce document dit **comment ça devient du
> code maintenable**.
>
> L'**interface** avec Claude Design — qui décide quoi, le miroir CSS, les procédures de
> sync, la vérification — est dans [`PROTOCOL.md`](./PROTOCOL.md).

---

## 1. Pourquoi ce document existe

Claude Design produit du **HTML + CSS de page** : un fichier autonome par exploration, avec
des `id` en dur, du JS inline, des valeurs magiques et des styles recopiés d'une page à
l'autre. C'est le bon format pour de la **research** — rapide, autonome, jetable.

Ce n'est pas le format de la prod. La prod veut des **composants** à l'API typée, des
**tokens uniques**, et zéro CSS de page. Sans règle de passage explicite, on obtient la
dérive : trois copies des mêmes couleurs, un `<style>` par page, et des décisions de design
qui existent en deux versions incompatibles.

Ce document est la règle de passage.

---

## 2. Le flux, en une image

```
┌─ Claude Design : « Pierrick Blog » ─┐   gold (validé) + research (bancs d'essai)
│  HTML/CSS autonome                  │   ── JAMAIS édité depuis le repo ──
└──────────────┬──────────────────────┘
               │ DOWN — zip via MCP Playwright (PROTOCOL §4.1)
               ▼
    design/claude-design/Pierrick Blog/    MIROIR pur, écrasé à chaque sync
               │         ▲
               │ TRI     │ le miroir porte un fichier CSS par composant :
               │ (§3)    │ assets/components/<Nom>.css ↔ <Nom>.astro
               ▼         │
    src/styles/tokens/*.css · src/components/** · src/lib/**
               │         │
               └─────────┘ pnpm mirror:diff — compare les deux côtés
                           par déclaration (PROTOCOL §4.3)
```

**Asymétrie volontaire** : on lit CD, on n'y écrit jamais. Ce qui remonte prend la forme
d'un **brief en prose** (`design/briefs/`), et c'est CD qui l'applique — jamais un bundle
poussé depuis le repo. Détail et raisons dans `PROTOCOL.md` §4.2.

Le miroir n'est donc pas seulement une copie de lecture : comme les deux côtés portent le
même découpage, un écart devient un **diff lisible** au lieu d'une intuition.

---

## 3. Le tri : ce qui traverse, ce qui reste, ce qui meurt

Pour chaque page de research qu'on porte en prod, chaque déclaration tombe dans une case.

| Ce qu'on trouve dans la research | Destination | Règle |
|---|---|---|
| Une couleur, une taille de police, un espacement, une largeur | `src/styles/tokens/*.css` | **Nommé, jamais recopié.** Si la valeur existe déjà sous un autre nom, on réutilise. |
| Une structure de mise en page (grille, pile, gouttière, mesure) | primitive dans `src/components/primitives/` | Aucune identité de marque. Réutilisable par toutes les pages. |
| Un élément identifiable de la marque (hero, ligne de post, cadre photo, code-barre) | composant dans `src/components/` | Props **sémantiques** (§4). Compose des primitives. |
| Un effet (dither, grain, topo, alignement du hero) | module TS dans `src/lib/` | API stable, `prefers-reduced-motion` géré **dans** le module. |
| Le copy de démonstration | `src/content/` | Jamais en dur dans un composant. |
| `id` en dur, JS inline, valeur magique, `!important`, hack de spécificité | **poubelle** | Ne traverse pas. On réimplémente proprement. |
| Un narratif de doc contredit par les tokens | **poubelle** | Cf. §5 : les tokens font foi sur les valeurs. |

**Le test** : si une déclaration ne rentre dans aucune des cinq premières cases, elle ne
traverse pas. Il n'y a pas de case « CSS de page ».

---

## 4. Les règles dures

Elles sont dures parce qu'elles sont vérifiables. Une revue peut les trancher sans débat.

### 4.1 Zéro `<style>` dans une page

Un fichier de `src/pages/` ne contient **aucun** bloc `<style>`. S'il en faut un, c'est
qu'une primitive ou une prop manque. La seule exception tolérée : le placement de
composition d'une grille propre à cette page (`grid-template-areas`) — et même là, une
primitive est préférable.

### 4.2 Zéro classe globale nouvelle

Les seuls CSS globaux légitimes sont `tokens/*.css` (custom properties uniquement) et
`base.css` (reset, surface papier, focus, reduced-motion). `src/styles/paper.css` est une
**zone de transition** : on ne fait qu'en retirer, jamais ajouter. Elle doit atteindre zéro.

### 4.3 `:global()` est un aveu

`:global()` dans un composant signifie qu'il atteint l'intérieur d'un autre. Le vrai
correctif est une prop sur le composant enfant.

*Cas type — la dette actuelle d'`index.astro`* :
```css
/* ✗ la page démonte le composant */
.coll-grid > :global(.coll) { border: none; background: var(--paper); }
```
```astro
<!-- ✓ le composant expose son mode -->
<CollCard bordered={false} />
```

### 4.4 Les props expriment des intentions, pas des valeurs CSS

```astro
✗ <Hero line="34%" gap="12px" height="min(82vh,760px)" />
✓ <Hero height="immersive" place="bottom-left" />
```
Les valeurs vivent **dans** le composant, avec ses media queries. Une prop de valeur brute
(`34%`) empêche le composant de s'adapter et déplace la décision de design vers l'appelant.

### 4.5 Trois mécanismes pour que les props pilotent le style — dans cet ordre

**a) `data-*` + union TS — pour les variantes discrètes.** Le défaut.

```astro
interface Props { size?: 'lg' | 'md'; align?: 'row' | 'stack' }
const { size = 'lg', align = 'row' } = Astro.props
---
<div class="shead" data-size={size} data-align={align}>
```
```css
.shead[data-align='stack'] { flex-direction: column; }
.shead[data-size='md'] h2  { font-size: var(--fs-shead-md); }
```

Astro émet `.shead[data-astro-cid-xxx][data-align=row]` : le scope et la variante
cohabitent. Zéro runtime, zéro concaténation de classes, et une valeur non prévue ne
compile pas. **Pas de `class:list` pour les variantes** — `data-*` garde une source unique
et se lit dans l'inspecteur.

**b) `define:vars` — pour les valeurs continues** (un %, un vh, une couleur calculée).

> ⚠️ **Le piège** : `define:vars` pose les variables en `style` **inline**, donc elles
> **gagnent contre les media queries**. Une prop n'écrit donc **jamais** la variable
> utilisée par le CSS, elle écrit une variable **base** :
> ```css
> .hero { --hero-line: var(--hero-line-base, 34%); }        /* prop → base */
> @media (max-width: 880px) { .hero { --hero-line: 24%; } }  /* le breakpoint peut gagner */
> ```
> Sans ce niveau d'indirection, le responsive du composant est mort silencieusement.

**c) `style` inline — uniquement pour le non-statique par nature** : URL d'image,
`object-position` d'un point focal.

### 4.6 Un token lu en JS reste une valeur littérale

`getPropertyValue()` ne résout pas `color-mix()` sur une custom property non enregistrée :
la fonction arriverait telle quelle au canvas. `--topo` (lue par `Topo.mount`) est donc en
`rgba()` littéral. Vaut pour tout token consommé par `src/lib/` ou un `<script>`.

### 4.6b Le contraste sur photo se MESURE, à chaque breakpoint

Le NORTHSTAR exige ≥3:1 (grand texte) pour un titre posé sur une image, **par breakpoint**.
À l'œil, c'est impossible à trancher — et une capture rassurante ne prouve rien : sur
`HeroPopColor`, un titre crème qui donnait 3,33:1 en large tombait à **2,28:1** à 390px,
parce que l'override mobile le déplaçait sur une zone claire.

La mesure : prendre la bbox du titre, la projeter dans le canvas basse résolution, calculer
le ratio WCAG entre la couleur du titre et **chaque pixel** du fond, garder le **pire**.

```js
const lum = (r, g, b) => { const f = c => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
// … échantillonner le canvas sous la bbox, retenir Math.min(ratio) sur tous les pixels
```

**Ce n'est pas la photo qui gouverne le contraste, c'est le fond dithéré** : `spot.paper`
est la valeur la plus claire du cadre, donc le plafond. Un gris moyen (`128,132,122`)
plafonne vers 3,4:1 et passe sous le seuil dès qu'une zone de couleur conservée est claire
(un ciel). Garder un ground sombre (~`78,82,74`) ou basculer `titleInk`. Déplacer le titre
ne sauve pas un ground trop clair : le scan de 10% à 75% de hauteur ne dépassait jamais
3,33:1.

### 4.7 Une valeur de style n'apparaît qu'une fois — mais tout n'est pas un token

Deux valeurs proches pour une même intention (`clamp(20px,2.4vw,28px)` et
`clamp(21px,2.7vw,31px)` ; trois crèmes `#f4efe3` / `#f3ecdb` / `#f1ead8`) sont un **bug de
design**, pas deux tokens. Ça se corrige, pas se documente.

En revanche, **tokeniser n'est pas gratuit** : chaque token est une indirection à lire et à
maintenir. Le critère :

> **Un token existe pour ce qui se répète entre composants, ou porte une intention de
> marque.** Un padding interne à un seul composant n'en a pas besoin.

Concrètement, après le passage des quatre agents sur 47 valeurs candidates :

| Tokenisé | Pourquoi |
|---|---|
| `--cross-size/weight/out` | les croix de repérage servent dans 3 composants (tiles D2 + callout E1) |
| `--dur-fast/base/slow` | 4 composants réinventaient leur timing |
| `--photo-ground`, `--photo-scrim-rgb`, `--photo-ink-dark` | dupliqués entre `PhotoFrame` et `FeaturedEssay` |
| `--riso-red-ink/deep` | déclinaisons d'une encre de marque |
| `--line-strong`, `--rule-frame`, `--plate-*`, `--dot-*` | valeurs arrêtées par une décision de design (audit des boîtes) |
| `--fs-brand-sm/lg`, `--tr-brand` | le logotype, dans 2 composants |
| `--lh-loose` | 3 usages |

| **Laissé en littéral** | Pourquoi |
|---|---|
| paddings internes (`20px`, `24px`, `18px`, `14px`, `11px`, `9px`, `3px`) | un seul composant, aucune intention partagée |
| trackings ponctuels (`0.05em`, `0.06em`, `0.08em`, `0.12em`) | idem — l'échelle mono couvre les rôles, pas chaque cas |
| `116px` (plancher d'une tile setup), `15px` (titre de callout) | un seul usage |

Les valeurs laissées en littéral gardent un commentaire `/* TODO token: … */` : elles ne sont
pas oubliées, elles sont **jugées non tokenisables pour l'instant**. Si une deuxième
occurrence apparaît, le TODO devient un token.

---

## 5. Conflits de sources : l'ordre de préséance

1. **`Design Notes.md` pour les décisions datées** — c'est le journal de bord :
   « DECIDED (final, July 2026) », « Couleur Paper — décision août 2026 ». Le plus récent gagne.
2. **`assets/paper.css` + le `:root` des pages gold** (`01_Home`, `02_Article`) pour les
   **valeurs** — hex, tailles, espacements.
3. **`0_NORTHSTAR.html`** pour la **doctrine** — règles, anatomie, guardrails.
4. Le reste de `Design Notes.md` (refs d'inspiration) en dernier.

> ⚠️ **L'erreur à ne pas refaire.** Le NORTHSTAR `@import`e `assets/paper.css` **puis
> l'override** dans son propre `<style>` : `--ink: #18170f`, `--ink-3: #8b8672`,
> `--maxw: 1080px`. J'en ai déduit que ses valeurs étaient « les plus récentes » et je les ai
> portées en prod. C'est faux : **c'est la mise en page du specimen**, un document conçu pour
> être lu. Les deux pages gold sont d'accord entre elles et avec `paper.css` — ce sont elles
> qui font le site. Le NORTHSTAR fait foi sur la doctrine, **jamais** sur les hex. C'est
> exactement ce que `CLAUDE.md` disait déjà ; j'ai sur-appliqué la règle générale de
> préséance contre l'instruction précise.

**Lire les dates.** Un miroir de six semaines a suffi pour manquer : le nouveau papier
(`#f6f5f1`), le renommage de la marque en **exhale**, tout le vocabulaire de boîtes
(plate/tile/callout), la suppression des arrondis et de la flèche de `.post`.

### Écarts assumés en prod

**Aucun.** Les tokens reprennent les valeurs de la source telles quelles. Si un écart devient
nécessaire (accessibilité, contrainte technique), il se documente ici **et** dans le fichier
de token — une divergence non listée est un bug.

Un seul écart de nomenclature, sans effet sur les valeurs : `--paper-2` est nommé comme dans
la source, et **son usage reste restreint** aux panneaux en retrait et aux remplissages de
hover (Design Notes, juillet 2026). Ce n'est pas un fond de page alternatif.

### Normalisations sur l'échelle — valeurs absorbées

Une valeur hors échelle est ramenée au pas le plus proche : l'échelle n'a d'intérêt que si
elle est respectée. Les écarts sont invisibles à l'œil, mais listés pour être contestables.

| Endroit | Avant | Après | Note |
|---|---|---|---|
| `Lede` | `clamp(20px,2.4vw,28px)` **et** `clamp(21px,2.7vw,31px)` | `--fs-lead: clamp(20px,2.6vw,30px)` | Deux valeurs pour une intention = un bug de design. Ce qui varie est la **mesure** (30ch / 24ch), pas la taille. Aucune des deux n'était dans la source. |
| `Grid` | `gap: 12px` (photos) **et** `14px` (gear) | `--gap-grid: 12px` | Même intention, deux valeurs. |
| Encre sur photo | `#f4efe3` **et** `#f3ecdb` **et** `#f1ead8` | `--cover-ink-light` (`#f4efe3`) | **Trois** crèmes pour une seule intention — le crédit du hero, le mot de couverture et les légendes photo. Écart maximal 11/255 sur le bleu : invisible à l'œil, mais c'était trois vérités. |
| `CollCard` | `lift translateY(-3px)` au hover | supprimé | L'audit des boîtes cite ce lift dans le *problème* ; D2 définit **un** hover unifié sans déplacement. Visible sur la home. |

**L'échelle d'espacement est une invention locale** — la source utilise des valeurs libres.
En cas de conflit, **la valeur de la source gagne** : on ajoute un pas plutôt que de
« normaliser ». C'est pourquoi le `margin-bottom: 18px` de `.shead`, d'abord ramené à 16px,
a été restauré via `--space-head` : 18px est la valeur validée par le design, mon échelle ne
l'était pas.

### Arbitrages ouverts

- **`--fs-shead-md`** (`clamp(21px,3vw,32px)`) a été introduite en prod pour les
  sous-sections. Absente de la research. → à valider ou à remonter dans le NORTHSTAR.
- **`--green` (`#2c7a4c`)** existe dans les variables du NORTHSTAR mais pas dans ses
  swatches documentés. Usage indéfini → ne pas l'employer sans arbitrage.
- **Responsive des grilles** : à ≤880px toutes les grilles passent à 2 colonnes et n'en
  descendent jamais — comportement repris à l'identique de l'existant. Deux cartes côte à
  côte sur un écran de 380px sont étroites. → à trancher (passage à 1 colonne ≤480px ?).

### Décisions de juillet–août 2026 encore à porter en prod

Le miroir avait six semaines de retard ; ces décisions sont actées côté design et pas encore
dans le code (les trois premières le sont depuis le re-base) :

- [x] `--paper: #f6f5f1` / `--paper-2: #edebe4` (août 2026)
- [x] zéro arrondi — `.tag`/`.badge` sans radius
- [x] `.post` sans flèche au hover (le glissement de 14px reste)
- [x] marque **exhale** + domaine **exhale.blog**
- [x] **plate** = B6 : `src/components/print/Plate.astro` — cadre « grille empruntée »
      (traits `--rule-frame` dépassant de `--plate-overshoot`) + carreau ultra-léger, sur
      papier nu ; `surface="recessed"` pour le secondaire B4, `grid={false}` pour le cas C1.
      ⚠ Le cadre déborde de 13px : le conteneur doit lui laisser cette marge, donc une plate
      ne va pas dans une grille serrée.
- [x] **tile** = D2 : `CollCard` et `GearCard` — nu au repos → croix d'angle + bordure ink +
      fond `paper-2` au hover **et au `:focus-visible`**. En grille filet (`bordered={false}`)
      les croix rentrent (`--cross-out: 0`), sinon elles écriraient sur la cellule voisine.
      Le lift `translateY(-3px)` de `CollCard` est supprimé (cf. §5).
- [x] **callout** = E1 : `src/components/print/Callout.astro` — filet, 2 croix (tl+br), points
      estompés, étiquette mono qui casse le filet du haut. Aucune barre d'accent à gauche.
- [ ] **boutons** : hover = remplissage dither animé (reduced-motion safe)
- [ ] aucune ombre portée nulle part (à vérifier : `index.html` de research en avait une)
- [ ] **Primitive `Tile`** : le bloc D2 est dupliqué entre `CollCard` et `GearCard` (contre
      §4.7). La consolidation demande une primitive, pas seulement des tokens.
- [ ] `dither.js` accepte désormais `'var(--token)'` / `#hex` / `'r,g,b'`, **résolus à chaque
      rendu** → les cellules claires peuvent suivre `--paper` en direct. À exploiter dans
      notre portage TS.

---

## 6. Le protocole avec Claude Design

**Déplacé dans son propre document : [`PROTOCOL.md`](./PROTOCOL.md).**

C'est la référence partagée entre Claude Code et Claude Design — le partage des rôles
(qui décide quoi, ce qu'on peut légitimement demander à CD), la forme du miroir CSS et
ses deux conventions, le manifeste de périmètre, les quatre procédures (DOWN, brief UP,
`pnpm mirror:diff`, captures avant/après), les limites de l'outillage et le journal
daté des décisions de protocole.

Ce document-ci garde ce qui lui appartient : comment le CSS de CD devient du code Astro
maintenable — le tri, les règles dures, l'anatomie d'un composant, l'état de la migration.

## 7. Anatomie d'un composant

```
src/components/
  primitives/    Section · Wrap · Grid · Lede   (+ Stack, Prose, Bleed à venir)
  print/         RegMarks · Barcode · MonoLabel
  <marque>.astro Hero · PostRow · PhotoFrame · Tag · CollCard · Metabar…
```

Trois familles :

- **primitives** (`primitives/`) — aucune identité de marque, aucune couleur décidée. Ce
  sont elles qui absorbent le CSS de page.
- **mobilier print** (`print/`) — les objets qui existent parce qu'une feuille imprimée en
  a : repères, code-barre, labels tracés. Décoratifs au sens sémantique (`aria-hidden`),
  porteurs de sens de marque.
- **composants de marque** (racine) — composent les deux précédentes et portent le NORTHSTAR.

Une `preview.astro` (les pages `/ds/*`) sert à **juger un composant sur pièce** avant de
l'utiliser en page : variantes côte à côte, contraste mesurable, comportement au survol et au
focus. Elle vaut pour ça seul : ce n'est pas un artefact à pousser vers CD (§6).

---

## 8. État de la migration

- [x] UnoCSS retiré — chargé mais 0 classe utilisée. CSS pur scopé + tokens.
- [x] `tokens/{colors,type,space}.css` + `base.css` extraits, écarts tracés (§5).
- [x] `SectionHead` converti — pilote du pattern `data-*` (§4.5a).
- [x] Miroir exclu du lint (1025 → 35 erreurs, toutes dans `src/`).
- [x] Primitives `Section` · `Wrap` · `Grid` · `Lede`, print `RegMarks` · `Barcode` ·
      `MonoLabel`, et `Tag` (dédoublonné : il existait en deux copies identiques).
- [x] **`paper.css` supprimé** — plus aucune classe globale hors `base.css`.
- [x] `index.astro` : 54 lignes de CSS → 1 (`.posts`, un margin de composition).
- [x] `:global(.coll)` éliminé → `CollCard bordered={false}`.
- [x] `PostRow`, `CollCard`, `SiteFooter` passés aux tokens.
- [x] Re-base sur le sync du 2026-08-03 : tokens papier, zéro arrondi, flèche retirée,
      marque **exhale** + `exhale.blog`.
- [x] Passage aux tokens de `Hero`, `FeaturedEssay`, `PhotoFrame`, `Metabar`, `MainNav` :
      16 valeurs remplacées, **zéro changement de rendu** (vérifié dans le CSS émis). Les
      valeurs restées littérales portent un `TODO token:` et sont justifiées en §4.7.
- [x] Primitive `Stack` + **`/writing`**, l'index qui manquait. La home est passée à
      **zéro ligne de CSS** en même temps.
- [x] **`HeroPopColor`** — le cover d'article qui fait popper une couleur extraite de la photo.
      Moteur porté en TS (`src/lib/spot-hero.ts`), composant piloté par une **recipe** par
      image, preview à `/ds/hero-pop-color`. Contraste mesuré à 1440px et 390px : 7,47:1 et
      6,96:1.
- [ ] Sources photo : les covers ont besoin d'images **couleur** (`public/photos/source/`),
      pas des PNG dithérés. `castle-blue.jpg` pèse 2,5 Mo → prévoir des versions `-web`
      comme `bridge-red-web.jpg` (392 Ko).
- [x] **Route Article** (`/writing/[...slug]`) : `ArticleBar` (sticky, jauge en `scaleX`),
      `ArticleHead`, `StatRow`, `Prose`, `PullQuote`, `ArticlePlate`. **Zéro ligne de
      `<style>` dans la page.** Encre de page via `<BaseLayout ink="sepia">`.
- [x] P2/P3 de la critique Impeccable sur l'article :
      barre d'accent à gauche **supprimée** (deux filets à la place) · jauge en
      `transform: scaleX()` au lieu de `width` · hauteur de la barre **mesurée**
      (`--bar-h`, ResizeObserver) au lieu du `calc(-1 * (48px + 2px))` hardcodé ·
      cible tactile du retour portée à 45px.
- [ ] `PullQuote` n'est pas atteignable depuis un `.md` : les citations Markdown (`>`) sont
      stylées dans `Prose`. Pour l'invoquer, il faudrait passer les articles en `.mdoc` et
      déclarer un tag Markdoc.
- [ ] Portage de `dither.js` en TS — les plates du corps utilisent les PNG pré-cuits, ce qui
      suffit ; à faire si l'on veut qu'elles suivent `--paper` en direct.
- [ ] Les 30 erreurs de lint restantes (toutes antérieures à ce chantier).

---

## 9. La source de vérité est CD — inventaire des divergences

**Aujourd'hui, Claude Design fait foi.** Le code n'a pas le droit de trancher une question de
design : il l'implémente. Ce qui n'est pas dans CD n'est pas validé, même si c'est meilleur.

D'où la distinction à tenir :

| Décision de **design** | Décision de **code** |
|---|---|
| une couleur, une échelle de type, une forme, un espacement, une composition | une API de props, un mécanisme, une correction de performance ou d'accessibilité |
| → doit venir de CD, ou y remonter avant d'être considérée comme acquise | → n'a pas à passer par CD |

Exemple de la frontière : animer la jauge de lecture en `transform: scaleX()` au lieu de
`width` est une décision de **code** (le rendu est identique, seul le coût change). Ramener
trois crèmes à une seule est une décision de **design**, même si elle paraît évidente.

### Divergences ANNULÉES après vérification (2026-08-03)

En relisant le gold, trois de mes « normalisations » se sont révélées être des inventions :

| Ce que j'avais fait | Ce que CD dit | Action |
|---|---|---|
| `--fs-lead: clamp(20px,2.6vw,30px)`, présenté comme l'unification de deux doublons | `01_Home.html` a **deux** échelles réelles : `.lead-serif` `clamp(20px,2.4vw,28px)` et `.hero-intro` `clamp(19px,2.2vw,26px)` — et ma valeur ne correspondait à **aucune** | **annulé** : deux tokens (`--fs-lead`, `--fs-lead-intro`), `Lede` a un variant `size` |
| `--lh-lead: 1.33` | `1.32` | **annulé** |
| `--fs-shead-md` + variante `size="md"` de `SectionHead` | **zéro occurrence** dans tout CD, et la variante n'était utilisée nulle part | **supprimé** (invention + code mort) |

### Divergences MAINTENUES — à arbitrer avec Pierrick

Elles restent en place parce que les annuler dégraderait la cohérence, mais **elles ne sont
pas validées** : elles doivent soit être approuvées, soit remonter dans CD, soit être annulées.

| Divergence | Ce que CD dit | Pourquoi c'est maintenu |
|---|---|---|
| Une seule encre crème sur photo (`--cover-ink-light`) | `01_Home.html` porte **trois** crèmes (`#f0e9d8`, `#f3ecdb`, `#f1ead8`) et `02_Article.html` une quatrième (`#ece6d8`) — cinq avec le `#f4efe3` du banc | Restaurer cinq crèmes pour « du texte crème sur photo » réintroduirait cinq vérités. Écart max 11/255, invisible. |
| Mesure de lecture = 66ch de **texte** (`calc(66ch + 2*gutter)`) | `max-width: 66ch` + `padding: … var(--gutter)` en `box-sizing: border-box`, soit ~52ch de texte sur desktop | Le NORTHSTAR documente « measure 66ch » comme mesure de **lecture** ; l'implémentation du gold la contredit. |
| Forme du `PullQuote` : deux filets | `Design Notes.md` interdit la barre d'accent à gauche mais **ne dit pas** par quoi la remplacer ; le gold porte encore la barre | Il fallait bien une forme. Deux filets = citation détachée de typographie de presse. |
| `/writing`, `Prose` (listes, code, `hr`, `blockquote`), l'échelle `--space-*` | rien | Aucune spec n'existe. Reprend le registre du gold sans l'étendre. |

### La conséquence

Tant que CD est la source, **ces divergences sont une dette**, pas des acquis. La sortie est
simple : **Pierrick les tranche**, et ce qui est validé remonte dans CD (banc ou gold), par une
décision de design — pas par un script.

Le tableau ci-dessus **est** l'outil. Six lignes qui disent où le code s'est écarté et pourquoi.
J'ai d'abord cru qu'il fallait un système bidirectionnel pour rendre ces écarts visibles ; c'est
faux, et §6 raconte ce que ça a coûté. La seule chose qui empêche la dérive, c'est de ne pas
décider de design côté code — et quand ça arrive quand même, de l'écrire ici.

---

## 10. Piège d'outillage — vérifier une conversion

`pkill -f "astro dev"` **ne matche pas** le process lancé par `npm run dev` (la commande
réelle est `node …/.pnpm/astro@…/astro.js dev`). Conséquence vécue pendant cette migration :
`astro preview` échoue silencieusement sur port occupé, le dev server répond à sa place, et
Vite sert du **HTML neuf avec des styles périmés**. On croit alors à une régression du
composant — ici, `CollCard bordered={false}` semblait ne pas s'appliquer alors que le CSS de
production était juste.

**Donc** : vérifier une conversion sur `astro preview`, sur un **port dédié**
(`--port 4399`), et confirmer par les règles CSS réellement chargées
(`document.styleSheets`) plutôt qu'à l'œil sur une capture.
