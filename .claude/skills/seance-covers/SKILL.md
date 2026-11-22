---
name: seance-covers
description: Séance de couvertures d'articles : Pierrick règle lui-même chaque cover dans l'éditeur de zones, l'agent prépare l'éditeur avec ses photos puis pose ses réglages tels quels. Utilise cette skill dès qu'il faut poser ou refaire la cover d'un article, ou que Pierrick donne une photo pour un article.
---

# Séance de couvertures

Pierrick est le **designer** de la cover ; l'agent est son **assistant d'atelier** : il installe l'outil, puis recopie. Les valeurs (zones, trame, couleurs, titre, point focal) viennent toutes de la recipe que Pierrick copie dans l'éditeur. L'agent n'en propose aucune, n'en essaie aucune, n'itère sur aucune : un réglage qui lui semble raté, il le signale en une phrase et le pose quand même.

Le travail est mécanique : le secondmate le fait lui-même, ou un crewmate Sonnet. Pas d'Opus.

## 1. Les photos dans le repo

Les photos ne passent plus par le vault : le dossier `23.16 Exhale/covers/` n'existe plus (règle de Pierrick, 22 novembre 2026). Pierrick colle la photo dans le pane, qui la donne sous un chemin `/tmp/herdr-clipboard-images-…`, et elle va **directement** dans le repo. Une source de travail que Pierrick veut garder (le fichier original, plus grand) va sur Proton Drive, dans `20-29_Areas/23_Evergreen/23.16_Exhale/`, jamais dans le vault.

Pour chaque article, dans une branche de travail du repo :

- copie la photo collée en `public/photos/source/<nom>-web.jpg`, `<nom>` d'après l'article, réduite à 2000 px de grand côté si elle les dépasse ; c'est une source couleur, jamais un PNG dithéré ;
- donne au `.mdoc` un bloc `cover:` minimal (`kind: pop-color`, `src`, `alt` en une phrase descriptive, `word`), calqué sur un article qui en a déjà un. Une traduction prend le même bloc que son original.

**Fini quand** chaque article de la séance a sa photo dans `public/photos/source/` et son bloc `cover:` : c'est ce bloc qui fait apparaître la photo dans l'éditeur.

## 2. L'éditeur, servi

Lance `pnpm exec astro dev --host 100.64.0.6 --port <port libre>` en tâche de fond depuis le dossier de la branche (jamais 4321, le serveur de Pierrick). Vérifie que `http://100.64.0.6:<port>/ds/hero-pop-color` répond 200. Pas de crit ici : Pierrick doit pouvoir naviguer librement.

Donne à Pierrick l'URL et ce mode d'emploi, tel quel :

1. Appuie sur **T** (ou le bouton T en bas) : le panneau Tweaks s'ouvre, il est replié au chargement.
2. Section **Photo** : clique le bouton de ton article (les trois premiers mots de son slug). La photo se charge avec sa recipe actuelle.
3. **Zones**, deux façons d'en ajouter une :
   - **« + Nouvelle zone »** : clique sur la photo pour poser ses points. Entrée (ou un clic sur le premier point) ferme la zone, Retour arrière retire le dernier point posé, Échap annule.
   - **« Baguette »** : clique sur une couleur de la photo, la zone de cette couleur s'ajoute. La **Tolérance** règle jusqu'où elle s'étend : la bouger refait la dernière zone, tant que tu ne l'as pas retouchée. Clique encore pour ajouter d'autres zones ; Échap termine.

   Chaque zone entre dans la **liste des zones**, où sa ligne a :
   - une case qui active ou désactive la zone (une zone désactivée reste dans la liste, hors du rendu et de la recipe) ;
   - un menu pour son type : **Photo** garde la zone en photo nette, **Dither** lui donne sa propre trame (réglable sous la ligne), **In** / **Out** restreignent ou retirent la sélection de couleur ;
   - **Arrondi** : le contour devient une courbe qui passe par les mêmes points, au lieu de segments droits ; un second clic le remet en droit ;
   - **Éditer** : glisse un point pour le déplacer, clique sur un bord pour y ajouter un point, double-clique sur un point pour le retirer (une zone garde au moins 3 points) ; OK ou Échap termine ;
   - **×** pour supprimer la zone.
4. Règle la trame, le titre (texte, X, Y, encre) et le point focal. **Couleurs libres** : sous les tons tout faits du fond, et sous ceux de chaque zone Dither, **Encre** et **Papier** prennent n'importe quelle couleur. Un ton tout fait recliqué reprend la main.
5. **Aperçu mobile** (en bas du panneau) ouvre à gauche la cover à 390 px de large, comme sur un téléphone, avec les vrais réglages du site en étroit. Règle **Title Y mobile** en la regardant ; l'aperçu suit chaque réglage. Il ne montre que les photos du repo, pas un fichier déposé.
6. **Enregistrer** (en bas du panneau) : choisis l'article, coche sa traduction s'il en a une, et clique Enregistrer. La recipe s'écrit dans son `.mdoc`, sans copier-coller ; la page se recharge sur ta photo et dit quels fichiers ont été écrits. Une photo déposée qui n'est pas dans `public/photos/source/` ne s'enregistre pas : l'éditeur dit où la copier. **Copy recipe** reste en secours : colle alors le résultat dans le pane (sur cette adresse en http, le presse-papiers peut refuser ; la recipe s'affiche dans la boîte « Recipe » du panneau, à copier à la main).

L'éditeur garde un **brouillon par photo** dans le navigateur, écrit à chaque réglage : rechoisir la photo, même après un rechargement de la page, reprend le brouillon plutôt que le fichier. **Reset** jette le brouillon de la photo et revient à la recipe du fichier.

**Pendant que Pierrick travaille dans l'éditeur, aucune édition de fichier** dans la branche servie (ni le composant, ni un `.mdoc`, ni la skill) : le serveur rechargerait la page sous ses mains. On attend sa recipe, ou son feu vert. Son **Enregistrer** n'est pas une exception à cette règle : c'est lui qui écrit.

**Fini quand** Pierrick a l'URL qui répond et le mode d'emploi.

## 3. Poser la recipe

Si Pierrick a utilisé **Enregistrer**, la recipe est déjà dans le `.mdoc` (et dans celui de sa traduction s'il l'a cochée). Ne la retouche pas : passe au build. Sinon :

La recipe copiée est au format des props Astro (`spot={{ … }}`, `title="…"`, `titleY="…%"`, `titleYMobile="…%"`, `focal={{ x, y }}`). Traduis-la dans le bloc `cover:` YAML du `.mdoc`, champ pour champ : `title` devient `word`, `spot`, `focal`, `titleX`, `titleY`, `titleYMobile`, `titleInk`, `height` gardent leur nom. Chaque valeur passe à l'identique, chaque point de zone compris ; une traduction reçoit la même recipe. Les commentaires de fin de recipe ne se recopient pas.

Puis `pnpm build`, et vérifie que la page de l'article rend la cover (le serveur de l'étape 2 suffit). Mesure le contraste du titre et donne-le à Pierrick, sans rien retoucher : c'est lui qui juge.

**Fini quand** la recipe de chaque article est dans son `.mdoc` à l'identique, le build passe, et Pierrick a vu la page de l'article sur le serveur de l'étape 2.

## 4. La fin

Commit, push de la branche, PR vers `main` : le merge reste au go de Pierrick (voir la fiche d'Exhale). Coupe le serveur de l'étape 2 quand Pierrick a fini sa séance.
