import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HideHeaderProvider } from './context/HideHeaderContext'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'

const HomePage = lazy(() => import('./pages/HomePage'))
const JeuImagesPage = lazy(() => import('./pages/JeuImagesPage'))
const EcrisLesTousPage = lazy(() => import('./pages/EcrisLesTousPage'))
const QuizPage = lazy(() => import('./pages/QuizPage'))
const QuizHistoriquePage = lazy(() => import('./pages/QuizHistoriquePage'))
const CombattantsPage = lazy(() => import('./pages/CombattantsPage'))

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}

export default App
