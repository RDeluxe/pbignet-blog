---
name: session-cd
description: Lancer une session d'idéation design avec Claude Design — build l'export lisible du site, le zippe, l'uploade dans le projet CD avec le prompt de session. À invoquer quand Pierrick demande de « lancer une session d'idéation » (avec le design / avec CD).
---

# Lancer une session d'idéation Claude Design

Prépare tout pour que Pierrick n'ait plus qu'à idéationner : l'export du site réel arrive
dans le projet CD avec le prompt de session déjà en place. Contexte : `design/PROTOCOL.md`
(le code est la source de vérité, CD est un atelier jetable).

## Config

- **URL du projet Claude Design : `<À RENSEIGNER — projet « blog »>`**
  (l'ancien projet « Pierrick Blog », `e60b80b7-668a-4d7c-a86d-36bb397d9245`, est conservé
  en backup : ne plus jamais y écrire.)

## Étapes

1. **Config.** Si l'URL ci-dessus est encore le placeholder, demander l'URL du projet
   « blog » à Pierrick et **mettre à jour ce fichier** avant de continuer.

2. **Build.** `pnpm build:cd` → `dist-cd/`. Échec de build = stop, rapporter l'erreur.

3. **Zip.** Dans un dossier temporaire (jamais dans l'arbre du repo) :

   ```sh
   TMP=$(mktemp -d)
   ditto -c -k --sequesterRsrc dist-cd "$TMP/exhale-export-$(date +%F).zip"
   ```

   `ditto`, pas `zip` : l'UTF-8 des noms accentués casse avec les outils zip classiques
   sur macOS.

4. **Ouvrir le projet** à l'URL de config, via le **MCP Playwright** — seul navigateur
   passé Cloudflare (Pierrick y est connecté à la main). Si la page atterrit sur un
   login ou un 401 : la session (~6 semaines) est expirée — demander à Pierrick de se
   reconnecter dans le navigateur MCP, et stop.

5. **Joindre les fichiers** au composer : le zip **et** `design/doctrine/0_NORTHSTAR.html`
   (la doctrine accompagne chaque session). Utiliser `setInputFiles` sur l'`<input type=file>`
   directement — pas de danse UI sur le bouton. Attendre que les vignettes d'upload
   apparaissent avant l'étape suivante.

6. **Insérer le prompt** : le contenu de `design/SESSION-CD.md` **sous la ligne `---`**.
   Impérativement `keyboard.insertText` — jamais `type` : chaque `\n` déclencherait
   l'envoi et le message partirait en morceaux. Dans `run_code_unsafe`, `require`
   n'existe pas : passer le texte en littéral.

7. **Vérifier avant d'envoyer** (snapshot) : les deux pièces jointes sont là, le texte
   est complet. Puis envoyer.

8. **Rapporter** à Pierrick : session prête, lien du projet, à lui de jouer. Lui rappeler
   qu'en fin de session, le retour se fait avec le `ROUND-UP.md` de CD (PROTOCOL §3).

## Pièges connus

- `ditto -c -k`, jamais `zip` (accents macOS).
- `keyboard.insertText`, jamais `type` (les `\n` envoient).
- Cloudflare : un `curl` avec cookies échoue (`cf_clearance` lié à l'empreinte TLS) ;
  seul le navigateur MCP passe.
- Ne pas envoyer tant que l'upload du zip n'est pas terminé (vignette visible).
