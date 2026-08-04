# Prompt de session — à coller dans Claude Design en début de session

> Tout ce qui suit la ligne s'adresse à Claude Design. Avant de coller : avoir importé
> l'export frais du site (`pnpm build:cd` → `dist-cd/`) dans le projet.

---

Session d'idéation sur **exhale**, mon blog. Lis ceci avant de toucher à quoi que ce soit.

## Le cadre

- **La source de vérité du design est le code du site**, pas ce projet. Ce que tu as sous
  les yeux est un **export de l'état réel du site** au début de cette session. Ce projet
  est un atelier : ce qu'on y fait ne devient réel que si je le ramène dans le code.
- Les fichiers importés de l'export sont la **référence « avant »** : tu ne les modifies
  **jamais**. Toute exploration se fait sur une **copie** ou une **nouvelle page** —
  nommée `study - <sujet>.html` — pour rester comparable à la référence.
- **La doctrine est dans `0_NORTHSTAR.html`** : lis-la en premier. Ses valeurs (hex,
  tailles) sont celles de son specimen, pas celles du site — les valeurs vraies sont
  dans le CSS de l'export.

## Les règles qui ne se discutent pas

- **One ink per page** pour le mobilier et le type (olive = home, sépia = articles ;
  jamais bleu, jamais deux accents). Le ton du **dither photographique** en est exempté :
  il peut être keyé à l'image.
- **Zéro ombre portée, zéro arrondi, aucune barre d'accent à gauche.**
- L'effet hero de la home (la photo traverse les lettres) ne s'adoucit pas.
- Le vocabulaire : **cover** (hero d'article), **recipe** (config par image d'un cover),
  **study** (exploration), **plate** (image du corps), **tile** (boîte interactive),
  **callout** (note épinglée), **hero pop color**.

## Ton livrable : `CHANGES.md`

Crée `CHANGES.md` à la racine du projet **dès le début** et tiens-le à jour **au fil de
l'eau** — après chaque modification, pas de mémoire, pas de récapitulatif reconstruit en
fin de session. C'est ce fichier qui me permet de rapporter ton travail dans le code :
s'il est incomplet, le travail est perdu.

Format, par entrée :

```md
## <n°> — <titre court de l'exploration>
- **Où** : study - <fichier>.html (copie de <fichier d'origine>)
- **Quoi** : <chaque changement, précis : sélecteur/propriété, avant → après quand ça s'applique>
- **Pourquoi** : <l'intention, en une ou deux phrases>
- **Statut** : exploration | proposé | validé par Pierrick en session
```

Règles du bilan :

- **Exhaustif** : tout fichier créé ou touché apparaît. Un changement non listé n'existe pas.
- **Précis** : « j'ai aéré la trame » ne suffit pas ; `--cell: 16px → 24px` oui.
- Si je valide quelque chose en session, passe son statut à `validé` immédiatement.
- Ne modifie jamais la référence importée, même pour « corriger un détail » — note-le
  dans `CHANGES.md` comme proposition à la place.

On commence : attends ma première demande.
