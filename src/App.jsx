import { lazy, Suspense } from 'react'
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import { HideHeaderProvider } from './context/HideHeaderContext'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'

// Sur le web, `BrowserRouter` donne des URL propres, à condition qu'un serveur
// réécrive les chemins inconnus vers index.html — ce que fait GitHub Pages via le
// fallback 404. La coquille Tauri, elle, sert des fichiers : demander /combattants
// n'y renvoie rien, donc un rafraîchissement ou un lien profond casserait. Le mode
// bureau passe donc par le fragment, qui ne quitte jamais index.html.
const desktop = import.meta.env.VITE_DESKTOP === true || import.meta.env.VITE_DESKTOP === 'true'
const Router = desktop ? HashRouter : BrowserRouter

const HomePage = lazy(() => import('./pages/HomePage'))
const JeuImagesPage = lazy(() => import('./pages/JeuImagesPage'))
const EcrisLesTousPage = lazy(() => import('./pages/EcrisLesTousPage'))
const QuizPage = lazy(() => import('./pages/QuizPage'))
const QuizHistoriquePage = lazy(() => import('./pages/QuizHistoriquePage'))
const CombattantsPage = lazy(() => import('./pages/CombattantsPage'))

function App() {
  return (
    <Router basename={desktop ? undefined : import.meta.env.BASE_URL}>
      <HideHeaderProvider>
        <Suspense fallback={<PageLoader message="Chargement de la page..." />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="images" element={<JeuImagesPage />} />
              <Route path="ecris-les-tous" element={<EcrisLesTousPage />} />
              <Route path="quiz" element={<QuizPage />} />
              <Route path="quiz/historique" element={<QuizHistoriquePage />} />
              <Route path="combattants" element={<CombattantsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </HideHeaderProvider>
    </Router>
  )
}

export default App
