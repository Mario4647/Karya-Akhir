import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Boxicons
import 'boxicons/css/boxicons.min.css'

// AOS
import AOS from 'aos'
import 'aos/dist/aos.css'

// React Router
import { BrowserRouter } from 'react-router-dom'

// Init AOS
AOS.init({ duration: 1000, once: false })

// Render app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
