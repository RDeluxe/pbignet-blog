# Bilan du miroir, composant par composant

> Instantané du **2026-08-04**, obtenu avec `pnpm mirror:diff`. Ce document se refait : si les
> chiffres ci-dessous ne correspondent plus à la sortie de l'outil, c'est le document qui est
> périmé, pas l'outil.

## Ce que dit le compteur, et pourquoi il trompe

L'outil annonce **24 composants en écart**. Le chiffre est vrai et inutile tel quel, parce
qu'il additionne quatre choses qui n'ont rien à voir. Après dépouillement :

| catégorie | volume | quoi en faire |
|---|---|---|
| **N — notation** | l'essentiel des 262 sélecteurs signalés | rien. Même design, deux façons de l'écrire. |
| **D — notre dérive** | 41 → **0** | corrigé (voir plus bas). Le gold fait foi. |
| **M — manque** | 7 composants | à construire. CD a spécifié, on n'a pas porté. |
| **Q — question** | 4 points | à trancher par CD, pas par nous. |

Les 262 sélecteurs « présents d'un seul côté » (127 chez CD, 135 chez nous) sont **presque
entièrement de la notation**. Trois conventions l'expliquent :

1. **Le qualificateur de racine.** CD écrit `.metabar .m .k`, `nav.main a`, `.post .idx` ;
   nous écrivons `.m .k`, `.main a`, `.idx`. Il ne *peut pas* faire autrement : son CSS est
   global, un `h2 { … }` dans `SectionHead.css` frapperait tous les `h2` de la page. Nous non
   plus : Astro scope déjà la règle, le parent est redondant. **Les deux côtés ont raison chez
   eux** — c'est l'outil qui devrait absorber la différence, comme il absorbe déjà
   `data-astro-cid` (voir la dette d'outillage en fin de document).
2. **`:global()`.** Les 19 sélecteurs de `Prose` divergent tous pour cette seule raison : le
   HTML vient de Markdoc, Astro ne peut pas le scoper. Zéro écart de design là-dedans.
3. **Classe → `data-*`.** `.pframe.tall` → `[data-ratio='tall']`, `.topbar.over-hero` →
   `[data-over-cover='on']`. Conversion décidée en août 2026, faite des deux côtés à un
   rythme différent.

**Le miroir est en bien meilleur état que le compteur ne le suggère.**

---

## L'échelle est partagée depuis le 2026-08-04

Brief `2026-08-04-echelle-espacement.md` envoyé, **arbitré et implémenté par CD** (27 fichiers
de son côté). Son verdict sur les sept valeurs hors échelle :

| valeur | verdict CD | conséquence chez nous |
|---|---|---|
| **14px** | promue **`--space-sm`** (demi-pas) | aucun pixel ne bouge |
| **18px** | promue **`--space-ml`** (demi-pas) | aucun pixel ne bouge |
| **6px** | reste **littéral optique** | gardée, renommée `--space-optical-6` |
| 10px | snappée → `--space-s` (12px) | +2px |
| 22px | snappée → `--space-xl` (24px) | +2px |
| 28px | snappée → `--space-xl` (24px) | −4px |
| 30px | snappée → `--space-2xl` (32px) | +2px |

Il a aussi pris les trois autres demandes : **règle reduced-motion globale** adoptée et
énumération supprimée, **règles d'impression déplacées** dans les composants (avec le
`min-height: 0` que je lui avais signalé), **déclarations mortes et six styles en ligne
résorbés**. `foundation` passe de 110 à **69 écarts**, les écarts assumés de 37 à **19**.

Sa seule question en retour : les noms `sm`/`ml` des demi-pas sont ouverts — « les valeurs sont
tranchées, les noms non ». On les a adoptés tels quels ; s'ils gênent, c'est le moment de
proposer autre chose.

En attente de sa part : l'adoption complète des tokens de type (il a pris l'échelle
d'espacement, le type reste partiel).

## Ce qui a été corrigé le 2026-08-04

Les 41 désaccords de valeur sont tombés à 22, dont 3 assumés (noms `@fontsource`). Les 19
restants sont tous classés : aucune dérive inexpliquée ne subsiste.

| composant | dérive | corrigé en |
|---|---|---|
| **Plate** | `padding: 24px 20px`, trame 16/64px, aucun interligne lié | `--cell` partout (voir §1) |
| **Callout** | `padding: 18px`, trame 16px décalée d'un demi-pas, interligne 1.5 | idem |
| **HeroPopColor** | `min-height` 540px, `bottom` 8% ×2, `bottom` 20px, `font-size` 11.5px, `margin-top` 7px | valeurs du gold |
| **type.css** | `--fs-cover` `clamp(56px,16vw,176px)`, `--lh-cover` 0.82, `--tr-cover` 0.02em | `clamp(52px,17vw,176px)` · 0.8 · 0.03em |
| **PullQuote** | `margin` 2.2em, `padding` 22px symétrique | 2.4em · `18px 0 0` |
| **CollCard** | `transition` 0.2s | `--dur-slow` (0.25s) |
| **ArticlePlate** | prop `data-wide='on'` | `data-width='wide'`, sa décision d'août 2026 |

---

## Composant par composant

Légende : **N** notation · **D** dérive · **M** manque chez nous · **Q** question à CD

| composant | verdict | détail |
|---|---|---|
| **Wrap** | ✅ aligné | 5 déclarations identiques. |
| **Barcode** | ✅ aligné | 9 déclarations identiques. |
| **Plate** | ✅ **corrigé** | plus aucun désaccord de valeur. |
| **Tag** | ✅ N | on ajoute `align-self: flex-start` pour qu'un tag ne s'étire pas dans une colonne flex. Bon ajout. |
| **Metabar** | N | qualificateur de racine sur 4 sélecteurs sur 5. Reste `.brand .dot`, qu'il a et nous non. |
| **MainNav** | N + bon ajout | `nav.main` vs `.main`. On ajoute `a[aria-current='page']` : un état de page active n'a pas de sens dans une maquette statique. |
| **SectionHead** | N | ses deux déclarations (`align-items`, `justify-content`) vivent chez nous dans `[data-align='row']`. Rien ne manque. |
| **PostRow** | N + **Q** | racine ; `:last-child` vs `:last-of-type`. **Q** : il garde `.post .arrow`, or la doctrine de juillet 2026 dit « plus de flèche au hover ». Vestige ? |
| **FeaturedEssay** | N | 5 sélecteurs sur 5 s'apparient en retirant la racine. On ajoute `display: block` parce que c'est un `<a>`. |
| **MonoLabel** | N | son `.mono` de base devient `[data-tone='default'|'quiet']`. |
| **ArticleBar** | N | 10 sélecteurs sur 12 en notation. On ajoute deux règles de breakpoint étroit. |
| **GearCard** | N | son `transition: 0.2s` (raccourci « toutes propriétés ») contre notre énumération de deux. Effet identique. |
| **StatRow** | N | breakpoint 720px chez lui, 700px chez nous — même intention, seuil voisin. |
| **Callout** | N (après correction) | ses 6 lignes restantes sont une **attribution d'élément**, pas un désaccord : son `::before` porte l'étiquette et son `::after` les deux croix ; chez nous `::before`/`::after` portent une croix chacune et l'étiquette est un `<span class="nb">`. Même rendu. Voir §1. |
| **PhotoFrame** | N + **M** | **M** : `aspect-ratio: 3/4` par défaut sur `.pframe` — on ne l'a pas, notre cadre n'a pas de ratio de base. |
| **ArticleHead** | N + **M** | **M** : tout le bloc de fin d'article (`.art-end`, `.art-end .em`, son point, son gras) n'existe pas chez nous. |
| **Hero** | N + **M** + **Q** | **M** : `.hero-kick` et le code-barre de hero (`.hero2-bc`). **Q** : `.hero2-credit` (voir §2). Bon ajout de notre côté : le repli `@supports not (background-clip: text)`. |
| **Prose** | N + **M** | 19 sélecteurs en `:global()`. **M** : il pose `margin-top: clamp(30px,4vw,44px)` sur `.prose`, nous non. |
| **Lede** | N + **M** | **M, notable** : son `[data-size='intro']` est **positionné en absolu sur le hero** (`position:absolute`, `right:6%`, `top:7.5%`, `max-width:22ch`, `text-wrap:balance`). Le nôtre est un bloc ordinaire. Placement absent, pas détail de valeur. |
| **ArticlePlate** | **M** | la variante dither (`.dither-canvas`, `.dsrc`, `[data-dither='on']`) n'est pas portée. La prop est alignée depuis aujourd'hui. |
| **SiteFooter** | **M, le plus gros** | il a `data-variant='index'|'article'` et tout l'arbre du pied d'article (`.fin`, `.f-brand`, `.f-col`, `.f-mark`, `.f-credit`, 3 breakpoints). On n'a que la variante index : 18 sélecteurs manquants. |
| **HeroPopColor** | **corrigé** + **Q** | les 9 valeurs numériques sont alignées. Restent 3 paramètres de recipe (`--phHeight`, `--phGround`, `--ph-title-y`) qui sont **structurels et voulus** — la cover est art-directée par image — et 4 encres (§2). |
| **CollCard** | **corrigé** + **Q** | `transition` alignée. **Q** : son fond est `color-mix(ink 2%, transparent)`, translucide ; le nôtre `var(--paper)`, opaque — délibérément, pour masquer le filet d'une `Grid gap="hairline"`. À valider. |
| **RegMarks** | **Q** | `position: absolute` chez lui, `fixed` chez nous. Pas cosmétique : en `fixed` les repères collent au viewport et ne défilent pas. Des repères de repérage appartiennent à la feuille, donc `absolute` a l'air juste — mais c'est peut-être un choix d'écran assumé. |

---

## §1 — Le carreau : un mécanisme, pas deux réglages

C'est la trouvaille de fond, et elle valait plus que les valeurs qu'elle corrige.

`--cell: 24px` **n'est pas un pas d'espacement, c'est un interligne.** Le gold le dit :

> `--cell (24px) = the body line-height, so text lines sit ON the grid; majeure every 4 cells.`

Tout en découle : trame mineure = un cell, majeure = quatre, padding = un cell, et les blocs de
texte reçoivent `line-height: var(--cell)`. C'est ce dernier point qui fait qu'une plate se lit
comme **écrite sur du papier quadrillé** et non posée dessus.

Nous avions scindé ça en trois tokens sans lien — `--plate-step-minor: 16px`,
`--plate-step-major: 64px`, `--dot-step: 16px` — et **jamais lié l'interligne**. Le Callout
allait plus loin dans la fausse piste : sa trame était décalée d'un demi-pas « pour que la
trame ne touche pas le filet », une justification cosmétique qui garantissait que le texte ne
tomberait jamais sur les points.

Résultat : la trame était devenue un fond décoratif, ce qui est exactement ce qu'un carreau
n'est pas. Corrigé — un seul `--cell` dans `tokens/space.css`, dont Plate et Callout dérivent
tout.

Détail d'implémentation qui vaut d'être noté : le gold écrit `.plate p, .plate li
{ line-height: var(--cell) }` parce que son CSS est global. Chez nous `line-height` est une
propriété **héritée**, donc la poser sur la racine du composant suffit — et évite un
`:global()`, que PIPELINE §4.3 réserve à `Prose`.

**Une erreur que j'ai commise et corrigée en route** : j'avais d'abord lu ses quatre dégradés
de `::after` comme quatre repères d'angle, contre notre croix unique centrée, et conclu à un
désaccord de dessin. Faux. Ses quatre dégradés forment **deux croix** (haut-gauche +
bas-droite), à un demi-pixel près des nôtres. La doctrine dit « 2 croix (tl+br) » et les deux
côtés la respectent.

---

## §2 — Les encres de photo viennent des bancs, pas du gold

Le point le plus important qui reste, parce qu'il touche la méthode.

Nos tokens `--cover-ink-light: #f4efe3`, `--cover-ink-quiet: #ded7c8` et
`--cover-ink-dark: #241606` portent des valeurs qui **n'existent nulle part dans le gold**.
Elles existent chez CD — mais seulement dans `research/Article - hero studies.html` et
`research/Article - spot colour.html`, donc dans des bancs d'essai.

Pendant ce temps le gold utilise **cinq encres claires distinctes** :

| où | valeur du gold | ce qu'on met |
|---|---|---|
| `Hero.css` `.hero2-credit` | `#f3ecdb` | `--cover-ink-light` (#f4efe3) |
| `HeroPopColor.css` `.ph-sub` | `#e9e3d6` | `--cover-ink-light` (#f4efe3) |
| `HeroPopColor.css` `.ph-vcap` | `#ece6d8` | `--cover-ink-light` (#f4efe3) |
| `HeroPopColor.css` `.ph-sub .sm` | `#cfc9bb` | `--cover-ink-quiet` (#ded7c8) |
| `HeroPopColor.css` `.ph-cue` | `rgba(241,235,221,0.7)` | `--cover-ink-quiet` (#ded7c8) |

Deux erreurs superposées : on a **puisé dans la research au lieu du gold** (« a validated
result graduates to root » — la research ne fait pas foi), et on a **unifié cinq valeurs en
deux tokens**, ce que PROTOCOL §1 nous interdit de décider seuls.

Ces tokens alimentent 6 composants, donc on ne les touche pas avant réponse. Il est très
possible que CD dise « unifiez, ces cinq nuances sont accidentelles » — c'est précisément
pour ça qu'il faut demander plutôt que supposer.

---

## Ce qui reste à construire (M)

Par ordre d'importance — c'est aussi la liste de ce qui bloque « finaliser Home + Article » :

1. **SiteFooter, variante article** — 18 sélecteurs, tout l'arbre `.fin`. Le plus gros manque.
2. **ArticlePlate, variante dither** — et le composant n'a **aucun appelant** aujourd'hui.
3. **Lede intro** — le placement absolu sur le hero.
4. **ArticleHead** — le bloc de fin d'article.
5. **Hero** — `.hero-kick`, le code-barre de hero.
6. **PhotoFrame** — le `aspect-ratio: 3/4` par défaut.
7. **Prose** — le `margin-top` de tête.

À noter : `ArticlePlate`, `PullQuote` et `Callout` n'ont **aucun appelant** dans une vraie
page. Leur CSS est correct, mais rien ne le rend — donc rien ne le vérifie.

---

## Les quatre questions pour CD (Q)

Toujours ouvertes — elles n'étaient pas dans le brief de l'échelle, elles feront le suivant.

1. **Encres de photo** — unifier les cinq nuances claires du gold, ou les garder distinctes ?
   C'est la plus importante : c'est une question de méthode (§2), pas de valeur.
2. **RegMarks** — `absolute` (sa version) ou `fixed` (la nôtre) ?
3. **CollCard** — notre fond opaque, qui masque volontairement le filet d'une grille en
   `hairline`, contre son fond translucide à 2 % d'encre.
4. **PostRow** — `.post .arrow` est-il un vestige, la doctrine de juillet ayant retiré la
   flèche ?

Un nettoyage trivial à lui signaler au passage, sans en faire une question : son
`.ph-cue { display: none !important }` d'impression garde un `!important` qui n'avait de sens
que tant que la règle vivait dans `paper.css` global. Depuis qu'elle est dans le composant,
plus rien ne la concurrence.

---

## Dette d'outillage

L'outil devrait absorber le qualificateur de racine, comme il absorbe déjà `data-astro-cid`,
les nombres, les virgules et les guillemets. En déclarant la racine de chaque composant au
manifeste (`"root": ".metabar"`), il apparierait `.metabar .m .k` avec `.m .k` et arrêterait
de compter de la notation comme de la dérive.

Mesure faite : un dépouillement naïf à un seul niveau apparie déjà 44 des 127 sélecteurs
« seulement chez CD ». Avec la racine déclarée on irait bien plus loin. Tant que ce n'est pas
fait, **lire le compteur de sélecteurs avec méfiance** et se fier aux déclarations.
