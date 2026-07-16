import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import Administracion from './pages/Administracion'
import Ingresos from './pages/Ingresos'
import Egresos from './pages/Egresos'
import Emails from './pages/Emails'

export default function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <div className="app-layout">
        <Sidebar />
        <div className="app-body">
          <main id="main-content" className="main-content" tabIndex="-1">
            <Routes>
              <Route path="/" element={<Navigate to="/administracion" replace />} />
              <Route path="/administracion" element={<Administracion />} />
              <Route path="/ingresos" element={<Ingresos />} />
              <Route path="/egresos" element={<Egresos />} />
              <Route path="/emails" element={<Emails />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  )
}
