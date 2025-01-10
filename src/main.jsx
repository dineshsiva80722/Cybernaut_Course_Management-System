import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import Mainpannel from './Components/Mainpannel'
import Studentspannel from './Components/Studentspannel'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/Mainpannel" element={<Mainpannel />} />
        <Route path="/students" element={<Studentspannel />} />
      </Routes>
    </Router>
  </StrictMode>,
)
