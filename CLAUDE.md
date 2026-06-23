# dot·paper — CLAUDE.md

## SOURCE DE VÉRITÉ DESIGN : `design/claude-design/Pierrick Blog/`

**LE document de référence : `dot·paper - NORTHSTAR.html`** — le northstar specimen, « the single source of truth for dot·paper ». Il consolide : north star · brand & voice · **color** (base fixe + accent inks, règle « one ink per page ») · type · print furniture · components · page anatomy · inspiration motifs · build conventions · guardrails. **Le lire en premier**, avant toute décision de design.

Avant de toucher à quoi que ce soit (composant, style, layout, animation), chercher la réponse dans ce dossier. Ne jamais improviser une décision de design.

```
design/
  claude-design/Pierrick Blog/   ← MIROIR 100% Claude Design (écrasé à chaque sync, ne rien y éditer à la main)
    dot·paper - NORTHSTAR.html   ← ★ SOURCE DE VÉRITÉ : northstar specimen, à lire en premier
    Home.html                    ← direction hero lockée, HTML de référence complet (ex-« RETRO Home v2/v3 », consolidés côté Claude Design le 2026-06-23)
    assets/paper.css             ← tokens + composants (SOURCE des valeurs concrètes : couleurs, accent…)
    assets/texture.js            ← Grain + Topo originaux
    assets/dither.js · assets/diagram.js · assets/image-slot.js
    01 Field Notes.html · 02 Topographic.html · 03 Spec Sheet.html · 04 Riso.html  ← directions couleur
    Pâte graphique*.html         ← exports/banc d'essai (LinkedIn, tokens, sections)
    Design Notes.md              ← refs d'inspiration, next pages (⚠ certaines notes périmées, ex. « blue accent »)
    uploads/ · screenshots/      ← photos de réf + captures des explorations
  impeccable/                    ← artefacts Impeccable (hors miroir, jamais écrasés par le sync)
    RETRO Home v2_impeccable.html
```

**Règle** : si une décision de design n'est pas dans ce dossier, elle n'a pas été validée. Proposer avant d'implémenter. En cas de conflit entre docs : **NORTHSTAR > tokens (`paper.css`) > Design Notes.md** ; un narratif périmé ne fait jamais foi contre les tokens.

### Sync depuis Claude Design (piloté via MCP Playwright)

Source distante : **claude.ai/design**, projet `Pierrick Blog`
(`https://claude.ai/design/p/e60b80b7-668a-4d7c-a86d-36bb397d9245`).

> **Pourquoi pas un script standalone ?** L'export est pourtant un simple GET REST
> (`https://claude.ai/design/v1/design/projects/<id>/download` → `.zip`), mais
> **Cloudflare bloque tout login depuis un navigateur lancé par Playwright** (détection bot,
> challenge infini). Seul le **navigateur du MCP Playwright** — où Pierrick s'est connecté à la
> main — passe Cloudflare. On pilote donc le sync via le MCP, à la demande.

Procédure (Claude la déroule quand Pierrick demande un sync) :

1. **`browser_navigate`** vers l'URL du projet. Si redirection vers `/login` → demander à
   Pierrick de se connecter dans la fenêtre MCP (profil persistant : la session tient ensuite).
2. **Export** : cliquer `Share` (barre du haut) → onglet **Export** → **Project archive `.zip`**
   → **Download**. Le zip atterrit dans `.playwright-mcp/Pierrick-Blog.zip`.
   ⚠️ Pas dans le menu projet (Rename/Duplicate/Delete) ni via `DesignSync` (pas d'export zip).
3. **Miroir** (le dossier est 100% distant → miroir pur, pas d'`--exclude`). `ditto` gère l'UTF-8
   des noms accentués que `unzip` casse sur macOS :
   ```sh
   STAGE="$(mktemp -d)"
   ditto -x -k ".playwright-mcp/Pierrick-Blog.zip" "$STAGE"
   rsync -a --delete "$STAGE/" "design/claude-design/Pierrick Blog/"
   rm -rf "$STAGE" .playwright-mcp/Pierrick-Blog.zip
   ```
   `--delete` purge ce qui a disparu côté distant (ex. l'ancien `_ds/`). Les artefacts hors
   miroir (`design/impeccable/…`) ne sont pas touchés.

### Captures de vérification : toujours dans `.screenshots/`

Les screenshots pris pour valider un rendu (vérif Astro, debug visuel, etc.) sont **jetables** et
vont **exclusivement dans `.screenshots/`** à la racine du repo (dossier gitignored). Jamais à la
racine ni ailleurs dans l'arbre. Ne pas laisser de `homepage-*.png` & co traîner dans le projet.

---

## Stack technique

- **Framework** : Astro 6 + Svelte 5
- **CSS** : `paper.css` global (tokens + textures) + styles scopés par composant + UnoCSS pour les utilitaires
- **Fonts** : self-hosted via `@fontsource` (Anton, Space Mono, Archivo Variable, Newsreader Variable)
- **Content** : Astro Content Collections (`src/content.config.ts`) — `writing` + `guides`, format Markdoc (`.md` / `.mdoc`)
- **Photos** : PNGs dithérés dans `public/photos/` — **ne jamais recompresser ni optimiser** les images dithérées, l'effet serait détruit

## Direction design lockée

Détails complets dans **`NORTHSTAR.html`** (north star, color, type, page anatomy, guardrails). En une phrase : index personnel sur papier chaud, hero `Home.html` (ex-RETRO Home v2 ; la photo **traverse les lettres**, `background-clip: text`), dithering Bayer riso, un seul accent par page, mobilier d'impression (repères, code-barre, coords), typo Anton · Archivo · Space Mono · Newsreader.

**Valeurs concrètes (couleurs, tokens) : ne pas les recopier — lire la source.** `NORTHSTAR.html` (section Color) pour la doctrine ; `assets/paper.css` (`:root`) + le `<style>` des pages pour les hex exacts.

> Au 2026-06-23 l'accent home est **olive `#3d491d`** (l'ancien bleu `#2230c2` est abandonné). `Design Notes.md` dit encore « blue accent » → périmé, les tokens font foi.

## Anti-patterns à éviter

Voir `PRODUCT.md` pour la liste complète. En résumé :
- Pas de fond crème/beige sans texture matière
- Pas de compteurs de stats ni de texte en dégradé
- Pas d'eyebrow uppercase tracké au-dessus de **chaque** section (`shead-meta` max 3×/page)
- Pas d'em-dashes en excès dans le copy (>3 par page = signal AI)
- Ne jamais softener l'effet hero (c'est une décision engagée)

## Critique Impeccable

`.impeccable/critique/2026-06-05T16-51-08Z__source-data-claude-design-pierrick-blog.md` — score 27/40, P1/P2 issues documentés, consulter avant d'itérer sur le design.

## Pages à construire (prochaines étapes)

Writing index · Article (long-form) · Photos (grid + swatches) · Now · Setup
