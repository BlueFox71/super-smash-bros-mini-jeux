# Déploiement sur GitHub Pages

## 1. Activer GitHub Pages

1. Ouvre ton dépôt sur **GitHub**.
2. Va dans **Settings** → **Pages** (menu de gauche).
3. Dans **Build and deployment** → **Source**, choisis **GitHub Actions**.

## 2. Déployer

À chaque **push sur `main`** (ou `master`), le workflow se lance et déploie le site.

- L’URL sera : **`https://bluefox71.github.io/super-smash-bros-mini-jeux/`**
- Le premier déploiement peut prendre 1 à 2 minutes.

## 3. Si le nom du dépôt est différent

Si ton dépôt a un autre nom, modifie dans **`vite.config.js`** la variable `repoName` pour qu’elle corresponde au nom du dépôt.

---

# Version bureau (exe), pour Le Grenier

L'app est aussi distribuée en **exécutable Windows autonome**, installé et lancé par
[Le Grenier](https://github.com/BlueFox71/le-grenier). C'est une coquille **Tauri** :
la même app web, servie par le WebView2 du système, donc ~10 Mo de runtime au lieu des
~80 Mo d'un Electron.

## Publier une version

```bash
git tag v1.0.1 && git push --tags
```

Le workflow `release.yml` compile sur `windows-latest` et joint
`Mini-Jeux-Smash-<version>.exe` à la release. Le Grenier compare le tag à la version
installée et propose « Mettre à jour ».

Garder `version` synchronisée dans les trois fichiers, sinon la fenêtre affiche une
version et la release une autre : `package.json`, `src-tauri/Cargo.toml` et
`src-tauri/tauri.conf.json`.

## Construire en local

```bash
npm run desktop:dev     # fenêtre native avec rechargement à chaud
npm run desktop:build   # exe autonome dans src-tauri/target/release/
```

## Deux réglages non évidents

Le web et le bureau ne peuvent pas partager la même configuration, d'où le mode Vite
`desktop` (`npm run build:desktop`), que `tauri.conf.json` appelle en
`beforeBuildCommand` :

| | Web (GitHub Pages) | Bureau (Tauri) |
| --- | --- | --- |
| `base` | `/super-smash-bros-mini-jeux/` | `./` — la coquille sert `dist` à la racine de son protocole |
| Routeur | `BrowserRouter`, URL propres grâce au fallback `404.html` | `HashRouter` — Tauri sert des fichiers, `/combattants` n'y désigne rien |

Bâtir la version bureau avec `npm run build` au lieu de `build:desktop` produit un exe
qui **s'ouvre sur une page blanche** : les 664 images et les scripts sont cherchés sous
`/super-smash-bros-mini-jeux/`, qui n'existe pas dans la coquille.

## Hors ligne

Aucun appel réseau : les scores et les combattants trouvés vivent dans le
`localStorage`. `server.cjs` (classement partagé, port 3001) n'est **pas** embarqué et
n'est pas appelé par l'app.
