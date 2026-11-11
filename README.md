# Astro Starter Kit: Minimal

```sh
pnpm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |
| `pnpm post:import [note.md…]` | Publie des notes du vault (voir plus bas)  |

## Configuration

Deux variables d'environnement, lues depuis le shell ou le `.env` du repo (gitignored) :

| Variable | Rôle | Défaut |
| :-- | :-- | :-- |
| `SITE_URL` | L'URL publique du site : liens canoniques, Open Graph, sitemap. | `https://blog.pierrickbignet.com` |
| `VAULT_ARTICLES_DIR` | Le dossier des articles publiés dans le vault Obsidian, pour `pnpm post:import` sans argument. | aucun |

## Déployer en prod

Un push sur `main` suffit. La CI (`.github/workflows/release.yml`) construit l'image
(`Dockerfile` : build Astro de prod, puis nginx), la pousse sur `ghcr.io/rdeluxe/pbignet-blog`
en `latest` et `sha-<court>`, puis appelle le webhook Dockhand, qui redéploie la stack
`blog-prod` (`deploy/docker-compose.yaml`, variables dans `deploy/.env.example`). L'appel du
webhook est sauté tant que les secrets `DOCKHAND_WEBHOOK_URL` et `DOCKHAND_WEBHOOK_SECRET`
ne sont pas posés. La conf nginx est `deploy/nginx/default.conf`, les 301 de l'ancien Ghost
viennent de `redirects/redirects.map`. `pnpm redirects:check [url]` les vérifie sur la prod
ou sur un conteneur de test. Le build de prod ne garde pas les pages `/ds/` (previews du
design system) ; `pnpm dev` et `pnpm build:cd` les gardent.

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
- `tags`, `serie`, `link` (l'URL de l'ancien blog Ghost, gardée pour de futures redirections).
- facultatifs : `title` (sinon le nom du fichier, sans « FR - » ni « (EN) »), `description`
  (sinon le premier paragraphe), `lang` (sinon « FR - » / « (EN) », sinon les mots du texte).

Le slug est celui de Ghost quand la note a un `link` (les anciennes URL gardent leur
chemin), sinon le titre. Les callouts `> [!note]` deviennent `{% callout %}`, le callout
« importé depuis le blog » disparaît, les wikilinks et les liens vers l'ancien blog pointent
vers l'article migré s'il est dans le même dossier du vault.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
