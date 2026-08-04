# Protocole Claude Code ↔ Claude Design

> Le contrat d'interface entre les deux outils qui travaillent sur **exhale**.
> Ce document dit **qui décide quoi**, **par où ça passe** et **comment on vérifie**.
>
> Il ne contient ni valeur de design ni règle de style : les valeurs sont dans
> `claude-design/Pierrick Blog/assets/paper.css`, la doctrine dans `0_NORTHSTAR.html`,
> et la façon dont le CSS devient du code Astro dans `PIPELINE.md`.
>
> Dernière révision : **3 août 2026**.

---

## 1. Les deux côtés

| | Claude Design (CD) | Claude Code (CC) |
| --- | --- | --- |
| Où | `claude.ai/design`, projet `Pierrick Blog` | ce dépôt |
| Produit | des pages HTML/CSS autonomes | un site Astro 6 + Svelte 5 |
| Rôle | **décide du design** | **implémente**, et vérifie |
| Miroir local | `design/claude-design/Pierrick Blog/` — 100 % distant, **ne rien y éditer à la main** | `src/` |

**La source de vérité du design est CD.** Quand une décision de design n'existe pas
côté CD, elle n'a pas été prise : on la demande, on ne l'invente pas.

### Ce que CC peut demander à CD

| Demande | Légitime ? | Pourquoi |
| --- | --- | --- |
| Ranger, découper, déplacer à valeur constante | ✅ | Ce n'est pas une décision de design |
| Changer un **mécanisme** (comment une valeur arrive dans le DOM) | ✅ | De la plomberie, à condition que le rendu ne bouge pas |
| Signaler une contradiction interne à CD | ✅ | CD tranche |
| Choisir une couleur, une taille, un espacement, une forme | ❌ | C'est son métier, pas le nôtre |
| Unifier deux valeurs proches « parce que ça ferait plus propre » | ❌ | C'est une décision de design déguisée |

Cette frontière a une histoire : le code avait pris des décisions de design (trois
crèmes unifiées, une mesure de lecture réinterprétée, un `--fs-lead` inventé), et le
réflexe a été de construire un outillage pour les rendre traçables. C'était le mauvais
remède. Le bon est cette frontière.

---

## 2. La forme du miroir

CD ne portera jamais de composants Astro. Mais les deux côtés portent **le même
découpage** : un fichier CSS par composant, au même nom.

```
CD                                          CC
──────────────────────────────────────      ────────────────────────────────────
assets/paper.css                            src/styles/tokens/{colors,type,space}.css
  reset · :root · surface papier            src/styles/base.css
  focus · print · reduced-motion              (custom properties d'un côté,
  + la liste des @import                       reset et surface de l'autre)

assets/components/PostRow.css               src/components/PostRow.astro
assets/components/Plate.css                 src/components/print/Plate.astro
assets/components/HeroPopColor.css          src/components/hero/HeroPopColor.astro
…29 fichiers                                …le <style> scopé du composant
```

Les pages gold (`01_Home.html`, `02_Article.html`) ne contiennent **aucun bloc
`<style>`** et gardent un seul `<link>` vers `paper.css`.

### Les deux conventions qui font tenir le miroir

1. **Le fichier CD porte le nom du composant Astro**, à l'identique.
2. **Les variantes s'écrivent en `data-*` des deux côtés** — `.tag[data-accent='on']`,
   jamais `.tag-accent`. C'est ce qui rend les sélecteurs comparables.

Elles sont inscrites côté CD dans `0_NORTHSTAR.html` §11 « Component conventions
(Aug 2026) », pour survivre à la prochaine session.

### Ce qui doit rester hors du CSS

| Cas | Où | Pourquoi |
| --- | --- | --- |
| `--grain` (data-URI) | inline sur `<html>`, posé par `texture.js` | généré au runtime, ce n'est pas de l'état de design |
| encre de page (`--accent`, `--topo`) | `:root[data-ink='olive'\|'sepia']` dans une feuille | **jamais inline** : un `style` sur un élément est invisible au diff, et ce serait la seule valeur distinguant un article de la home |

---

## 3. Le manifeste — qui possède quoi

`design/mirror/manifest.json` déclare le périmètre. Sans ce tri, le diff signale des
centaines de divergences dont l'essentiel n'a jamais eu à converger.

| scope | sens | état au 3 août 2026 |
| --- | --- | --- |
| `mirrored` | existe des deux côtés, **doit converger** ; tout écart est un signal | 25 |
| `ours-only` | n'existe que côté code, CD n'a rien à en dire | 3 — `Section`, `Stack`, `Grid` (plomberie de layout) |
| `cd-only` | CD l'a spécifié, on ne l'a pas porté : **dette, pas écart** | 4 — `Tile`, `Button`, `Rule`, `ImageSlot` |

Le manifeste porte aussi `ignoreSelectors`, pour ce qui est mort d'un côté et vivant de
l'autre : `.frame-marks` a été retiré du gold en juillet 2026 mais reste côté CD parce
que `research/02 Topographic` l'utilise encore. Ni porté, ni signalé.

---

## 4. Les quatre procédures

### 4.1 DOWN — rapatrier le travail de CD

Piloté par le **MCP Playwright**, seul navigateur passé Cloudflare (Pierrick y est
connecté à la main ; un `curl` avec cookies échoue, `cf_clearance` est lié à l'empreinte
TLS du navigateur).

```sh
# 1. navigateur MCP → URL REST de download (≈1 appel, pas de danse UI)
#    https://claude.ai/design/v1/design/projects/<id>/download
# 2. miroir pur — ditto gère l'UTF-8 des noms accentués que unzip casse sur macOS
STAGE="$(mktemp -d)"
ditto -x -k ".playwright-mcp/Pierrick-Blog.zip" "$STAGE"
rsync -a --delete "$STAGE/" "design/claude-design/Pierrick Blog/"
rm -rf "$STAGE" .playwright-mcp/Pierrick-Blog.zip
```

`--delete` purge ce qui a disparu côté distant. Les dossiers hors miroir
(`design/briefs/`, `design/mirror/`, `design/impeccable/`) ne sont pas touchés.

> **Lire un seul fichier distant ne demande pas de sync** : l'outil `DesignSync`
> (`list_files`, `get_file`) lit le projet à l'unité sans navigateur ni Cloudflare.
> Il ne peut pas **écrire** ici : `Pierrick Blog` est un `PROJECT_TYPE_PROJECT`, et
> seuls les `PROJECT_TYPE_DESIGN_SYSTEM` sont writable (type immuable à la création).

### 4.2 UP — demander quelque chose à CD

Un **brief en prose**, jamais un bundle de fichiers poussé.

1. L'écrire dans `design/briefs/<date>-<sujet>.md`. Le dossier est hors miroir, donc
   `rsync --delete` ne l'efface pas : c'est le journal daté de ce qu'on a demandé.
2. Le faire parvenir à CD — uploadé par Pierrick, ou tapé par CC dans le composer via
   le MCP Playwright.
3. CD exécute, et tranche ce qui est de son ressort.
4. **DOWN, puis vérifier.** Jamais sur parole.

Un bon brief : une règle dure en tête (« ne change aucune valeur »), les arbitrages déjà
faits pour ce qui est mécanique, et **les seules vraies questions de design isolées** —
avec « on reflétera ta décision, on n'en inventera pas ».

> **Pièges du composer via Playwright** : utiliser `keyboard.insertText`, jamais `type`
> — chaque `\n` déclencherait l'envoi et le message partirait en morceaux. Et `require`
> n'existe pas dans le sandbox `run_code_unsafe` : passer le texte en littéral.

### 4.3 Vérifier le CSS — `pnpm mirror:diff`

```sh
pnpm mirror:diff          # composant par composant, selon le manifeste
# ou, pour contrôler un sync : deux ensembles arbitraires
node design/mirror/css-diff.mjs <avant...> -- <après...>
```

Compare **par déclaration, pas par texte** — sinon rien ne correspondrait jamais. Il
neutralise `[data-astro-cid-*]`, éclate les sélecteurs de groupe, indexe par contexte
`@media`, uniformise guillemets et espaces dans les parenthèses. Et surtout il **résout
les `var()` de chaque côté avec ses propres tokens** : `var(--fs-tag)` contre `10px`
n'est pas un écart si le token vaut 10px — ces cas sont comptés comme « équivalents »
(47 au 3 août).

Le mode deux-ensembles détecte en plus les **duplications inter-fichiers** : une même
règle définie dans deux fichiers du même côté, dont une gagne silencieusement par
cascade. C'est ce qui avait motivé le découpage (9 duplications trouvées, 4 de plus que
le repérage à la main).

### 4.4 Vérifier le rendu — captures avant/après

Les captures sont **jetables** et vont **exclusivement dans `.screenshots/`**
(gitignored), jamais ailleurs dans l'arbre.

```sh
# servir les deux versions, masquer les textures aléatoires, comparer
magick compare -metric AE avant.png après.png diff.png
```

Masquer `.grain-layer`, `.topo-layer` et `.vignette` avant de capturer, et **toujours
mesurer le plancher de bruit** : rendre deux fois la *même* page suffit.

---

## 5. Les limites de l'outillage — à connaître avant de croire un rapport

| Limite | Conséquence |
| --- | --- |
| **Le CSS inline est invisible** | Un `style` sur un élément échappe au diff. D'où l'encre de page en `:root[data-ink]`. |
| **`calc()` n'est pas évalué** | `calc(-1 * 9px)` et `-9px` sont signalés comme différents. |
| **Le dither n'est pas reproductible** | `dither.js` et le grain de `texture.js` (`Math.random`) : deux rendus de la même page d'article diffèrent de **16,6 %**. C'est le plancher, pas une régression. |
| **Le NORTHSTAR ne fait pas foi sur ses valeurs** | Ce sont celles de son specimen (`--maxw: 1080px` le trahit). Les valeurs sont dans `paper.css` + le `:root` des pages gold. |

---

## 6. Préséance en cas de conflit

1. **`Design Notes.md`** pour les décisions **datées** — c'est le journal de CD.
2. **`assets/paper.css`** + `assets/components/*.css` pour les **valeurs**.
3. **`0_NORTHSTAR.html`** pour la **doctrine** (règles, anatomie, guardrails), jamais
   pour ses hex.
4. Le reste de `Design Notes.md` (références d'inspiration) en dernier.

Un narratif périmé ne fait jamais foi contre les valeurs. **Lire les dates.**

---

## 7. Journal des décisions de protocole

| Date | Décision |
| --- | --- |
| 2026-08-03 | **Miroir CSS par composant** — 29 fichiers dans `assets/components/`, zéro `<style>` de page, `paper.css` réduit à la fondation + les `@import` (les 29 résolvent). Vérifié : 1010 → 1011 déclarations, donc rien perdu ; duplications 9 → 0. Brief : `briefs/2026-08-03-css-per-component.md`. |
| 2026-08-03 | **Variantes en `data-*`** des deux côtés. `.plate.plain/.recessed`, `.btn.accent/.invert`, `.regmark.tl…br` restent en classes pour l'instant (specimens du NORTHSTAR et archives en dépendent) — passe ultérieure, notée NORTHSTAR §11. |
| 2026-08-03 | **`.frame` est une variante**, pas deux composants : `.frame[data-dither='on']`, ratio par `.figure[data-width='wide']`. Décision CD. |
| 2026-08-03 | **Encre de page en `:root[data-ink]`**, plus d'inline sur `<html>`. `--post-hero-h` devient le défaut de `HeroPopColor.css`. Brief : `briefs/2026-08-03-page-ink-mechanism.md`. |
| 2026-08-03 | **Le bloc `@media print` est partagé** dans `paper.css`. L'article est inchangé au caractère près ; la home n'avait aucune règle print et gagne un rendu propre. L'écran n'est pas touché. |
| 2026-08-03 | **Pas de flux UP par bundle.** Un projet Design System avait été créé pour y pousser tokens et contrats `.d.ts` : illisible dans un outil de design, supprimé le jour même. Le NORTHSTAR fait ce travail mieux. |
| 2026-08-03 | Le chevauchement RESPIRE / lede sur la home est **délibéré** (lede à `z-index: 0`, les lettres du type photo-clippé passent devant). Reflété tel quel. |

---

## 8. Écarts ouverts au 3 août 2026

`pnpm mirror:diff` : **2 alignés · 24 en écart · 4 de dette · 3 hors périmètre.**

Chaque écart se tranche en répondant à une seule question : **est-ce notre dérive, ou
une décision de CD ?** Les deux premiers cas illustrent les deux sens.

- **Notre dérive** — `Callout` : CD porte `--cell: 24px` (pas des points calé sur la
  hauteur de ligne, conforme à la spec E1) là où nous avons `--dot-step: 16px`, avec un
  padding de 24 contre 18. Notre trame est plus serrée que la spec. À corriger côté code.
- **Sa dérive** — `PullQuote` : CD écrit `border-left: 3px solid var(--accent)` alors que
  sa propre doctrine de juillet 2026 interdit la barre d'accent à gauche. Notre
  implémentation est conforme, la sienne contredit son journal. À lui de trancher.
