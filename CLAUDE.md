# CLAUDE.md

## Le Grenier — rapport de mise à jour

Ce projet est distribué par **Le Grenier** (launcher `BlueFox71/le-grenier`). La section
« Actualités » de sa fiche affiche les **notes des releases GitHub** de ce dépôt : une
release sans notes n'y apparaît pas.

**À chaque montée de version, réécris `RELEASE_NOTES.md`** à la racine, et fais-le
valider par l'utilisateur **avant de pousser le tag** :

- première ligne : `<!-- version: X.Y.Z -->`, égale à la nouvelle `version` de
  `package.json` ;
- puis le rapport en Markdown, **écrit pour le joueur** : ce qui change pour lui, pas le
  détail technique ;
- sections `### Nouveautés`, `### Améliorations`, `### Corrections` — seulement celles
  qui ont du contenu ;
- il couvre tout ce qui a changé depuis la release précédente
  (`git log v<précédente>..HEAD`).

Le fichier est committé avec le bump de version. Au push du tag, le workflow
`.github/workflows/release.yml` publie l'exe puis lance `scripts/publish-notes.mjs`, qui
pose le rapport comme notes de la release. Si le marqueur ne correspond pas à la version,
cette étape **échoue volontairement** : corriger `RELEASE_NOTES.md`, puis relancer à la
main `GH_TOKEN=<jeton écriture> node scripts/publish-notes.mjs`.
