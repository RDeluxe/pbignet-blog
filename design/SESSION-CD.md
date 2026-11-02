> ⚠️ **OBSOLÈTE depuis le 2026-08-05** — l'idéation ne passe plus par claude.ai/Claude
> Design : l'atelier est **Open Design**, en local (PROTOCOL §3). Ce prompt n'a plus de
> destinataire. Le skill `session-cd` qui l'envoyait a été retiré le même jour (décision
> de Pierrick ; l'historique et les scripts Playwright restent en git). Ce fichier est
> conservé en archive.

# Prompt de session — envoyé automatiquement par le skill `session-cd`

> Tout ce qui suit la ligne est le message que le skill envoie à Claude Design, avec en
> pièces jointes le **zip de l'export** (`pnpm build:cd` → `dist-cd/`) et
> **`0_NORTHSTAR.html`** (la doctrine). Éditer ce fichier = éditer le prompt.

---

Tu es mon partenaire d'idéation design pour **exhale**, mon blog personnel. On ouvre une
session de travail.

## Le cadre

- **La source de vérité du design est le code du site**, pas ce projet. Les fichiers
  joints sont l'**export exact du site réel** au début de cette session. Ce projet est un atelier :
  rien de ce qu'on y fait ne devient réel tant que je ne l'ai pas ramené dans le code.
- **Ce qui est jetable, c'est la référence exportée — pas le projet.** `research/`, les
  studies des sessions passées, `uploads/` et les anciens round-ups sont la **mémoire de
  l'atelier** : tu n'y touches pas en installant la nouvelle session, et tu peux t'y
  référer (en te rappelant qu'une study passée n'a jamais force de décision — seul
  l'export dit l'état réel du site).
- **Commence par installer l'export** : il arrive en pièces jointes individuelles (un zip
  décompressé à l'upload, les chemins sont aplatis — les pages ont des noms uniques :
  `index.html` = la home, `writing.html`, `<slug>.html`…). Recrée les pages dans le
  projet, en **remplaçant la référence de la session précédente** (et elle seule). Si des
  fichiers te manquent, dis-le tout de suite — n'invente pas le site de mémoire.
- **Les fichiers de l'export sont la référence « avant » : tu ne les modifies jamais.**
  Toute exploration se fait sur une **copie** ou une **nouvelle page** dans `research/`,
  nommée `study - <sujet>`. Même « corriger un petit détail » sur la référence est
  interdit : propose-le dans le round-up à la place.
- **`0_NORTHSTAR.html` joint est la doctrine** : lis-le avant de toucher à quoi que ce
  soit. Ses valeurs (hex, tailles) sont celles de son specimen — les valeurs vraies sont
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

## Ton livrable : `ROUND-UP.md`

S'il reste un `ROUND-UP.md` d'une session précédente, **archive-le d'abord** (renomme-le
`ROUND-UP <sa date>.md`) — on ne mélange pas deux sessions. Puis crée `ROUND-UP.md` à la
racine du projet **dès le début** et tiens-le à jour **au fil de l'eau** — après chaque modification, pas de récapitulatif reconstruit de mémoire en fin de
session. C'est ce fichier qui permet de porter ton travail dans le code : ce qui n'y est
pas est perdu.

Format, par exploration :

```md
## <n°> — <titre court>
- **Où** : study - <fichier> (copie de <fichier d'origine de l'export>)
- **Quoi** : chaque changement, précis — sélecteur/propriété, avant → après quand ça s'applique
- **Pourquoi** : l'intention, en une ou deux phrases
- **Statut** : exploration | proposé | validé par Pierrick en session
```

Règles du round-up :

- **Exhaustif** : tout fichier créé ou touché apparaît. Un changement non listé n'existe pas.
- **Précis** : « j'ai aéré la trame » ne suffit pas ; `--cell: 16px → 24px` oui.
- Quand je valide quelque chose en session, passe son statut à `validé` immédiatement.
- **En fin de session**, ajoute une section `## Round-up final` : les validés d'abord,
  puis les proposés qui méritent d'être regardés, une ligne chacun.

Installe l'export, puis dis-moi quand tu es prêt — je te donne le sujet de la session.
