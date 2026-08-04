# Protocole Claude Code ↔ Claude Design

> Le contrat d'interface entre les deux outils qui travaillent sur **exhale**.
> Ce document dit **qui décide quoi**, **par où ça passe** et **comment on vérifie**.
>
> Il ne contient ni valeur de design ni règle de style : les valeurs sont dans
> `claude-design/Pierrick Blog/assets/paper.css`, la doctrine dans `0_NORTHSTAR.html`,
> et la façon dont le CSS devient du code Astro dans `PIPELINE.md`.
>
> Dernière révision : **4 août 2026** — ajout de la **gate humaine** (§1.1).

---

## 1. Les deux côtés

| | Claude Design (CD) | Claude Code (CC) |
| --- | --- | --- |
| Où | `claude.ai/design`, projet `Pierrick Blog` | ce dépôt |
| Produit | des pages HTML/CSS autonomes | un site Astro 6 + Svelte 5 |
| Rôle | **propose le design** | **implémente**, et vérifie |
| Miroir local | `design/claude-design/Pierrick Blog/` — 100 % distant, **ne rien y éditer à la main** | `src/` |

**Le décideur est Pierrick.** CD est la source de vérité du design *proposé* : quand une
décision n'existe pas côté CD, elle n'a pas été prise, et on la demande au lieu de
l'inventer. Mais proposer n'est pas trancher — voir §1.1, qui est la règle la plus
importante de ce document.

### 1.1 La gate humaine — décidée le 2026-08-04

Il y a **deux modes de travail**, et la gate ne concerne que le second.

#### Mode A — Pierrick et CC ont la main

Pierrick demande un changement de design à CC, ou l'a fait lui-même à la main. **La décision
est prise, elle est la sienne.** CC implémente sans rien demander à CD. Le seul travail qui
reste est de **back-porter proprement** vers CD, pour qu'il ne parte pas d'un gold périmé
(procédure §4.2).

#### Mode B — CC et CD en boucle

Quand CC et CD travaillent en autonomie et s'échangent des briefs, alors dès que **CD veut
changer quelque chose de visible** :

1. **CC s'arrête et appelle Pierrick** — « CD veut faire tel changement, il t'attend ».
2. **Pierrick en discute directement avec CD.** Ce n'est pas CC qui relaie ni qui arbitre :
   Pierrick entre dans la boucle avec CD, CD lui propose des solutions, ils tranchent
   ensemble.
3. **Une fois validé, la boucle CC ↔ CD reprend.**

Ce que CC ne fait pas : porter dans `src/` un changement visible que Pierrick n'a pas vu,
ni jouer les intermédiaires sur une question de design. Ce que CC fait : **le signaler tôt**,
et fournir la mesure quand elle éclaire le choix — styles calculés, avant/après, breakpoints,
captures. On a Playwright, c'est notre moitié du travail.

#### CD teste sur une page de research, pas sur le gold

**La règle la plus utile en pratique.** CD n'a pas de diff : quand il modifie `01_Home.html`
ou un fichier de `assets/components/`, personne ne voit ce qu'il a touché en passant, et ses
effets de bord sont invisibles jusqu'au prochain DOWN.

Donc : **une proposition se démontre sur une nouvelle page dans `research/`**, pas en
éditant le gold. Une page de démo isolée est vérifiable et ne casse rien ; une retouche du
gold est un acte de foi. « A validated result graduates to root » — le gold n'est pas le
brouillon, c'est l'arrivée.

#### Ce qui ne demande l'accord de personne

Parce que ce ne sont pas des décisions de design : le rangement à valeur constante, un
changement de mécanisme dont on a **mesuré** que le rendu ne bouge pas, le retour d'une de
nos valeurs vers une valeur **déjà validée** du gold (on ne décide rien, on cesse de
dévier), et les corrections de bug.

> En cas de doute, ça ne passe pas : si on hésite à classer un changement en « mécanique »,
> il ne l'est pas.

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

Les pages gold (`01_Home.html`, `02_Article.html`) ne contiennent **aucun bloc `<style>`**
et ne chargent qu'**une seule feuille de style locale**, `paper.css`. Elles ont par ailleurs
un `<link>` vers les fontes Google et des `<script>` vers `assets/*.js` : c'est normal et
hors sujet ici.

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
3. CD exécute ce qui est mécanique, et **démontre sur une page de `research/`** ce qui est du
   design — jamais en éditant le gold (§1.1).
4. **DOWN, puis vérifier.** Jamais sur parole.
5. **Gate.** Dès qu'il y a une proposition de design, **CC s'arrête et appelle Pierrick**,
   qui en discute directement avec CD. Le mécanique passe sans s'arrêter.

Un bon brief : une règle dure en tête (« ne change aucune valeur »), les arbitrages déjà
faits pour ce qui est mécanique, et **les seules vraies questions de design isolées**. Il
sépare visiblement les deux, pour que CD sache où il avance seul et où il s'arrête — et il
demande une **démo dans `research/`** pour tout ce qui relève du design, pas une retouche du
gold.

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
| 2026-08-04 | **Échelle d'espacement partagée.** CD arbitre : 14px et 18px promus en demi-pas `--space-sm` / `--space-ml` plutôt qu'arrondis (15 usages à eux deux), 6px reste littéral optique, 10→12, 22→24, 28→24, 30→32. Règle reduced-motion globale adoptée, règles d'impression déplacées dans les composants. Brief : `briefs/2026-08-04-echelle-espacement.md`. |
| 2026-08-04 | **`--cell` est un interligne, pas un pas d'espacement.** Le carreau de la plate B6 et la trame du callout E1 en dérivent (mineure = un cell, majeure = quatre, padding = un cell) et les blocs de texte reçoivent `line-height: var(--cell)` — c'est ce qui fait tomber les lignes SUR la trame. On l'avait scindé en trois tokens sans lier l'interligne : la trame était devenue décorative. |
| 2026-08-04 | **Encres de photo : trois rôles.** CD tranche « accumulation, not intention » — les cinq nuances claires du gold étaient accidentelles. `--cover-ink-light: #f1ebdd`, `--cover-ink-quiet: #cfc9bb`, `--cover-ink-dark: #14110a` ; la cue est la claire à 70 % en `color-mix`, pas une quatrième encre. Nos anciennes valeurs venaient de `research/` : faute de méthode, la research ne fait jamais foi. |
| 2026-08-04 | **Une boîte dans la prose ne coupe pas la colonne.** `Callout` et `Plate` vivent DANS `.prose`, à largeur de colonne, au rythme de la citation (2.2em) ; seule la `.figure` en débord mérite `data-flow="continued"`. La marge contextuelle vit dans la boîte (`.prose .callout` dans `Callout.css`), pas dans `Prose`. |
| 2026-08-04 | **Les règles de bloc de `Prose` ciblent les enfants directs** (`> p`, `> h2`…). En descendant, elles écrasaient la typographie des boîtes imbriquées : le `<p>` d'un callout sortait à 16,5px/25,575px au lieu de 14,5px/24px, donc hors trame. Corollaire : le `<article>` que Markdoc pose autour du document est retiré (`document: { ...nodes.document, render: null }`), sinon plus rien n'est enfant direct. |
| 2026-08-04 | **Gate humaine (§1.1), deux modes.** **Mode A** — Pierrick et CC ont la main : la décision est celle de Pierrick, CC implémente, et le seul travail restant est de back-porter vers CD. **Mode B** — CC et CD en boucle : dès que CD veut changer quelque chose de visible, **CC s'arrête et appelle Pierrick**, qui en discute *directement* avec CD ; la boucle reprend après validation. CC ne relaie pas et n'arbitre pas une question de design. |
| 2026-08-04 | **CD démontre dans `research/`, jamais sur le gold.** La règle la plus utile en pratique : CD n'a pas de diff, donc une retouche de `01_Home.html` ou d'un `assets/components/*.css` rend ses effets de bord invisibles jusqu'au prochain DOWN. Une page de démo isolée est vérifiable ; une retouche du gold est un acte de foi. Corollaire de « a validated result graduates to root » : le gold est l'arrivée, pas le brouillon. |
| 2026-08-04 | **La mesure est du côté de CC.** CD n'a qu'un vérificateur d'arrière-plan dont il ne voit le détail qu'en cas de problème : lui réclamer un relevé par breakpoint le pousserait à décrire ce qu'il n'observe pas. C'est donc à CC de mesurer avec Playwright — styles calculés, avant/après, breakpoints, captures — quand la mesure éclaire un choix. |

---

## 8. État au 4 août 2026

`pnpm mirror:diff` : **2 alignés · 24 en écart · 4 de dette · 3 hors périmètre** — mais le
compteur de sélecteurs trompe, et le bilan détaillé est dans `mirror/BILAN.md`. Les
**désaccords de valeur** sont le chiffre utile : passés de 41 à 12, et les 12 restants sont
tous de la notation, du paramètre de recipe art-directée, ou un `!important` vestigial.
**Aucune dérive inexpliquée, aucune question ouverte.**

### ✅ Validé par Pierrick le 2026-08-04

La gate (§1.1) a été décidée **après** les arbitrages du 4 août, qui sont donc entrés dans
`src/` sans la passer. Présentés rétroactivement, **les cinq sont validés** :

| Décision | Commit | Effet visible |
|---|---|---|
| Échelle : snaps 10→12, 22→24, 28→24, 30→32 | `57935ef` | padding de h2 et de citation, marge de titre, pied, espace sous en-tête |
| `--cell` : trame 16→24px, majeure 64→96px, interlignes liés | `6e0fa58` | plate B6 et callout E1 nettement plus aérés |
| Valeurs alignées sur le gold (HeroPopColor, PullQuote, CollCard, type) | `6e0fa58` | 20 valeurs, écarts de 1 à 20px |
| Encres de photo : cinq nuances → trois rôles | `0d3a0bb` | type sur cover et sur hero |
| RegMarks `fixed` → `absolute` | `0d3a0bb` | les repères défilent avec la feuille au lieu de rester à l'écran |

Ce qui **n'avait pas besoin** de la gate, pour mémoire : le renommage de l'échelle à valeur
constante (mesuré neutre sur 476 éléments), les règles d'impression portées, le lint, le
`markdoc.config.mjs`, la correction du sélecteur descendant de `Prose` — un bug — et le
retrait du `<article>` de Markdoc, qui rétablit une structure et n'ajoute aucun style.

### À passer sous la gate au moment du portage

CD a signalé ces deux animations de lui-même en souscrivant au §1.1 — exactement le
comportement attendu. Les deux répondent à une demande de Pierrick (« une animation de
dithering sympa »), mais leurs **paramètres sont le choix de CD et n'ont été regardés qu'en
desktop**. Aucune n'est dans `src/`, donc rien n'est en jeu tant qu'on ne les porte pas.

| Où | Paramètres | État |
| --- | --- | --- |
| **`Button`** — hover « boil » | 4 étapes, `0.42s`, `steps(1, end)`, trame `background-size: 4px 4px` | `cd-only` au manifeste, jamais porté |
| **`ArticleBar`** — barre index qui se résout en dither | `bar-dither-in` / `bar-dither-out`, `0.42s steps(1, end)`, 4 étapes, `mask-size: 5px 5px` | dans le gold (`01_Home`), variante `[data-context='index']` absente de `src/` |

> **Leçon de méthode, notée parce qu'elle a failli coûter cher.** J'ai d'abord cru que CD
> décrivait une animation inexistante : mon miroir ne contenait qu'une seule `@keyframes` et
> aucun `mask-size`. C'était vrai de **ma copie**, périmée d'une heure, et faux du projet.
> Un DOWN frais avant de le contredire a évité une accusation infondée. **Ne jamais opposer
> le miroir à CD sans l'avoir resynchronisé** — c'est déjà la règle §4.1 « jamais sur
> parole », qui vaut dans les deux sens.

**Bug d'accessibilité à trancher, signalé à CD le 2026-08-04.** La barre index porte
`aria-hidden="true"` **en dur dans le markup**, et le JS ne bascule que des classes. Quand
elle est visible (`.is-on`, `pointer-events: auto`), elle contient six liens de navigation
focalisables à l'intérieur d'un conteneur masqué aux technologies d'assistance : du contenu
focalisable dans un `aria-hidden` est une violation, et la navigation devient inatteignable
au clavier comme au lecteur d'écran. À ne pas porter tel quel.

### Le diff sait aussi trouver les contradictions de CD

Premier aller-retour où l'outil a pris CD contre lui-même : `PullQuote` portait
`border-left: 3px solid var(--accent)` alors que sa propre doctrine de juillet 2026
interdit la barre d'accent à gauche. Signalé, **il a tranché en faveur de la doctrine** —
la barre part de son CSS, notre implémentation était la bonne. Le diff ne sert pas seulement
à rattraper nos dérives.

---

## 9. Ce document vit des deux côtés

Un protocole que seul un des deux côtés connaît n'est pas un protocole. Ce fichier existe
donc en deux exemplaires :

| Copie | Rôle |
| --- | --- |
| `design/PROTOCOL.md` (ce dépôt) | **l'original.** Toute modification se fait ici. |
| `PROTOCOL.md` à la racine du projet CD | la copie que CD lit à chaque session |

**Règle : toute modification du CONTRAT est renvoyée à CD dans le même mouvement.** Pas « à
la prochaine occasion » — dans le même mouvement. Un protocole désynchronisé est pire que
pas de protocole : les deux côtés croient suivre la même règle.

Le contrat, ce sont les §1 à §7 et le §9 : qui décide, la gate, les conventions, les
procédures, la préséance, le journal. Le **§8 est un état**, pas une règle — un instantané
des écarts et des points en attente, qui bouge à chaque session.

Précision ajoutée le 2026-08-04, après quatre renvois en une heure : **une mise à jour du
seul §8 ne déclenche pas de renvoi immédiat**, elle voyage avec le prochain échange. La règle
du même mouvement existe pour qu'aucun des deux côtés ne suive une règle périmée ; l'appliquer
à un instantané d'état ne protège rien et coûte assez cher pour qu'on finisse par la
contourner. Une règle trop chère est une règle qu'on n'applique pas.

`pnpm mirror:diff` avertit toujours dès que les deux copies diffèrent, quelle que soit la
section : c'est le rappel, pas l'obligation. À l'inverse, un avertissement qui persiste alors
que seul le §8 a bougé est normal — et il se referme au renvoi suivant.

Comment la copie arrive chez CD : joindre le fichier au composer via le MCP Playwright
(`setInputFiles` sur l'input file, sans passer par le bouton) et demander à CD de
l'enregistrer sous `PROTOCOL.md` à la racine du projet. `DesignSync` ne peut pas écrire ici
(§4.1), donc c'est CD qui crée le fichier — il redescend ensuite par le sync DOWN.

**Le contrôle est automatique** : `pnpm mirror:diff` compare les deux copies en tête de
rapport et avertit si elles divergent ou si celle de CD manque. Ce n'est pas une
convention qu'on se rappelle, c'est une ligne qui s'affiche.

La version est en français, comme le reste du dépôt. CD la lit sans difficulté et son
`Design Notes.md` contient déjà des décisions en français.
