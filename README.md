# exhale

Le blog de Pierrick Bignet, en ligne sur <https://blog.pierrickbignet.com> depuis le 09/11,
où il a remplacé Ghost. Un site Astro statique : les articles sont des fichiers Markdoc du
repo, le build sort du HTML dans `dist/`, nginx le sert.

## La stack

- **Astro 6** : le site statique, les pages, les Content Collections (`writing` et `guides`, dans `src/content.config.ts`).
- **Svelte 5** : branché (`@astrojs/svelte`) pour les composants qui auraient besoin de JS côté navigateur ; aucun `.svelte` pour l'instant.
- **Markdoc** : le format des articles (`.md` / `.mdoc`), avec des balises maison comme `{% callout %}` (`markdoc.config.mjs`).
- **CSS pur, scopé par composant** : pas de framework utilitaire. Les valeurs (couleurs, types, espaces) vivent dans des tokens, des custom properties.
- **Fontsource** : Anton, Space Mono, Archivo et Newsreader, servies par le site lui-même.

## Où sont les choses

| Chemin | Contenu |
| :-- | :-- |
| `src/content/writing/` | Les articles (`<slug>.mdoc`). `src/content/guides/` : les guides. |
| `src/pages/`, `src/layouts/` | Les routes et les gabarits de page. |
| `src/components/` | Les composants Astro (`primitives/`, `article/`, `hero/`, `print/`, `ds/`). |
| `src/styles/tokens/` | Les tokens : `colors.css`, `type.css`, `space.css`. `base.css` est le reset. |
| `src/lib/` | Les helpers : dates, lecture des articles, couleur du hero. |
| `public/` | Les fichiers servis tels quels : photos dithérées (à ne jamais recompresser), images des articles dans `public/writing/<slug>/`. |
| `redirects/` | Les redirections 301 depuis les anciennes URL de Ghost. |
| `scripts/` | Les scripts de déploiement, d'import et de redirections. |
| `design/` | La doctrine et les protocoles de design (voir plus bas). |

## Les commandes

Toutes se lancent depuis la racine du repo, après `pnpm install` (Node ≥ 22.12).

| Commande | Ce qu'elle fait |
| :-- | :-- |
| `pnpm dev` | Le serveur de dev, sur `localhost:4321`. Ce port est celui de Pierrick, qui teste dessus : ne jamais le couper. Un agent lance son propre serveur sur un autre port. |
| `pnpm build` | Le build de prod, dans `dist/`, sans les pages `/ds/` (previews du design system). |
| `pnpm build:cd` | Le même build avec les pages `/ds/` (`CD_EXPORT=1`), pour l'atelier d'idéation. |
| `pnpm build:od` | `build:cd`, puis copie dans le dossier d'Open Design (`OD_PROJECT_DIR`), voir `design/PROTOCOL.md`. |
| `pnpm preview` | Sert le dernier build. |
| `pnpm lint` | ESLint sur tout le repo. |
| `pnpm post:import` | Publie des notes du vault Obsidian (voir plus bas). |
| `pnpm redirects` | Régénère la liste des redirections (voir plus bas). `--check` vérifie qu'elle est à jour sans écrire. |
| `pnpm redirects:check` | Vérifie les redirections sur un site qui tourne (voir plus bas). |

## Configuration

Deux variables d'environnement, lues depuis le shell ou le `.env` du repo (gitignored) :

| Variable | Rôle | Défaut |
| :-- | :-- | :-- |
| `SITE_URL` | L'URL publique du site : liens canoniques, Open Graph, sitemap. | `https://blog.pierrickbignet.com` |
| `VAULT_ARTICLES_DIR` | Le dossier des articles publiés dans le vault Obsidian, pour `pnpm post:import` sans argument. | aucun |

## Déployer

**Prod.** Un push sur `main` suffit. La CI (`.github/workflows/release.yml`) construit l'image
(`Dockerfile` : build Astro de prod, puis nginx), la pousse sur `ghcr.io/rdeluxe/pbignet-blog`
en `latest` et `sha-<court>`, puis appelle le webhook Dockhand, qui redéploie la stack
`blog-prod` (`deploy/docker-compose.yaml`, variables dans `deploy/.env.example`). L'appel du
webhook est sauté tant que les secrets `DOCKHAND_WEBHOOK_URL` et `DOCKHAND_WEBHOOK_SECRET`
ne sont pas posés. La conf nginx est `deploy/nginx/default.conf`. Le build de prod ne garde
pas les pages `/ds/` (previews du design system) ; `pnpm dev` et `pnpm build:cd` les gardent.
Il n'y a plus de staging.

**Les anciennes URL de Ghost.** Un article migré garde son `link` Ghost dans son frontmatter.
`pnpm redirects` (`scripts/gen-redirects.ts`) en tire `redirects/redirects.map`, une liste
de lignes `/ancien /nouveau;` : les articles (`/<slug>/` vers `/writing/<slug>/`), `/rss/`,
`/feed/`, `/sitemap.xml`, les images de Ghost retrouvées dans `public/writing/`, et les
lignes à la main de `redirects/manual.map`. Ce fichier est généré : on édite `manual.map`,
jamais `redirects.map`. Les images de Ghost sans équivalent vont dans `missing-images.txt`.
L'image Docker embarque la liste : un `main` régénéré la redéploie. Les images de l'ancien
Ghost listées dans `ghost-images.txt` sont dans `public/content/images/`, servies au même
chemin. `scripts/check-redirects.sh [url]` (ou `pnpm redirects:check [url]`) vérifie sur un
site qui tourne, la prod par défaut ou un conteneur de test, que chaque ancienne URL répond
301 vers la bonne cible, et que la cible répond 200. Derrière un login, il s'arrête sur un
401 ou 403 : passer un login par `CURL_ARGS`.

## Publier une note du vault

`scripts/vault-to-post.ts` convertit une note Obsidian en article de la collection `writing`.

```sh
pnpm post:import "…/24.13.1 Articles/Ma note.md"   # une note
pnpm post:import                                  # tout VAULT_ARTICLES_DIR
```

Une note donne `src/content/writing/<slug>.mdoc`, et ses images vont dans
`public/writing/<slug>/`. Le script est relançable : il réécrit les mêmes fichiers, et une
image déjà présente n'est ni retéléchargée ni réencodée. Une retouche faite à la main dans
le `.mdoc` est donc écrasée au prochain import de la même note : on corrige la note.

Ce que la note fournit, dans son frontmatter :

- `posted_on` : la date. Sans elle, un article migré prend celle de la table `GHOST_DATES`
  du script (la date de publication sur Ghost), puis une traduction prend la date de la note
  qu'elle cite en wikilink (son original) ; sinon le script s'arrête.
- `tags`, `serie`, `link` (l'URL de l'ancien blog Ghost, gardée pour les redirections).
- facultatifs : `title` (sinon le nom du fichier, sans « FR - » ni « (EN) »), `description`
  (sinon le premier paragraphe), `lang` (sinon « FR - » / « (EN) », sinon les mots du texte).

Le slug est celui de Ghost quand la note a un `link` (les anciennes URL gardent leur
chemin), sinon le titre. Les callouts `> [!note]` deviennent `{% callout %}`, le callout
« importé depuis le blog » disparaît, les wikilinks et les liens vers l'ancien blog pointent
vers l'article migré s'il est dans le même dossier du vault.

## Les documents de design

- [`CLAUDE.md`](CLAUDE.md) : les règles de travail du repo. À lire en premier.
- [`PRODUCT.md`](PRODUCT.md) : le produit, ses lecteurs, le ton, les anti-patterns.
- [`design/PIPELINE.md`](design/PIPELINE.md) : la doctrine code (tokens, primitives, composants). À lire avant d'écrire un composant.
- [`design/PROTOCOL.md`](design/PROTOCOL.md) : le protocole d'idéation avec Open Design, le code étant la source de vérité.
- [`design/doctrine/0_NORTHSTAR.html`](design/doctrine/0_NORTHSTAR.html) : la doctrine design. À lire avant toute décision visuelle.
