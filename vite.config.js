import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pour GitHub Pages : https://<user>.github.io/<repo>/
const repoName = 'super-smash-bros-mini-jeux'

// Deux cibles, deux bases incompatibles :
//  • GitHub Pages sert le site sous /<repo>/, d'où une base absolue ;
//  • la coquille Tauri sert `dist` à la racine de son protocole, où /<repo>/… ne
//    désigne rien — les 664 images ne se chargeraient pas.
// D'où le mode `desktop` (`vite build --mode desktop`), qui bascule sur des chemins
// relatifs et fait passer le routeur en HashRouter (cf. src/App.jsx).
export default defineConfig(({ mode }) => {
  const desktop = mode === 'desktop'
  return {
    plugins: [react()],
    base: desktop ? './' : process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/',
    define: {
      'import.meta.env.VITE_DESKTOP': JSON.stringify(desktop),
    },
    server: {
      port: 5190,
    },
    preview: {
      port: 5190,
    },
  }
})
