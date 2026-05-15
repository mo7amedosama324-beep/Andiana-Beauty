import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import PaletteCustomizer from './PaletteCustomizer'
import { AppProvider, useApp } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SkeletonPage } from './components/Skeleton'

const HomePage = lazy(() => import('./pages/HomePage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

function PageRoute({ children }) {
  return <ErrorBoundary><Suspense fallback={<SkeletonPage />}>{children}</Suspense></ErrorBoundary>
}

function AppRoutes() {
  const { isAr, t, authUser } = useApp()
  return <><div className="palette-overlay" aria-hidden /><PaletteCustomizer isAr={isAr} t={t} /><Routes><Route path="/" element={<PageRoute><HomePage /></PageRoute>} /><Route path="/shop" element={<PageRoute><ShopPage /></PageRoute>} /><Route path="/cart" element={<PageRoute><CartPage /></PageRoute>} /><Route path="/about" element={<PageRoute><AboutPage /></PageRoute>} /><Route path="/admin-dashboard" element={authUser?.is_staff ? <PageRoute><AdminPage /></PageRoute> : <Navigate to="/login" replace />} /><Route path="/login" element={<PageRoute><LoginPage /></PageRoute>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></>
}

export default function App() {
  return <AppProvider><ToastProvider><AppRoutes /></ToastProvider></AppProvider>
}
