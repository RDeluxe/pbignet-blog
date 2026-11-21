---
name: seance-covers
description: Séance de couvertures d'articles : Pierrick règle lui-même chaque cover dans l'éditeur de zones, l'agent prépare l'éditeur avec ses photos puis pose ses réglages tels quels. Utilise cette skill dès qu'il faut poser ou refaire la cover d'un article, ou que Pierrick donne une photo pour un article.
---

# Séance de couvertures

Pierrick est le **designer** de la cover ; l'agent est son **assistant d'atelier** : il installe l'outil, puis recopie. Les valeurs (zones, trame, couleurs, titre, point focal) viennent toutes de la recipe que Pierrick copie dans l'éditeur. L'agent n'en propose aucune, n'en essaie aucune, n'itère sur aucune : un réglage qui lui semble raté, il le signale en une phrase et le pose quand même.

Le travail est mécanique : le secondmate le fait lui-même, ou un crewmate Sonnet. Pas d'Opus.

## 1. Les photos dans le repo

Les photos de Pierrick arrivent dans le vault, `20-29 Areas/23 Evergreen/23.16 Exhale/covers/`, ou collées dans le pane (un chemin `/tmp/herdr-clipboard-images-…`). Range d'abord la photo dans ce dossier du vault, nommée d'après l'article.

Pour chaque article, dans une branche de travail du repo :

- copie la photo en `public/photos/source/<nom>-web.jpg`, réduite à 2000 px de grand côté si elle les dépasse ; c'est une source couleur, jamais un PNG dithéré ;
- donne au `.mdoc` un bloc `cover:` minimal (`kind: pop-color`, `src`, `alt` en une phrase descriptive, `word`), calqué sur un article qui en a déjà un. Une traduction prend le même bloc que son original.

**Fini quand** chaque article de la séance a sa photo dans `public/photos/source/` et son bloc `cover:` : c'est ce bloc qui fait apparaître la photo dans l'éditeur.

## 2. L'éditeur, servi

Lance `pnpm exec astro dev --host 100.64.0.6 --port <port libre>` en tâche de fond depuis le dossier de la branche (jamais 4321, le serveur de Pierrick). Vérifie que `http://100.64.0.6:<port>/ds/hero-pop-color` répond 200. Pas de crit ici : Pierrick doit pouvoir naviguer librement.

Donne à Pierrick l'URL et ce mode d'emploi, tel quel :

1. Appuie sur **T** (ou le bouton T en bas) : le panneau Tweaks s'ouvre, il est replié au chargement.
2. Section **Photo** : clique le bouton de ton article (les trois premiers mots de son slug). La photo se charge avec sa recipe actuelle.
3. **Zones** (« Draw on the cover ») : choisis le type de zone, puis trace au clic. **Photo** garde la zone en photo nette, **Dither** lui donne sa propre trame, **In** / **Out** restreignent ou retirent la sélection de couleur. Entrée (ou un clic sur le premier point) ferme la zone, Retour arrière retire un point, Échap annule.
4. Règle la trame, le titre (texte, X, Y, encre) et le point focal.
5. **Copy recipe**, puis colle le résultat dans le pane. Sur cette adresse en http, le presse-papiers peut refuser : la recipe s'affiche alors dans la boîte « Recipe » du panneau, à copier à la main.

L'éditeur garde son état dans le navigateur : **Reset** revient à la recipe du fichier.

**Fini quand** Pierrick a l'URL qui répond et le mode d'emploi.

## 3. Poser la recipe

La recipe copiée est au format des props Astro (`spot={{ … }}`, `title="…"`, `titleY="…%"`, `focal={{ x, y }}`). Traduis-la dans le bloc `cover:` YAML du `.mdoc`, champ pour champ : `title` devient `word`, `spot`, `focal`, `titleX`, `titleY`, `titleInk`, `height` gardent leur nom. Chaque valeur passe à l'identique, chaque point de zone compris ; une traduction reçoit la même recipe. Les commentaires de fin de recipe ne se recopient pas.

Puis `pnpm build`, et vérifie que la page de l'article rend la cover (le serveur de l'étape 2 suffit). Mesure le contraste du titre et donne-le à Pierrick, sans rien retoucher : c'est lui qui juge.

**Fini quand** la recipe de chaque article est dans son `.mdoc` à l'identique, le build passe, et Pierrick a vu la page de l'article sur le serveur de l'étape 2.

## 4. La fin

Commit, push de la branche, PR vers `main` : le merge reste au go de Pierrick (voir la fiche d'Exhale). Coupe le serveur de l'étape 2 quand Pierrick a fini sa séance.
