import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme as antdTheme } from 'antd'
import frFR from 'antd/locale/fr_FR'
import App from './App'
import './index.css'

// L'algorithme sombre d'antd, sans quoi tous les composants sortent leurs
// couleurs de thème clair (un `Title` hors carte s'affichait en gris foncé sur
// fond noir) et chaque page devait rattraper le coup à coups de `!important`.
const theme = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: '#e60012',
    colorPrimaryHover: '#ff1a2e',
    colorPrimaryActive: '#cc0010',
    colorBgBase: '#0d0d0d',
    borderRadius: 8,
  },
}

// Les méthodes statiques (`Modal.confirm`, `message.*`) montent leur propre
// racine React, en dehors du ConfigProvider : sans ça, la popup de confirmation
// d'abandon et les toasts s'affichaient en thème clair au milieu d'un site noir.
ConfigProvider.config({
  holderRender: (children) => (
    <ConfigProvider locale={frFR} theme={theme}>
      {children}
    </ConfigProvider>
  ),
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={frFR} theme={theme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
