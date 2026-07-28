# Super Smash Bros - Mini Jeux

Application React de mini-jeux autour de l'univers **Super Smash Bros** : quiz, jeux d'images, etc.

## Stack

- **React 18** avec **Vite**
- **Ant Design** pour les composants d'interface
- **React Router** pour la navigation

## Démarrage

```bash
npm install
npm run dev
```

Ouvre [http://localhost:5190](http://localhost:5190) dans le navigateur.

## Structure du projet

- `src/pages/` — Pages (accueil, mini-jeux, combattants)
- `src/components/` — Composants réutilisables (Layout, Header, grille de personnages…)
- `src/data/` — `personnages.json`, `questions.json`, images des combattants, et
  `images.js` qui résout les URL (originaux, miniatures, variantes de couleur)
- `src/utils/` — Stockage local, comparaison de réponses, génération des manches
- `scripts/` — Outillage hors build (génération des miniatures)

## Mini-jeux

| Jeu | Route | Principe |
| --- | --- | --- |
| Jeu d'images | `/images` | Reconnaître un personnage sur une image modifiée (flou, zoom, pixelisé…) |
| Écris-les tous ! | `/ecris-les-tous` | Quatre variants : **Libre** (86 noms au chrono), **Dans l'ordre** (ordre strict), **Par critère** (15 à 20 consignes tirées parmi 36, 1 à 3 combattants chacune, les critères passés reviennent à la fin — cf. `src/data/ecrisCriteres.js`), **Jauge** (ordre souple, 100 points entamés par l'écart) |
| Quiz | `/quiz` | 1 022 questions, options redistribuées à chaque tirage, historique des questions déjà vues par joueur |
| Trouve l'intrus | `/intrus` | 4, 6 ou 8 combattants partagent un trait sauf un. 18 critères sur 7 catégories (arme, pouvoir, physique, corpulence, rôle, espèce, provenance, historique), curés dans `src/data/intrusEnigmes.js` |
| Le plus ancien | `/le-plus-ancien` | Duels « lequel est apparu en premier ? » en mode survie, difficulté croissante |

## Scripts

- `npm run dev` — Serveur de développement
- `npm run build` — Build de production
- `npm run preview` — Prévisualisation du build
- `npm run miniatures` — Régénère `src/data/characters/miniatures/` (les vignettes de la
  grille de personnages). À relancer après tout ajout ou remplacement d'image dans
  `src/data/characters/`, ou après modification du `zoom` d'un personnage dans
  `personnages.json` — c'est lui qui détermine la résolution utile de chaque vignette.
