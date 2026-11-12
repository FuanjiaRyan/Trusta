import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider } from './lib/store'
import { AdminDashboard } from './pages/AdminDashboard'
import { ArtisanDashboard } from './pages/ArtisanDashboard'
import { ArtisanProfilePage } from './pages/ArtisanProfile'
import { CustomerDashboard } from './pages/CustomerDashboard'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="customer" element={<CustomerDashboard />} />
            <Route path="artisan" element={<ArtisanDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="artisans/:id" element={<ArtisanProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
