# PIPELINE — de la research Claude Design au design system en prod

> **Ce document est la doctrine CODE.** La doctrine DESIGN est dans
> `claude-design/Pierrick Blog/dot·paper - NORTHSTAR.html` (north star, couleur, type,
> anatomie de page, guardrails). Le NORTHSTAR dit **quoi**, ce document dit **comment ça
> devient du code maintenable**.

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
┌─ Claude Design : « Pierrick Blog » ─┐        research, exploration, art direction
│  HTML/CSS autonome, jetable         │        ── JAMAIS édité depuis le repo ──
└──────────────┬──────────────────────┘
               │ DOWN — zip via MCP Playwright (cf. CLAUDE.md § Sync)
               ▼
    design/claude-design/Pierrick Blog/        MIROIR pur, read-only, écrasé à chaque sync
               │
               │ TRI  (§3) — la seule étape qui demande du jugement
               ▼
    src/styles/tokens/*.css   ·   src/components/**   ·   src/lib/**
               │
               │ UP — DesignSync (§6)
               ▼
┌─ Claude Design : « dot·paper » (type Design System) ─┐   le DS que Claude Design consomme
│  tokens/*.css · *.card.html · *.d.ts · SKILL.md      │   pour ses prochaines explorations
└──────────────────────────────────────────────────────┘
```

**Asymétrie volontaire** : on lit la research, on n'y écrit jamais. On écrit dans le projet
Design System, qui ne contient pas de research. Aucune collision possible, donc rien à
écraser.

> **Contrainte de plateforme** : le type d'un projet Claude Design est **immuable à la
> création**. « Pierrick Blog » est un `PROJECT_TYPE_PROJECT`, donc `DesignSync` **ne peut
> pas** y écrire — et un duplicata resterait du même type. Le projet Design System doit
> être **créé** comme tel (`DesignSync create_project`), puis la research y est **copiée**
> depuis le miroir local.

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

### 4.7 Une valeur de style n'apparaît qu'une fois

Si un composant a besoin d'une échelle absente de `tokens/`, on **ajoute le token**. On
n'écrit pas la valeur en dur « juste ici ». Le corollaire : deux valeurs proches
(`clamp(20px,2.4vw,28px)` et `clamp(21px,2.7vw,31px)`) sont un bug de design, pas deux
tokens.

---

## 5. Conflits de sources : l'ordre de préséance

`CLAUDE.md` fixe : **NORTHSTAR > `assets/paper.css` > `Design Notes.md`**. En pratique :

- **la doctrine** (quelle encre, quelle règle, quelle anatomie) → NORTHSTAR, toujours ;
- **les valeurs** → NORTHSTAR d'abord, car il **importe** `assets/paper.css` puis l'override
  dans son propre `<style>` : ses valeurs sont les plus récentes ;
- un **narratif périmé** ne fait jamais foi contre les tokens (`Design Notes.md` dit encore
  « blue accent » — mort depuis l'olive).

### Écarts assumés en prod — la liste exhaustive

Tout écart entre `src/styles/tokens/` et le NORTHSTAR est listé **ici** et commenté dans le
fichier de token. Une divergence non listée est un bug.

| Token | NORTHSTAR | Prod | Pourquoi |
|---|---|---|---|
| `--ink-3` | `#8B8672` | `#696551` | `#8B8672` ≈ 2.9:1 sur `--paper` → échoue WCAG AA, or son usage est le mobilier print en 9–11px. Valeur reprise d'`assets/paper.css`. Reste la teinte la plus claire du ramp. |
| `--maxw` | `1080px` | `1180px` | Le 1080 du NORTHSTAR est un override de mise en page **du specimen** (un document à lire), pas une largeur de marque. `assets/paper.css` — la base partagée des pages — dit 1180. |

### Normalisations sur l'échelle — valeurs absorbées

Une valeur hors échelle est ramenée au pas le plus proche : l'échelle n'a d'intérêt que si
elle est respectée. Les écarts sont invisibles à l'œil, mais listés pour être contestables.

| Endroit | Avant | Après | Note |
|---|---|---|---|
| `Lede` | `clamp(20px,2.4vw,28px)` **et** `clamp(21px,2.7vw,31px)` | `--fs-lead: clamp(20px,2.6vw,30px)` | Deux valeurs pour une intention = un bug de design. Ce qui varie est la **mesure** (30ch / 24ch), pas la taille. |
| `SectionHead` | `margin-bottom: 18px` | `--space-md` (16px) | 18 est absent de l'échelle (…10, 16, 22…). |
| `Grid` | `gap: 12px` (photos) **et** `14px` (gear) | `--gap-grid: 12px` | Même intention, deux valeurs. |

### Arbitrages ouverts

- **`--fs-shead-md`** (`clamp(21px,3vw,32px)`) a été introduite en prod pour les
  sous-sections. Absente de la research. → à valider ou à remonter dans le NORTHSTAR.
- **`--green` (`#2c7a4c`)** existe dans les variables du NORTHSTAR mais pas dans ses
  swatches documentés. Usage indéfini → ne pas l'employer sans arbitrage.
- **Responsive des grilles** : à ≤880px toutes les grilles passent à 2 colonnes et n'en
  descendent jamais — comportement repris à l'identique de l'existant. Deux cartes côte à
  côte sur un écran de 380px sont étroites. → à trancher (passage à 1 colonne ≤480px ?).

---

## 6. Les deux procédures de sync

### DOWN — research → miroir

Inchangée, décrite dans `CLAUDE.md § Sync depuis Claude Design`. En bref : `browser_navigate`
sur l'URL REST de download via le **MCP Playwright** (seul navigateur passé Cloudflare),
puis `ditto` + `rsync -a --delete` vers le miroir. Le miroir est **pur** : rien ne s'y édite
à la main.

### UP — design system → Claude Design

Cible : le projet Claude Design **de type Design System**. Format calqué sur
`Muskle Design System`, qui est le pattern que Claude Design sait consommer :

```
SKILL.md                       ← frontmatter name/description + les règles de marque
README.md                      ← le guide design (dérivé du NORTHSTAR)
tokens/{colors,type,space}.css ← POUSSÉS TELS QUELS depuis src/styles/tokens/
styles.css                     ← point d'entrée qui importe les tokens
guidelines/*.card.html         ← specimens : couleur, type, mobilier print
components/<name>.card.html    ← preview du composant, générée par le build Astro
components/<name>.d.ts         ← le contrat d'API, extrait des `interface Props`
components/<name>.prompt.md    ← quand et comment l'utiliser
explorations/                  ← la research recopiée depuis le miroir
```

Trois principes :

1. **Les tokens sont le même artefact des deux côtés.** `src/styles/tokens/*.css` est du CSS
   pur avec des custom properties : on le pousse **sans transformation**. Pas de génération,
   donc pas de dérive possible. C'est la raison technique qui justifie le CSS pur plutôt
   qu'un moteur de style avec son propre thème.
2. **On ne pousse jamais une seconde implémentation.** Nos composants sont `.astro`, que
   Claude Design ne peut pas exécuter — mais un JSX miroir serait un deuxième code à
   maintenir, donc une dérive garantie. On pousse le **contrat** (`.d.ts` + `.prompt.md`) et
   une **preview HTML rendue par le vrai composant**. Fidèle par construction.
3. **`SKILL.md` remplace le prompt à recopier.** Le projet porte un skill invocable : Claude
   Design lit la doctrine tout seul, à chaque session. Il est **généré** depuis ce document
   et le NORTHSTAR, jamais écrit à la main en parallèle — sinon on recrée le problème.

Ordre imposé par l'outil : `list_files` → `finalize_plan` → `write_files`. Les previews
montent par `localPath` (le contenu ne transite pas par le contexte du modèle).

---

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

**`.prompt.md` et `preview.astro` sont exigés au moment du push UP (§6), pas à la création** :
ils décrivent le contrat pour Claude Design. Les créer vides à l'avance n'apporte rien.

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
- [ ] Reste aux tokens : `Hero`, `FeaturedEssay`, `GearCard`, `PhotoFrame`, `Metabar`,
      `MainNav` (valeurs encore en dur).
- [ ] Primitive `Stack` — dès qu'un deuxième cas type `.posts` apparaît.
- [ ] `Hero` polymorphe (home `clip-text` + article `plate`), art direction par image.
- [ ] Route Article + les P2/P3 de la critique Impeccable.
- [ ] Build `ds:build` (previews + `.d.ts` + `SKILL.md`) puis projet Design System.
- [ ] Les 35 erreurs de lint restantes.

---

## 9. Piège d'outillage — vérifier une conversion

`pkill -f "astro dev"` **ne matche pas** le process lancé par `npm run dev` (la commande
réelle est `node …/.pnpm/astro@…/astro.js dev`). Conséquence vécue pendant cette migration :
`astro preview` échoue silencieusement sur port occupé, le dev server répond à sa place, et
Vite sert du **HTML neuf avec des styles périmés**. On croit alors à une régression du
composant — ici, `CollCard bordered={false}` semblait ne pas s'appliquer alors que le CSS de
production était juste.

**Donc** : vérifier une conversion sur `astro preview`, sur un **port dédié**
(`--port 4399`), et confirmer par les règles CSS réellement chargées
(`document.styleSheets`) plutôt qu'à l'œil sur une capture.
