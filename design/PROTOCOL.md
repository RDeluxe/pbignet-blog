# Protocole exhale — le code est la source de vérité

> Décidé par Pierrick le **2026-08-04**. Ce document remplace l'ancien protocole de
> convergence continue CC ↔ CD ; l'ancien vit dans l'historique git (dernier état :
> commit `d40181b`) et son démontage est journalisé en §5.

---

## 1. Le modèle

**Le code (`src/`) est la source de vérité du design.** Ce qui est dans le repo est le
site ; il n'y a rien à faire converger en permanence.

**L'atelier d'idéation est Open Design** (depuis le 2026-08-05) : une app desktop locale
qui lit un dossier projet sur le disque — plus de claude.ai, plus de Cloudflare, plus de
transport. L'atelier reçoit une **copie du build réel** (`pnpm build:od`), explore dessus,
et on ramène ce qui vaut. Les principes de la branche jetable tiennent : la copie du site
dans l'atelier est **remplacée à chaque sync** et n'est jamais éditée là-bas ; ce que
l'atelier accumule (studies, notes) est sa mémoire, mais n'a jamais force de décision —
seul le build dit l'état réel du site.

**Pierrick est dans la boucle par construction** : c'est lui qui idéationne dans CD et lui
qui décide ce qui revient. La gate se résume à sa forme naturelle — **rien de visible
n'entre dans `src/` sans son œil**.

## 2. Où vit quoi

| Quoi | Où | Note |
| --- | --- | --- |
| **Valeurs** (hex, tailles, espacements) | `src/styles/tokens/*.css` + le CSS scopé des composants | La seule source. |
| **Doctrine** (règles, anatomie, guardrails) | [`doctrine/0_NORTHSTAR.html`](doctrine/0_NORTHSTAR.html) | Canonique ici depuis le 2026-08-04. Ses hex sont ceux du specimen, jamais ceux du site. |
| **Journal des décisions de design** | [`doctrine/Design Notes.md`](doctrine/Design%20Notes.md) (historique) + les commits du repo (désormais) | Une décision ramenée de session = un commit qui la nomme. |
| **Comment le CSS d'idéation devient du code** | [`PIPELINE.md`](PIPELINE.md) | Le tri, les règles dures — inchangé. |
| Sync vers l'atelier Open Design | [`scripts/sync-od.mjs`](../scripts/sync-od.mjs) (`pnpm build:od`) | Le dossier projet vient de `OD_PROJECT_DIR`. |
| [`SESSION-CD.md`](SESSION-CD.md) | archive de l'ère claude.ai | Plus de destinataire depuis le 2026-08-05. |
| `claude-design/Pierrick Blog/` | archive du **dernier état ramené** de CD (ère claude.ai) | Plus une référence : un instantané, daté par son commit. |
| `briefs/` | archive de l'ancien flux UP | Historique, plus alimenté. |

## 3. La boucle de travail avec Open Design

```
éditer src/  →  pnpm build:od  →  rafraîchir l'onglet d'aperçu Open Design
```

`pnpm build:od` ([`scripts/sync-od.mjs`](../scripts/sync-od.mjs)) fait trois gestes :
`pnpm build:cd`, copie de `dist-cd/` vers `<projet OD>/site/`, puis réécriture des
chemins racine-absolus en relatif. `--no-build` pour resync sans rebuild. Le dossier
projet vient de **`OD_PROJECT_DIR`** (variable d'environnement — donnée de machine,
jamais commitée).

### Les trois contraintes du moteur Open Design (constatées le 2026-08-05)

1. **Le dossier projet est la seule racine autorisée** — rien ne se lit en dehors.
2. **Les symlinks qui sortent du projet sont refusés** (`path escapes project dir`).
   Il faut de vrais fichiers : d'où la copie.
3. **Le rendu résout en `file://`** : les chemins racine-absolus d'Astro (`/_astro/…`)
   partent à la racine du disque et la page se rend **nue**. D'où la réécriture en
   relatif — y compris les `url(/…)` du CSS (les fonts passent par là) et les liens de
   nav (`/setup` → `setup.html`, format `file` oblige).

### Ce que l'aperçu montre — et ne montre pas

Mesuré au calculé (Playwright sur `site/index.html` en `file://`) : styles, fonts
self-hostées et photos chargent — l'aperçu est **fidèle pour le type, la couleur,
l'espacement, les images**. En revanche les **scripts module sont bloqués par CORS en
`file://`** : pas de grain, pas de topo, pas de canvas dither — les covers d'article
montrent leur `<img>` fallback (`photos/source/`, qui reste dans la copie pour ça).
Les effets JS se jugent sur `pnpm dev`, pas dans l'aperçu.

Les routes non construites (`/projects`, `/now`, `/travel`, `/about`) restent des liens
morts **volontairement** : un lien mort en preview est honnête, ces pages n'existent pas.

### Le retour

L'atelier travaille en local : ce qu'il produit est déjà sur le disque, le rapatriement
est une lecture de dossier — plus de transport. Le reste ne change pas : Pierrick tranche
ce qui entre ; CC porte dans `src/` selon le tri de `PIPELINE.md` §3 et vérifie au rendu
(captures dans `.screenshots/`, styles calculés via Playwright). Les modalités fines du
bilan de session côté Open Design restent à roder à l'usage.

### Le serveur MCP `open-design` (installé le 2026-08-05)

CC a un accès direct à l'espace de travail OD via un serveur MCP stdio (config
utilisateur `~/.claude.json` ; disponible dans les **nouvelles** sessions Claude Code).
Il proxifie vers le daemon et **redécouvre son URL à chaque spawn** — la config survit
aux redémarrages du daemon malgré le port éphémère ; seul un serveur MCP déjà lancé
cache l'URL et doit être relancé si le daemon redémarre.

- **Lecture** (le cas d'usage) : `get_file`, `list_files`, `search_files`,
  `get_project`, `list_projects`, `get_artifact` — fin du copier-coller.
- **`get_active_context`** — l'outil auquel on ne pense pas : il dit **quel projet et
  quel fichier Pierrick a sous les yeux dans OD en ce moment**. À utiliser en premier
  quand Pierrick dit « regarde ce que j'ai à l'écran ».
- **Écriture — exposée mais ENCADRÉE** : le serveur expose aussi `write_file`,
  `delete_file`, `create_project`, `delete_project`, `create_artifact`, `start_run`.
  Règle de direction unique : **CC écrit le repo, OD écrit ses Design Files** — pas de
  verrou entre les deux, on ne se marche pas dessus. CC ne touche pas aux fichiers du
  projet OD (exception : `pnpm build:od`, qui remplace `site/`, sa zone à lui).
  `delete_project` ne s'invoque jamais.

> Piège d'installation : `od mcp install claude` enregistre la commande `od`, qui n'est
> **pas sur le PATH** de cette machine (`/usr/bin/od` est l'octal-dump Unix). La config
> corrigée invoque `node …/Open Design.app/Contents/Resources/app/prebundled/daemon/daemon-cli.mjs mcp`.

## 4. Les invariants qui survivent à l'ancien protocole

- **Variantes en `data-*`** + union TS, jamais des classes modificatrices (`PIPELINE.md` §4.5).
- **Vocabulaire de CD** : cover, recipe, study, plate, tile, callout, hero pop color.
- **Le NORTHSTAR ne fait jamais foi sur ses valeurs** — doctrine oui, hex non.
- **Jamais sur parole** : toute affirmation sur l'état d'un fichier (le nôtre ou celui de
  CD) se vérifie sur le fichier, pas sur la mémoire d'une session.
- Les captures de vérification vont dans `.screenshots/` (gitignored), nulle part ailleurs.
- Les PNG dithérés de `public/photos/` ne se recompressent jamais.

## 5. Journal du protocole

| Date | Décision |
| --- | --- |
| 2026-08-04 | **Pivot : le code devient la source de vérité ; CD devient un atelier d'idéation par sessions.** Décision de Pierrick, après analyse critique de l'ancien protocole : la vérité vivait dans le système le moins outillé (pas de git, pas de diff, pas d'API d'écriture, Cloudflare), et la plomberie de convergence continue — miroir par composant, `manifest.json` des scopes, `css-diff.mjs`, double copie du protocole, back-port permanent, gate à deux modes — compensait ce choix au lieu de le corriger. |
| 2026-08-04 | **Démonté** : `design/mirror/` (manifeste, `css-diff.mjs`, BILAN), le script `pnpm mirror:diff`, la dépendance `postcss`, la double copie de PROTOCOL.md, le flux UP par briefs, les modes A/B de la gate. Tout reste lisible au commit `d40181b`. |
| 2026-08-04 | **Rapatrié** : `0_NORTHSTAR.html` et `Design Notes.md` deviennent canoniques dans `design/doctrine/`. Les valeurs de production sont celles du code. |
| 2026-08-04 | **Créé** : `pnpm build:cd` (export lisible pour CD) et `SESSION-CD.md` (prompt de session). Le bilan de session est le `ROUND-UP.md` produit par CD — à l'essai : s'il se révèle peu fiable, la vérification par diff reviendra, mais côté retour de session, pas en convergence continue. |
| 2026-08-04 | **Skill `session-cd`** : le lancement de session est automatisé (build, zip `ditto`, upload zip + NORTHSTAR dans le projet CD, prompt inséré). Nouveau projet CD **« blog »** à créer par Pierrick ; « Pierrick Blog » devient un backup en lecture seule. URL à renseigner dans le skill à la première invocation. |
| 2026-08-05 | **L'atelier devient Open Design** (app desktop locale sur dossier projet). Le transport claude.ai — zip, upload, Cloudflare, `DesignSync`, rapatriement Playwright — coûtait trop de tokens et marchait mal : tout est mort. `pnpm build:cd` reste le bon matériau ; `scripts/sync-od.mjs` (`pnpm build:od`) copie le build dans `<OD_PROJECT_DIR>/site/` et réécrit les chemins en relatif (le moteur OD rend en `file://`, refuse les symlinks sortants, et une seule racine). |
| 2026-08-05 | **Décisions de Pierrick** : le skill `session-cd` est **retiré** (le transport claude.ai n'a plus de raison d'être ; historique et scripts Playwright en git, `SESSION-CD.md` reste en archive). Les `public/photos/source/*.jpg` dans le build de prod sont **intentionnels** — sources exposées exprès, pas un reliquat du pipeline de dithering. |
| 2026-08-05 | **La research de l'ère CD est importée dans l'atelier OD**, ISO avec l'archive (`design/claude-design/Pierrick Blog/`) : `research/` (12 studies), `assets/` (paper.css, texture/dither/diagram/image-slot/spot-hero.js, photos), `thumbs/`, `01_Home.html`, `02_Article.html`, `0_NORTHSTAR.html`, `tweaks-panel.jsx`. Vérifié en `file://` : papier, feuilles chargées, topo canvas actif (les scripts CD sont classiques, pas des modules — ils tournent, contrairement à ceux du build Astro). Seul raté : le fetch Babel de `tweaks-panel.jsx` (XHR bloqué en `file://`) — le panneau de tweaks ne s'ouvre pas, le reste de la page vit. |
| 2026-08-05 | **Copie allégée, sauf `photos/source/`.** Sortent : `sitemap*.xml`, les `.woff` doublonnés par leur `.woff2` (hashes différents, détection par nom de base). `photos/source/` **reste**, contre l'intuition du handoff : mesuré en `file://`, le `<img>` fallback du hero pop color pointe dessus — et c'est lui qu'on voit en preview, les scripts module étant bloqués par CORS. Rendu stylé prouvé au calculé : fond `#f6f5f1`, 4 familles de fontes, images 4/4. |
