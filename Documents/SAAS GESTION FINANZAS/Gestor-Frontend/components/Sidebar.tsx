'use client'

// Componente Sidebar - Menú vertical lateral con soporte mobile
// Muestra todas las opciones de la aplicación con navegación
// En móvil se comporta como un menú hamburguesa

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Lista de meses del año
const meses = [
  { nombre: 'Enero', valor: 'enero' },
  { nombre: 'Febrero', valor: 'febrero' },
  { nombre: 'Marzo', valor: 'marzo' },
  { nombre: 'Abril', valor: 'abril' },
  { nombre: 'Mayo', valor: 'mayo' },
  { nombre: 'Junio', valor: 'junio' },
  { nombre: 'Julio', valor: 'julio' },
  { nombre: 'Agosto', valor: 'agosto' },
  { nombre: 'Septiembre', valor: 'septiembre' },
  { nombre: 'Octubre', valor: 'octubre' },
  { nombre: 'Noviembre', valor: 'noviembre' },
  { nombre: 'Diciembre', valor: 'diciembre' },
]

// Función para obtener el mes actual en formato para URL
function getMesActual(): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]
  const mesActual = new Date().getMonth()
  return meses[mesActual]
}

export default function Sidebar() {
  const pathname = usePathname()
  const mesActual = getMesActual()
  
  // Verificar si estamos en alguna página de gastos o ingresos
  const isGastosRoute = pathname?.includes('/gastos/')
  const isIngresosRoute = pathname?.includes('/ingresos/')
  
  // Páginas que requieren sidebar colapsado (solo iconos)
  const paginasColapsadas = [
    '/dashboard/perfil',
    '/dashboard/amigos',
    '/dashboard/mensajes',
    '/dashboard/notificaciones',
    '/dashboard/opciones'
  ]
  const shouldCollapse = paginasColapsadas.some(ruta => pathname?.startsWith(ruta))
  
  // Estado para controlar si el sidebar está colapsado
  const [isCollapsed, setIsCollapsed] = useState(shouldCollapse)
  
  // Estado para controlar si el menú móvil está abierto
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  // Actualizar estado cuando cambia la ruta
  useEffect(() => {
    setIsCollapsed(shouldCollapse)
  }, [pathname, shouldCollapse])
  
  // Cerrar menú móvil cuando cambia la ruta
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])
  
  // Detectar si es móvil
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Función para toggle del sidebar
  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen)
    } else {
      setIsCollapsed(!isCollapsed)
    }
  }
  
  // Estado para controlar si el desplegable de gastos está abierto
  // Se abre automáticamente si estamos en una ruta de gastos
  const [gastosOpen, setGastosOpen] = useState(isGastosRoute)

  // Función para alternar el desplegable de gastos mensuales
  const toggleGastos = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setGastosOpen(!gastosOpen)
  }
  
  // Estado para controlar si el desplegable de ingresos está abierto
  // Se abre automáticamente si estamos en una ruta de ingresos
  const [ingresosOpen, setIngresosOpen] = useState(isIngresosRoute)

  // Función para alternar el desplegable de ingresos mensuales
  const toggleIngresos = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIngresosOpen(!ingresosOpen)
  }

  return (
    <>
      {/* Botón hamburguesa para móvil */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="mobile-menu-toggle"
          aria-label="Abrir menú"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isMobileOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      )}

      {/* Overlay para cerrar el menú en móvil */}
      {isMobile && isMobileOpen && (
        <div 
          className="sidebar-overlay active"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile && isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <h2 className="sidebar-title">Gestor Finanzas</h2>}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="sidebar-toggle-btn"
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isCollapsed ? (
                <polyline points="9 18 15 12 9 6"></polyline>
              ) : (
                <polyline points="15 18 9 12 15 6"></polyline>
              )}
            </svg>
          </button>
        )}
        {isMobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="sidebar-toggle-btn"
            title="Cerrar menú"
            aria-label="Cerrar menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {/* Opción principal: Dashboard */}
        <Link 
          href="/dashboard" 
          className={`sidebar-item ${pathname === '/dashboard' ? 'active' : ''}`}
          title="Dashboard"
        >
          <span className="sidebar-icon">🏠</span>
          {!isCollapsed && <span className="sidebar-text">Dashboard</span>}
        </Link>

        {/* Opción de Gastos Mensuales con desplegable */}
        <div className="sidebar-section">
          <div className={`sidebar-item sidebar-item-toggle ${isGastosRoute ? 'active' : ''}`}>
            <Link 
              href={`/dashboard/gastos/${mesActual}`}
              className="sidebar-item-link"
              title={isCollapsed ? 'Gastos Mensuales' : `Ir a Gastos de ${meses.find(m => m.valor === mesActual)?.nombre || mesActual}`}
            >
              <span className="sidebar-icon">💰</span>
              {!isCollapsed && <span className="sidebar-text">Gastos Mensuales</span>}
            </Link>
            {!isCollapsed && (
              <button
                onClick={toggleGastos}
                className="sidebar-arrow-button"
                title="Mostrar/Ocultar meses"
                aria-label="Mostrar/Ocultar meses"
              >
                <span className={`sidebar-arrow ${gastosOpen ? 'open' : ''}`}>
                  ▼
                </span>
              </button>
            )}
          </div>

          {/* Lista desplegable de meses */}
          {!isCollapsed && gastosOpen && (
            <div className="sidebar-dropdown">
              {meses.map((mes) => {
                const mesPath = `/dashboard/gastos/${mes.valor}`
                const isActive = pathname === mesPath
                
                return (
                  <Link
                    key={mes.valor}
                    href={mesPath}
                    className={`sidebar-subitem ${isActive ? 'active' : ''}`}
                  >
                    <span className="sidebar-subitem-text">{mes.nombre}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Opción de Ingresos Mensuales con desplegable */}
        <div className="sidebar-section">
          <div className={`sidebar-item sidebar-item-toggle ${isIngresosRoute ? 'active' : ''}`}>
            <Link 
              href={`/dashboard/ingresos/${mesActual}`}
              className="sidebar-item-link"
              title={isCollapsed ? 'Ingresos Mensuales' : `Ir a Ingresos de ${meses.find(m => m.valor === mesActual)?.nombre || mesActual}`}
            >
              <span className="sidebar-icon">💰</span>
              {!isCollapsed && <span className="sidebar-text">Ingresos Mensuales</span>}
            </Link>
            {!isCollapsed && (
              <button
                onClick={toggleIngresos}
                className="sidebar-arrow-button"
                title="Mostrar/Ocultar meses"
                aria-label="Mostrar/Ocultar meses"
              >
                <span className={`sidebar-arrow ${ingresosOpen ? 'open' : ''}`}>
                  ▼
                </span>
              </button>
            )}
          </div>

          {/* Lista desplegable de meses para ingresos */}
          {!isCollapsed && ingresosOpen && (
            <div className="sidebar-dropdown">
              {meses.map((mes) => {
                const mesPath = `/dashboard/ingresos/${mes.valor}`
                const isActive = pathname === mesPath
                
                return (
                  <Link
                    key={`ingresos-${mes.valor}`}
                    href={mesPath}
                    className={`sidebar-subitem ${isActive ? 'active' : ''}`}
                  >
                    <span className="sidebar-subitem-text">{mes.nombre}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Opción de Distribución */}
        <Link 
          href="/dashboard/distribucion" 
          className={`sidebar-item ${pathname === '/dashboard/distribucion' ? 'active' : ''}`}
          title="Distribución"
        >
          <span className="sidebar-icon">📊</span>
          {!isCollapsed && <span className="sidebar-text">Distribución</span>}
        </Link>

        {/* Opción de Estadísticas */}
        <Link 
          href="/dashboard/estadisticas" 
          className={`sidebar-item ${pathname === '/dashboard/estadisticas' ? 'active' : ''}`}
          title="Estadísticas"
        >
          <span className="sidebar-icon">📈</span>
          {!isCollapsed && <span className="sidebar-text">Estadísticas</span>}
        </Link>

        {/* Opción de Tus Categorías */}
        <Link 
          href="/dashboard/categorias" 
          className={`sidebar-item ${pathname === '/dashboard/categorias' ? 'active' : ''}`}
          title="Tus Categorías"
        >
          <span className="sidebar-icon">🏷️</span>
          {!isCollapsed && <span className="sidebar-text">Tus Categorías</span>}
        </Link>

        {/* Opción de Gestión de Carteras */}
        <Link 
          href="/dashboard/carteras" 
          className={`sidebar-item ${pathname?.startsWith('/dashboard/carteras') ? 'active' : ''}`}
          title="Gestión de Carteras"
        >
          <span className="sidebar-icon">💼</span>
          {!isCollapsed && <span className="sidebar-text">Gestión de Carteras</span>}
        </Link>

        {/* Opción de Opciones/Configuración */}
        <Link 
          href="/dashboard/opciones" 
          className={`sidebar-item ${pathname?.startsWith('/dashboard/opciones') ? 'active' : ''}`}
          title="Opciones y Configuración"
        >
          <span className="sidebar-icon">⚙️</span>
          {!isCollapsed && <span className="sidebar-text">Opciones</span>}
        </Link>

        {/* Espacio para futuras opciones del menú */}
      </nav>
    </aside>
    </>
  )
}

