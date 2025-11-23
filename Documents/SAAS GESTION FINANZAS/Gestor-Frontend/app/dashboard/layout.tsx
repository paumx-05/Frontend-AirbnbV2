// Layout del dashboard con sidebar
// Este layout envuelve todas las páginas del dashboard e incluye el sidebar
// Protege las rutas del dashboard con autenticación

'use client'

import Sidebar from '@/components/Sidebar'
import CarteraSelector from '@/components/CarteraSelector'
import { ProtectedRoute } from '@/middleware/routeProtection'
import { CarteraProvider } from '@/contexts/CarteraContext'
import { ConfiguracionProvider } from '@/contexts/ConfiguracionContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <ConfiguracionProvider>
        <CarteraProvider>
          <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-main-content">
              <div className="dashboard-header">
                <CarteraSelector />
              </div>
              {children}
            </div>
          </div>
        </CarteraProvider>
      </ConfiguracionProvider>
    </ProtectedRoute>
  )
}

