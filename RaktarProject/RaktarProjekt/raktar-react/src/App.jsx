import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AlertProvider } from './context/AlertContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Tarolok from './pages/Tarolok'
import Berleseim from './pages/Berleseim'
import Profil from './pages/Profil'
import Admin from './pages/Admin'
import Aszf from './pages/Aszf'
import Adatvedelem from './pages/Adatvedelem'
import Kapcsolat from './pages/Kapcsolat'
import Fizetes from './pages/Fizetes'
import Dashboard from './pages/Dashboard'

function PrivateRoute({ children }) {
  const { loggedIn } = useAuth()
  return loggedIn ? children : <Navigate to="/bejelentkezes" replace />
}

function AdminRoute({ children }) {
  const { loggedIn, userRole } = useAuth()
  if (!loggedIn) return <Navigate to="/bejelentkezes" replace />
  if (userRole !== 'admin') return <Navigate to="/" replace />
  return children
}

function GuestRoute({ children }) {
  const { loggedIn } = useAuth()
  return loggedIn ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AlertProvider>
          <AppLayout />
        </AlertProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bejelentkezes" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/tarolok" element={<PrivateRoute><Tarolok /></PrivateRoute>} />
          <Route path="/fizetes" element={<PrivateRoute><Fizetes /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/berleseim" element={<PrivateRoute><Berleseim /></PrivateRoute>} />
          <Route path="/profil" element={<PrivateRoute><Profil /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/aszf" element={<Aszf />} />
          <Route path="/adatvedelem" element={<Adatvedelem />} />
          <Route path="/kapcsolat" element={<Kapcsolat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </>
  )
}
