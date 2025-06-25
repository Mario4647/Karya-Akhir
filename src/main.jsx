import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Boxicons
import 'boxicons/css/boxicons.min.css'

// AOS
import AOS from 'aos'
import 'aos/dist/aos.css'

AOS.init({duration: 1000, once: false});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
