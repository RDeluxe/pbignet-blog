---
name: session-cd
description: Lancer une session d'idéation design avec Claude Design — build l'export lisible du site, le zippe, l'uploade dans le projet CD avec le prompt de session. À invoquer quand Pierrick demande de « lancer une session d'idéation » (avec le design / avec CD).
---

# Lancer une session d'idéation Claude Design

Prépare tout pour que Pierrick n'ait plus qu'à idéationner : l'export du site réel arrive
dans le projet CD avec le prompt de session déjà en place. Contexte : `design/PROTOCOL.md`
(le code est la source de vérité, CD est un atelier jetable).

## Config

- **URL du projet Claude Design « blog » :**
  `https://claude.ai/design/p/674eb009-3864-4a2e-9077-52bb68b68406`
  (l'ancien projet « Pierrick Blog », `e60b80b7-668a-4d7c-a86d-36bb397d9245`, est conservé
  en backup : ne plus jamais y écrire.)

## Étapes — procédure ÉPROUVÉE le 2026-08-05, suivre à la lettre

1. **Build.** `pnpm build:cd` → `dist-cd/`. Échec de build = stop, rapporter l'erreur.
   (`astro.config.mjs` force `format: 'file'` en mode CD_EXPORT : les pages ont des noms
   uniques — `index.html`, `writing.html`, `<slug>.html` — indispensable, voir piège n°2.)

2. **Zip dans `.playwright-mcp/`** (gitignored — et c'est une **racine autorisée** du MCP,
   `/var/folders/...` de `mktemp` est refusé par `browser_file_upload`) :

   ```sh
   ditto -c -k --sequesterRsrc dist-cd .playwright-mcp/exhale-export-$(date +%F).zip
   ```

3. **Ouvrir le projet** à l'URL de config (`browser_navigate`), via le **MCP Playwright**
   — seul navigateur passé Cloudflare. Page de login ou 401 : session (~6 semaines)
   expirée — demander à Pierrick de se reconnecter, stop.

4. **Purger le brouillon.** Le composer **persiste côté serveur** entre les visites : des
   vignettes d'une tentative passée peuvent traîner. Retirer chaque `button[title="Remove"]`
   en boucle (voir le script en §Scripts).

5. **Joindre zip + NORTHSTAR.** Il n'y a **pas** d'`input[type=file]` dans le DOM, et
   `waitForEvent('filechooser')` dans `run_code_unsafe` ne marche **pas** (le MCP
   intercepte l'événement). La séquence qui marche :
   1. cliquer le bouton **« + »** (celui juste avant « Voice input ») → menu ;
   2. cliquer **« Attach file »** → le MCP passe en état modal `[File chooser]` ;
   3. appeler l'outil **`browser_file_upload`** avec le zip et
      `design/doctrine/0_NORTHSTAR.html` (chemins absolus, sous le repo).
   4. attendre ~10 s, puis vérifier les vignettes sur `span[title]` (les noms affichés
      sont tronqués ; l'upload suffixe les doublons : `index-<hash>.html`).

6. **Insérer le prompt** (contenu de `design/SESSION-CD.md` sous la ligne `---`).
   Échapper le texte en JSON dans un fichier JS écrit dans `.playwright-mcp/`, exécuté
   via le paramètre `filename` de `run_code_unsafe` — jamais `type` (chaque `\n` enverrait
   le message), et `require` n'existe pas dans le sandbox.

7. **Vérifier avant d'envoyer** (screenshot — préfixer le chemin de `.playwright-mcp/`,
   sinon il atterrit à la racine du repo) : vignettes présentes, texte complet, bouton
   Send actif. Puis cliquer Send et vérifier que le composer s'est vidé.

8. **Rapporter** à Pierrick : session prête, lien du projet, à lui de jouer. Rappeler
   qu'en fin de session, le retour se fait avec le `ROUND-UP.md` de CD (PROTOCOL §3).

## Scripts (validés le 2026-08-05 — copier tels quels)

**Purge du brouillon + ouverture du chooser** (`run_code_unsafe`) :

```js
async (page) => {
  let removed = 0;
  for (let round = 0; round < 100; round++) {
    const btn = page.locator('button[title="Remove"]').first();
    if (!await btn.isVisible().catch(() => false)) break;
    await btn.click(); removed++; await page.waitForTimeout(150);
  }
  const btns = await page.getByRole('button').all();
  let plusIdx = -1;
  for (let i = 0; i < btns.length; i++) {
    const l = (await btns[i].getAttribute('aria-label')) || (await btns[i].innerText().catch(() => '')) || '';
    if (/voice input/i.test(l)) { plusIdx = i - 1; break; }
  }
  await btns[plusIdx].click();
  await page.waitForTimeout(1000);
  await page.getByText('Attach file', { exact: false }).first().click();
  await page.waitForTimeout(1500);
  return `${removed} vignettes purgées, chooser ouvert`;
}
```

→ puis `browser_file_upload` avec les deux chemins absolus.

**Vérification des vignettes** (`run_code_unsafe`) :

```js
async (page) => {
  const titres = await page.locator('span[title]').evaluateAll(els => els.map(e => e.getAttribute('title')));
  return titres.filter(t => /\.html$/i.test(t || ''));
}
```

**Insertion du prompt** — générer `.playwright-mcp/insert-prompt.js` (texte JSON-échappé,
par ex. via `python3` + `json.dumps`) sur ce modèle, puis `run_code_unsafe` avec
`filename` :

```js
async (page) => {
  const text = /* json.dumps du prompt */;
  const tb = page.getByRole('textbox').first();
  await tb.click();
  await page.keyboard.insertText(text);
  return (await tb.innerText()).length;
}
```

**Envoi** : `page.getByRole('button', { name: /send/i }).first().click()`, puis vérifier
`button[title="Remove"]` = 0 et textbox vide.

## Pièges connus

- **Racines autorisées du MCP** : le repo et `.playwright-mcp/` seulement — pas de
  `mktemp`, pas de scratchpad.
- **Le zip est décompressé à l'upload** en pièces jointes **à plat** (~50 fichiers) :
  d'où `format: 'file'` dans le build — sans lui, toutes les pages s'appellent
  `index.html` et CD ne peut pas les distinguer.
- **Le brouillon du composer persiste côté serveur** : toujours purger avant de joindre.
- `waitForEvent('filechooser')` est consommé par le MCP : passer par l'état modal +
  `browser_file_upload`.
- `ditto -c -k`, jamais `zip` (accents macOS). `keyboard.insertText`, jamais `type`.
- Cloudflare : un `curl` échoue (`cf_clearance` lié à l'empreinte TLS) ; seul le
  navigateur MCP passe.
- Les sorties du MCP (screenshots, snapshots) à chemin relatif atterrissent **à la racine
  du repo** : toujours préfixer `.playwright-mcp/`, et nettoyer les égarés.
