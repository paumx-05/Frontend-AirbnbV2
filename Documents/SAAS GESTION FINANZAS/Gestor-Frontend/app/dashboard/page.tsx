'use client'

// Página de Dashboard
// Página principal después del login exitoso
// Muestra resumen financiero del mes actual y métricas clave
// Integración completa con backend MongoDB - NO USAR MOCK

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuth } from '@/lib/auth'
import { dashboardService } from '@/services/dashboard.service'
import { gastosService } from '@/services/gastos.service'
import { useCartera } from '@/hooks/useCartera'
import { API_CONFIG } from '@/config/api'
import type {
  ResumenMesActual,
  GastoReciente,
  GastosPorCategoriaResponse,
  ComparativaMensual,
  AlertaFinanciera,
} from '@/models/dashboard'
import PieChart from '@/components/PieChart'

// Función para obtener el mes actual en formato para URL
function getMesActual(): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]
  const mesActual = new Date().getMonth()
  return meses[mesActual]
}

// Función para obtener el nombre del mes actual
function getNombreMesActual(): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const mesActual = new Date().getMonth()
  return meses[mesActual]
}

// Función para obtener el nombre del mes anterior
function getNombreMesAnterior(): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const mesActual = new Date().getMonth()
  const mesAnterior = mesActual === 0 ? 11 : mesActual - 1
  return meses[mesAnterior]
}

// Función para formatear moneda
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

// Función para obtener color según tipo de alerta
function getColorAlerta(tipo: AlertaFinanciera['tipo']): string {
  const colores = {
    info: '#3b82f6',      // Azul
    success: '#10b981',   // Verde
    warning: '#f59e0b',   // Amarillo/Naranja
    error: '#ef4444'      // Rojo
  }
  return colores[tipo]
}

// Función para obtener icono según tipo de alerta
function getIconoAlerta(tipo: AlertaFinanciera['tipo']): string {
  const iconos = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }
  return iconos[tipo]
}

export default function DashboardPage() {
  const router = useRouter()
  const mesActual = getMesActual()
  const nombreMesActual = getNombreMesActual()
  const nombreMesAnterior = getNombreMesAnterior()
  const { carteraActivaId } = useCartera()

  // Log para depuración cuando cambia carteraActivaId
  useEffect(() => {
    console.log('[DASHBOARD] carteraActivaId cambió:', carteraActivaId)
  }, [carteraActivaId])

  // Estados
  const [resumen, setResumen] = useState<ResumenMesActual | null>(null)
  const [gastosRecientes, setGastosRecientes] = useState<GastoReciente[]>([])
  const [gastosPorCategoria, setGastosPorCategoria] = useState<GastosPorCategoriaResponse | null>(null)
  const [comparativa, setComparativa] = useState<ComparativaMensual | null>(null)
  const [alertas, setAlertas] = useState<AlertaFinanciera[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para calcular resumen por categorías desde todos los gastos
  const calcularGastosPorCategoria = useCallback(async (mes: string, carteraId?: string | null): Promise<GastosPorCategoriaResponse> => {
    try {
      console.log('[DASHBOARD] calcularGastosPorCategoria - mes:', mes, 'carteraId:', carteraId)
      
      // Obtener todos los gastos del mes (filtrados por cartera si se proporciona)
      const { gastos, total } = await gastosService.getGastosByMes(mes, carteraId || undefined)
      
      console.log('[DASHBOARD] calcularGastosPorCategoria - gastos recibidos:', gastos.length, 'total:', total)
      
      // Calcular resumen por categorías
      const resumenPorCategoria: { [categoria: string]: number } = {}
      
      gastos.forEach(gasto => {
        if (resumenPorCategoria[gasto.categoria]) {
          resumenPorCategoria[gasto.categoria] += gasto.monto
        } else {
          resumenPorCategoria[gasto.categoria] = gasto.monto
        }
      })
      
      // Convertir a array y calcular porcentajes
      const categoriasArray = Object.entries(resumenPorCategoria)
        .map(([categoria, monto]) => ({
          categoria,
          monto: monto as number,
          porcentaje: total > 0 ? ((monto as number) / total) * 100 : 0
        }))
        .filter(item => item.monto > 0) // Solo categorías con gastos
        .sort((a, b) => b.monto - a.monto) // Ordenar por monto descendente
      
      console.log('[DASHBOARD] calcularGastosPorCategoria - categorias calculadas:', categoriasArray.length)
      
      return {
        data: categoriasArray,
        total: total
      }
    } catch (error) {
      console.error('[DASHBOARD] Error al calcular gastos por categoría:', error)
      return {
        data: [],
        total: 0
      }
    }
  }, [])

  // Verificar autenticación al cargar
  useEffect(() => {
    const isAuthenticated = getAuth()
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
  }, [router])

  // Recargar datos cuando cambia la cartera activa o cuando se carga por primera vez
  useEffect(() => {
    const isAuthenticated = getAuth()
    if (!isAuthenticated) {
      return
    }
    
    console.log('[DASHBOARD] ==========================================')
    console.log('[DASHBOARD] useEffect ejecutado - carteraActivaId:', carteraActivaId, 'tipo:', typeof carteraActivaId)
    
    // IMPORTANTE: Si carteraActivaId es null, no enviar undefined, enviar null explícitamente
    // Esto permite al backend distinguir entre "sin cartera" (null) y "todas las carteras" (undefined)
    // Pero según la documentación, si no hay carteraId, el backend debe filtrar por carteraId = null
    // Por ahora, si no hay cartera activa, no enviamos el parámetro (undefined)
    const carteraId = carteraActivaId || undefined
    
    console.log('[DASHBOARD] carteraId que se enviará al backend:', carteraId)
    console.log('[DASHBOARD] URLs que se llamarán:', {
      resumen: API_CONFIG.ENDPOINTS.DASHBOARD.RESUMEN(carteraId),
      gastosRecientes: API_CONFIG.ENDPOINTS.DASHBOARD.GASTOS_RECIENTES(carteraId),
      comparativa: API_CONFIG.ENDPOINTS.DASHBOARD.COMPARATIVA(carteraId),
      alertas: API_CONFIG.ENDPOINTS.DASHBOARD.ALERTAS(carteraId),
    })
    
    // LIMPIAR ESTADOS PRIMERO para evitar mostrar datos de la cartera anterior
    console.log('[DASHBOARD] Limpiando estados anteriores...')
    setResumen(null)
    setGastosRecientes([])
    setGastosPorCategoria(null)
    setComparativa(null)
    setAlertas([])
    
    // Usar un flag para evitar race conditions
    let cancelled = false
    
    const reloadData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('[DASHBOARD] Iniciando carga de datos con carteraId:', carteraId)

        // Cargar todos los datos en paralelo
        const [resumenData, gastosRecientesData, gastosPorCategoriaData, comparativaData, alertasData] = await Promise.all([
          dashboardService.getResumenMesActual(carteraId),
          dashboardService.getGastosRecientes(carteraId),
          calcularGastosPorCategoria(mesActual, carteraId),
          dashboardService.getComparativaMensual(carteraId),
          dashboardService.getAlertasFinancieras(carteraId),
        ])

        // Verificar si el efecto fue cancelado (cartera cambió durante la carga)
        if (cancelled) {
          console.log('[DASHBOARD] Carga cancelada - cartera cambió durante la carga')
          return
        }

        console.log('[DASHBOARD] ==========================================')
        console.log('[DASHBOARD] Datos recibidos del backend para carteraId:', carteraId)
        console.log('[DASHBOARD] Resumen:', {
          ingresos: resumenData.ingresos,
          gastos: resumenData.gastos,
          balance: resumenData.balance,
          porcentajeGastado: resumenData.porcentajeGastado
        })
        console.log('[DASHBOARD] Gastos recientes:', gastosRecientesData.length)
        console.log('[DASHBOARD] Categorías:', gastosPorCategoriaData.data.length, 'Total:', gastosPorCategoriaData.total)
        console.log('[DASHBOARD] Comparativa:', {
          mesActual: comparativaData.mesActual,
          mesAnterior: comparativaData.mesAnterior
        })
        console.log('[DASHBOARD] Alertas:', alertasData.length)
        console.log('[DASHBOARD] ==========================================')

        // Actualizar con nuevos datos
        setResumen(resumenData)
        setGastosRecientes(gastosRecientesData)
        setGastosPorCategoria(gastosPorCategoriaData)
        setComparativa(comparativaData)
        setAlertas(alertasData)
        
        console.log('[DASHBOARD] Estados actualizados correctamente')
      } catch (error: any) {
        if (!cancelled) {
          console.error('[DASHBOARD] Error al cargar datos:', error)
          setError(error.error || error.message || 'Error al cargar el dashboard. Por favor, intenta de nuevo.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    reloadData()
    
    // Cleanup: marcar como cancelado si el efecto se desmonta o cambia
    return () => {
      cancelled = true
      console.log('[DASHBOARD] Cleanup: efecto cancelado')
    }
  }, [carteraActivaId, mesActual, calcularGastosPorCategoria])

  // Preparar datos para el pie chart
  const COLORS = [
    '#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ]
  
  const pieChartData = gastosPorCategoria?.data.map((item, index) => ({
    categoria: item.categoria,
    monto: item.monto,
    porcentaje: item.porcentaje,
    color: COLORS[index % COLORS.length]
  })) || []

  const totalGastosChart = gastosPorCategoria?.total || 0

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-loading">
            <p>Cargando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar estado de error
  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-error">
            <p>❌ {error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard - {nombreMesActual}</h1>
            <p className="dashboard-subtitle">
              Resumen financiero del mes actual
            </p>
          </div>
        </div>

        {/* Grid principal con gráfico y métricas */}
        <div className="dashboard-main-grid">
          {/* Grid principal con gráfico y lista */}
          <div className="dashboard-content-grid">
            {/* Gráfico de Gastos por Categorías */}
            <div className="dashboard-chart-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">Gastos por Categorías</h2>
                <Link href={`/dashboard/gastos/${mesActual}`} className="dashboard-card-link">
                  Ver todos →
                </Link>
              </div>
              {gastosPorCategoria && gastosPorCategoria.data.length > 0 ? (
                <div className="dashboard-chart-container">
                  <PieChart 
                    data={pieChartData} 
                    total={totalGastosChart}
                    size={280}
                  />
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  <p>No hay gastos registrados este mes</p>
                  <Link href={`/dashboard/gastos/${mesActual}`} className="btn btn-primary">
                    Agregar primer gasto
                  </Link>
                </div>
              )}
            </div>

            {/* Lista de Gastos Recientes */}
            <div className="dashboard-recent-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">Gastos Recientes</h2>
                <Link href={`/dashboard/gastos/${mesActual}`} className="dashboard-card-link">
                  Ver todos →
                </Link>
              </div>
              {gastosRecientes.length > 0 ? (
                <div className="dashboard-recent-list">
                  {gastosRecientes.map((gasto) => (
                    <Link 
                      key={gasto._id} 
                      href={`/dashboard/gastos/${mesActual}`}
                      className="recent-item"
                    >
                      <div className="recent-item-content">
                        <p className="recent-item-desc">{gasto.descripcion}</p>
                        <p className="recent-item-category">{gasto.categoria}</p>
                      </div>
                      <div className="recent-item-right">
                        <p className="recent-item-amount">{formatCurrency(gasto.monto)}</p>
                        <p className="recent-item-date">
                          {new Date(gasto.fecha).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  <p>No hay gastos recientes</p>
                  <Link href={`/dashboard/gastos/${mesActual}`} className="btn btn-primary">
                    Agregar gasto
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Tarjetas de Resumen del Mes Actual - Sidebar */}
          <div className="dashboard-metrics-sidebar">
            <div className="dashboard-metric-card">
              <div className="metric-icon metric-icon-income">💰</div>
              <div className="metric-content">
                <p className="metric-label">Ingresos</p>
                <h3 className="metric-value">{formatCurrency(resumen?.ingresos || 0)}</h3>
              </div>
            </div>

            <div className="dashboard-metric-card">
              <div className="metric-icon metric-icon-expense">💸</div>
              <div className="metric-content">
                <p className="metric-label">Gastos</p>
                <h3 className="metric-value">{formatCurrency(resumen?.gastos || 0)}</h3>
              </div>
            </div>

            <div className="dashboard-metric-card">
              <div className={`metric-icon ${(resumen?.balance || 0) >= 0 ? 'metric-icon-positive' : 'metric-icon-negative'}`}>
                {(resumen?.balance || 0) >= 0 ? '📈' : '📉'}
              </div>
              <div className="metric-content">
                <p className="metric-label">Balance</p>
                <h3 className={`metric-value ${(resumen?.balance || 0) >= 0 ? 'metric-positive' : 'metric-negative'}`}>
                  {formatCurrency(resumen?.balance || 0)}
                </h3>
              </div>
            </div>

            <div className="dashboard-metric-card">
              <div className="metric-icon metric-icon-percentage">📊</div>
              <div className="metric-content">
                <p className="metric-label">% Gastado</p>
                <h3 className="metric-value">
                  {resumen?.porcentajeGastado.toFixed(1) || '0.0'}%
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Comparativa Mes Anterior */}
        {comparativa && (comparativa.mesActual.ingresos > 0 || comparativa.mesActual.gastos > 0) && (
          <div className="dashboard-comparison-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">Comparativa: {nombreMesAnterior} vs {nombreMesActual}</h2>
            </div>
            <div className="comparison-grid">
              <div className="comparison-item">
                <p className="comparison-label">Ingresos</p>
                <div className="comparison-values">
                  <span className="comparison-value">
                    {formatCurrency(comparativa.mesActual.ingresos)}
                  </span>
                  <span className={`comparison-change ${comparativa.cambios.ingresos.tipo === 'aumento' ? 'positive' : 'negative'}`}>
                    {comparativa.cambios.ingresos.tipo === 'aumento' ? '↑' : '↓'} {Math.abs(comparativa.cambios.ingresos.porcentaje).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="comparison-item">
                <p className="comparison-label">Gastos</p>
                <div className="comparison-values">
                  <span className="comparison-value">
                    {formatCurrency(comparativa.mesActual.gastos)}
                  </span>
                  <span className={`comparison-change ${comparativa.cambios.gastos.tipo === 'disminucion' ? 'positive' : 'negative'}`}>
                    {comparativa.cambios.gastos.tipo === 'aumento' ? '↑' : '↓'} {Math.abs(comparativa.cambios.gastos.porcentaje).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="comparison-item">
                <p className="comparison-label">Balance</p>
                <div className="comparison-values">
                  <span className="comparison-value">
                    {formatCurrency(comparativa.mesActual.balance)}
                  </span>
                  <span className={`comparison-change ${comparativa.cambios.balance.tipo === 'aumento' ? 'positive' : 'negative'}`}>
                    {comparativa.cambios.balance.tipo === 'aumento' ? '↑' : '↓'} {Math.abs(comparativa.cambios.balance.porcentaje).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel de Alertas */}
        {alertas.length > 0 && (
          <div className="dashboard-alerts-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">⚠️ Alertas Financieras</h2>
            </div>
            <div className="alerts-list">
              {alertas.map((alerta, index) => (
                <div key={index} className={`alert-item alert-${alerta.tipo}`} style={{ borderLeftColor: getColorAlerta(alerta.tipo) }}>
                  <div className="alert-icon">
                    {getIconoAlerta(alerta.tipo)}
                  </div>
                  <div className="alert-content">
                    <p className="alert-title">{alerta.titulo}</p>
                    <p className="alert-message">{alerta.mensaje}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
