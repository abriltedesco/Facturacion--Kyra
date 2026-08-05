import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import Administracion from './pages/Administracion'
import Ingresos from './pages/Ingresos'
import Egresos from './pages/Egresos'
import Emails from './pages/Emails'
import FacturacionMes from './pages/FacturacionMes'
import AjustesPendientes from './pages/AjustesPendientes'
import EntidadDetalle from './pages/EntidadDetalle'
import ClienteDetalle from './pages/ClienteDetalle'

export default function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <div className="app-layout">
        <Sidebar />
        <div className="app-body">
          <main id="main-content" className="main-content" tabIndex="-1">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"                    element={<Dashboard />} />
              <Route path="/administracion"               element={<Administracion />} />
              <Route path="/administracion/entidad/:id"   element={<EntidadDetalle />} />
              <Route path="/administracion/cliente/:id"   element={<ClienteDetalle />} />
              <Route path="/ingresos"                     element={<Ingresos />} />
              <Route path="/egresos"                      element={<Egresos />} />
              <Route path="/emails"                       element={<Emails />} />
              <Route path="/facturacion"                  element={<FacturacionMes />} />
              <Route path="/ajustes"                      element={<AjustesPendientes />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  )
}
