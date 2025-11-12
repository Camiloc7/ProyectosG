import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tailwind.css'
import App from './App'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import { Toaster } from 'sonner'
import './global.css'
import { HashRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <>
      <Toaster richColors position="top-center" />
      <HashRouter>
        <App />
      </HashRouter>
    </>
  </React.StrictMode>
)
