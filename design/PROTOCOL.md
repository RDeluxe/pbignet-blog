# Protocole exhale — le code est la source de vérité

> Décidé par Pierrick le **2026-08-04**. Ce document remplace l'ancien protocole de
> convergence continue CC ↔ CD ; l'ancien vit dans l'historique git (dernier état :
> commit `d40181b`) et son démontage est journalisé en §5.

---

## 1. Le modèle

**Le code (`src/`) est la source de vérité du design.** Ce qui est dans le repo est le
site ; il n'y a rien à faire converger en permanence.

**Claude Design est un atelier d'idéation**, utilisé par sessions bornées, sur le modèle
de la branche jetable : on y importe l'état réel du site, on explore, on ramène ce qui
vaut, le reste meurt avec la session. Le projet CD entre deux sessions n'engage personne.

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
| Prompt de début de session CD | [`SESSION-CD.md`](SESSION-CD.md) | À coller dans CD en ouvrant une session. |
| `claude-design/Pierrick Blog/` | archive du **dernier état ramené** de CD | Plus une référence : un instantané, daté par son commit. |
| `briefs/` | archive de l'ancien flux UP | Historique, plus alimenté. |

## 3. La session d'idéation

**Le lancement est automatisé : le skill `session-cd`** (`.claude/skills/session-cd/`).
Pierrick dit « lance une session d'idéation », et le skill enchaîne :

1. **EXPORT** — `pnpm build:cd` → `dist-cd/` (non minifié, CSS en fichiers), zippé avec
   `ditto -c -k` dans un dossier temporaire.

2. **ENVOI** — le zip + `doctrine/0_NORTHSTAR.html` sont uploadés dans le projet CD
   (**« blog »** — l'ancien « Pierrick Blog » est un backup, on n'y écrit plus), avec le
   prompt de [`SESSION-CD.md`](SESSION-CD.md) : le rôle de CD, les règles, et le format
   de sortie — un `ROUND-UP.md` tenu au fil de l'eau, consolidé en fin de session.

3. **IDÉATION** — Pierrick et CD travaillent. Les explorations se font sur des **copies
   ou de nouvelles pages** (`study - <sujet>`), jamais en modifiant l'export importé :
   l'import intact est la référence « avant » qui rend le round-up vérifiable.

4. **RETOUR** — rapatrier ce que la session a produit :
   - à l'unité : `DesignSync get_file` (lecture directe, sans navigateur) ;
   - en bloc : download zip via le MCP Playwright (seul navigateur passé Cloudflare ;
     un `curl` échoue, `cf_clearance` est lié à l'empreinte TLS), puis
     `ditto -x -k` (l'UTF-8 des noms accentués casse avec `unzip` sur macOS).

   Lire `ROUND-UP.md` pour l'intention, **regarder les fichiers pour le contenu** — le
   bilan d'un LLM sans diff est une narration, pas un relevé. Pierrick tranche ce qui
   entre ; CC porte dans `src/` selon le tri de `PIPELINE.md` §3, et vérifie au rendu
   (captures dans `.screenshots/`, styles calculés via Playwright).

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
