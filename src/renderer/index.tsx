import ReactDom from 'react-dom/client'
import React from 'react'

import { AppRoutes } from './routes'
import { ThemeProvider } from './contexts/ThemeContext'
import './globals.css'

console.log('index.tsx: Start')

const appRoot = document.getElementById('root') as HTMLElement

if (appRoot) {
  console.log('index.tsx: Root found, rendering AppRoutes')
  ReactDom.createRoot(appRoot).render(
    <React.StrictMode>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </React.StrictMode>
  )
} else {
  console.error('index.tsx: Root element not found')
}
