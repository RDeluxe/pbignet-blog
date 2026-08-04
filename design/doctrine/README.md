# Doctrine design — copies canoniques

Rapatriées du projet Claude Design le **2026-08-04**, au pivot « le code est la source de
vérité » (voir `../PROTOCOL.md`). **C'est ici qu'on les édite** ; les copies qui partent
dans un export de session CD sont des copies de travail, jetables avec la session.

| Fichier | Rôle |
| --- | --- |
| `0_NORTHSTAR.html` | La **doctrine** : north star, brand & voice, règle couleur (« one ink per page »), type, mobilier d'impression, anatomie de page, guardrails. Ses valeurs hex/tailles sont celles de son specimen — ne **jamais** les prendre pour celles du site. |
| `Design Notes.md` | Le **journal des décisions de design datées** (audit des boîtes, couleur papier…). Historique : les nouvelles décisions se journalisent désormais en commits du repo. |

**Les valeurs de production vivent dans le code** : `src/styles/tokens/*.css` et le CSS
scopé des composants. Il n'y a plus d'autre source.

> Le rendu de `0_NORTHSTAR.html` ouvert d'ici est dégradé (il référence `assets/` du
> projet CD : photos, scripts, `paper.css`). Ce n'est pas un bug : on le lit comme un
> document de doctrine, pas comme une page à afficher.
