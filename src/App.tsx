import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { useEffect } from 'react'
import { DashboardLayout, PublicLayout, RequireRole } from './components/layout/Layouts'
import { CustomerLayout } from './components/layout/CustomerLayout'
import { Toaster } from '@/components/ui/sonner'
import { StoreProvider } from './features/store'
import { AdminOverview, AdminReports, AdminServices, AdminUsers, AdminVerification } from './pages/admin/Admin'
import CustomerHome from './pages/customer/CustomerHome'
import {
  ProviderAvailability, ProviderBookings, ProviderMessages, ProviderOverview, ProviderPackages,
  ProviderPortfolio, ProviderProfile, ProviderReviews,
} from './pages/provider/Provider'
import { Login, Register } from './pages/public/Auth'
import Landing from './pages/public/Landing'
import Marketplace from './pages/public/Marketplace'
import VendorProfile from './pages/public/VendorProfile'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <BrowserRouter>
          <ScrollManager />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Landing />} />
              <Route path="vendors" element={<Marketplace />} />
              <Route path="vendors/:id" element={<VendorProfile />} />
            </Route>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            <Route path="customer" element={<RequireRole role="customer"><CustomerLayout /></RequireRole>}>
              <Route index element={<CustomerHome />} />
            </Route>
            <Route path="customer/events" element={<Navigate to="/customer#events" replace />} />
            <Route path="customer/bookings" element={<Navigate to="/customer#requests" replace />} />
            <Route path="customer/messages" element={<Navigate to="/customer#messages" replace />} />
            <Route path="customer/budget" element={<Navigate to="/customer#budget" replace />} />

            <Route path="provider" element={<RequireRole role="provider"><DashboardLayout role="provider" /></RequireRole>}>
              <Route index element={<ProviderOverview />} />
              <Route path="bookings" element={<ProviderBookings />} />
              <Route path="messages" element={<ProviderMessages />} />
              <Route path="profile" element={<ProviderProfile />} />
              <Route path="portfolio" element={<ProviderPortfolio />} />
              <Route path="packages" element={<ProviderPackages />} />
              <Route path="availability" element={<ProviderAvailability />} />
              <Route path="reviews" element={<ProviderReviews />} />
            </Route>

            <Route path="admin" element={<RequireRole role="admin"><DashboardLayout role="admin" /></RequireRole>}>
              <Route index element={<AdminOverview />} />
              <Route path="verification" element={<AdminVerification />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </StoreProvider>
    </MotionConfig>
  )
}
