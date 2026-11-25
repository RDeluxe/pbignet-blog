# exhale — AGENTS.md

Le blog de Pierrick, **exhale** (logotype en minuscules, Anton ; domaine visé `exhale.blog`, en ligne sur `blog.pierrickbignet.com`). Le [README](README.md) donne la stack, les commandes et le déploiement : lis-le avant d'agir.

## Travailler avec Pierrick

- **Un texte que Pierrick dicte** (article, post, paragraphe) **se reprend sans paraphrase** : tu corriges la transcription (« Exile » pour exhale), l'orthographe et la ponctuation, et tu gardes ses mots, leur ordre et sa voix. Une reformulation se propose à côté, jamais à la place. Sa voix est décrite dans le vault, `24 Writing/24.01 System/Ton et style.md`.
- **Le reste se pense** : tu comprends ce qu'il veut, tu proposes, tu juges ton rendu avant de le montrer. Pierrick tranche ce qui se voit : rien de visible n'entre dans `src/` sans son œil, par une review crit. Passent sans lui : le rangement à rendu constant, mesuré, et les corrections de bug.
- **Le serveur de dev de Pierrick tourne sur le port 4321 et ne se coupe jamais.** Le tien prend un port libre, et tu le coupes en partant.
- **Ta mémoire, c'est le repo** (ici, `design/`, un commit qui nomme la décision) ou le vault, jamais `~/.claude`.

## La DA

**Avant tout visuel** (schéma, graphe, cover, image de post, slide, page), ouvre l'index de la DA dans le vault : `20-29 Areas/23 Evergreen/23.16 Exhale/DA exhale, l'index.md` (sur le serveur, le vault est `~/ContainersData/obsidian/vault/`). Il dit, type par type, le fichier validé à copier et la doctrine qui le juge.

- **Le code est la source de vérité du design.** Les valeurs (hex, tailles, espacements) vivent dans `src/styles/tokens/*.css` et le CSS scopé des composants, nulle part ailleurs.
- **La doctrine** : `design/doctrine/0_NORTHSTAR.html`, à lire avant toute décision de design. Ses valeurs (`--ink: #18170f`, `--maxw: 1080px`…) sont celles de son spécimen : la doctrine oui, ses hex jamais. Les décisions datées : `design/doctrine/Design Notes.md`, puis des commits qui les nomment.
- **Le code d'un composant** : `design/PIPELINE.md`, avant d'en écrire un (tokens, primitives, composants, règles dures).
- **Les schémas** : `design/claude-design/Pierrick Blog/` reste la référence des schémas et de leur animation (`assets/diagram.js`, « Pâte graphique* ») ; à lire avant tout schéma (Pierrick, 23/11/2026).
- **Vérifier un rendu** : `harness captures`, puis un sous-agent qui regarde (skill `/harness:verification-visuelle`) ; jamais une capture lue dans ton propre fil. Tes captures jetables vont dans `.screenshots/` (gitignored).

### Ce qui est décidé

**Photos** : les PNG dithérés de `public/photos/` ne se recompressent ni ne s'optimisent jamais, la trame serait détruite. Les sources couleur `public/photos/source/*.jpg` sont en prod exprès : les covers pop-color les lisent.

**Doctrine couleur** (NORTHSTAR §05/§08) : « one ink per page » ne régit que le mobilier et le type (dot, liens, topo, tags, accents) : jamais de bleu, jamais deux accents ; olive `#3d491d` sur la home, sépia `#9a7838` sur les articles. Le ton du dither photographique en est exempté : il peut suivre l'image (ciel bleu, duotone marine sur un article sépia). La couleur forte est un événement de hero : les plates du corps d'article restent en duotone sépia calme. Les covers sont art-directées par image (placement du titre à la main, override mobile, point focal `object-position`, contraste ≥ 3:1 par breakpoint, mesuré). Un dither ni olive ni sépia n'est donc pas une faute.

**Papier** : `--paper: #f6f5f1`, `--paper-2: #edebe4`, réservé aux panneaux en retrait et aux remplissages de hover.

**Les boîtes** (juillet 2026, `Design Notes.md`, audit des boîtes) :

- **plate** (présentation statique) = B6 : cadre « grille empruntée » (lignes 1.2px ink qui dépassent d'environ 13px aux angles) sur papier nu, grille ultra-légère. La variante sur `paper-2` est un secondaire « en retrait ».
- **tile** (interactif) = D2 : nu au repos (bordure 1px `--line`), puis croix d'angle 1px, bordure ink et fond `paper-2` au hover. Les angles sont le signal de focus.
- **callout** = E1 : note épinglée, filet, deux croix (haut gauche, bas droite), points estompés, tag mono « N.B. » qui casse la bordure du haut.
- **boutons** : au hover, remplissage dither animé (boil, steps, reduced-motion respecté) ; l'inversion en ink reste un mode secondaire.
- Les bords sont nets et à plat : zéro arrondi, zéro ombre portée, pas de barre d'accent à gauche. `.post` glisse de 14px au hover, sans flèche.

**Le vocabulaire**, celui de Claude Design : **cover**, le hero d'un article ; **recipe**, le réglage d'un hero par image (ton du dither, place et couleur du titre, point focal) ; **study**, une exploration ; **plate**, une image du corps d'article ; **tile**, une boîte interactive ; **hero pop color**, le hero qui fait ressortir une couleur de l'image (`src/lib/spot-hero.ts`).

**Les anti-références** sont dans `PRODUCT.md`. S'y ajoutent : un eyebrow mono en capitales au plus trois fois par page (`shead-meta`), au plus trois tirets cadratins par page dans le texte de l'interface (au-delà, ça signe un texte d'IA). Les articles en sont exemptés : leurs tirets sont ceux de Pierrick, on n'y touche pas (Pierrick, 25/11/2026). L'effet du hero ne s'adoucit jamais, c'est une décision engagée.
