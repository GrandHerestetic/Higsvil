import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { Router } from './routes/index.tsx'
import { Layout } from './layout/index.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

// Игнорируем ошибки MediaSession API
window.addEventListener('error', (event) => {
  if (event.message.includes('MediaSession') || event.message.includes('enterpictureinpicture')) {
    event.preventDefault()
    console.warn('MediaSession error ignored:', event.message)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Router />
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
