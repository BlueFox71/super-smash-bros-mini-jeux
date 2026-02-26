import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import frFR from 'antd/locale/fr_FR'
import App from './App'
import './index.css'

const theme = {
  token: {
    colorPrimary: '#e60012',
    colorPrimaryHover: '#ff1a2e',
    colorPrimaryActive: '#cc0010',
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={frFR} theme={theme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
