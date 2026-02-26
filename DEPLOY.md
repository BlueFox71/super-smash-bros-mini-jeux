# Déploiement sur GitHub Pages

## 1. Activer GitHub Pages

1. Ouvre ton dépôt sur **GitHub**.
2. Va dans **Settings** → **Pages** (menu de gauche).
3. Dans **Build and deployment** → **Source**, choisis **GitHub Actions**.

## 2. Déployer

À chaque **push sur `main`** (ou `master`), le workflow se lance et déploie le site.

- L’URL sera : **`https://<ton-username>.github.io/supersmash-bros-games/`**
- Le premier déploiement peut prendre 1 à 2 minutes.

## 3. Si le nom du dépôt est différent

Si ton dépôt ne s’appelle pas exactement `supersmash-bros-games`, modifie dans **`vite.config.js`** la variable `repoName` pour qu’elle corresponde au nom du dépôt.
