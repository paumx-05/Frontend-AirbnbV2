'use client'

// Página de Estadísticas
// Muestra análisis financieros detallados con soporte para diferentes periodos temporales
// Integración completa con backend MongoDB - NO USAR MOCK

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth, getUsuarioActual } from '@/lib/auth'
import { estadisticasService } from '@/services/estadisticas.service'
import { gastosService } from '@/services/gastos.service'
import { getCategorias } from '@/lib/categorias'
import { useCartera } from '@/hooks/useCartera'
import type {
  ResumenEstadisticas,
  TendenciasTemporales,
  AnalisisCategorias,
  MetricasComportamiento,
  PeriodoEstadisticas,
  CategoriaAnalisis,
  SubcategoriaAnalisis,
} from '@/models/estadisticas'
import type { Gasto } from '@/models/gastos'
import EstadisticasCard from '@/components/EstadisticasCard'
import PeriodSelector from '@/components/PeriodSelector'
import ComparativaCard from '@/components/ComparativaCard'
import LineChart from '@/components/LineChart'
import PieChart from '@/components/PieChart'

export default function EstadisticasPage() {
  const router = useRouter()
  const { carteraActivaId } = useCartera()

  // Estados
  const [periodo, setPeriodo] = useState<PeriodoEstadisticas>('mensual')
  const [resumen, setResumen] = useState<ResumenEstadisticas | null>(null)
  const [tendencias, setTendencias] = useState<TendenciasTemporales | null>(null)
  const [analisisCategorias, setAnalisisCategorias] = useState<AnalisisCategorias | null>(null)
  const [metricasComportamiento, setMetricasComportamiento] = useState<MetricasComportamiento | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendNoDisponible, setBackendNoDisponible] = useState(false)
  
  // Estado para expandir/colapsar subcategorías en la tabla
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Verificar autenticación al cargar
  useEffect(() => {
    const isAuthenticated = getAuth()
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [router])

  // Función para cargar todos los datos
  const cargarDatos = useCallback(async () => {
    if (!getAuth()) return

    let cancelled = false
    setLoading(true)
    setError(null)

    try {
      const carteraId = carteraActivaId || undefined

      console.log('[ESTADISTICAS] Cargando datos para periodo:', periodo, 'carteraId:', carteraId)

      // Cargar todos los datos en paralelo
      const [resumenData, tendenciasData, categoriasData, comportamientoData] = await Promise.all([
        estadisticasService.getResumen(periodo, carteraId),
        estadisticasService.getTendencias(periodo, carteraId),
        estadisticasService.getAnalisisCategorias(periodo, carteraId, undefined, 'ambos', 10),
        estadisticasService.getMetricasComportamiento(periodo, carteraId),
      ])

      // Verificar si el efecto fue cancelado
      if (cancelled) {
        console.log('[ESTADISTICAS] Carga cancelada - periodo o cartera cambió')
        return
      }

      console.log('[ESTADISTICAS] Datos cargados correctamente')

      // Log detallado de categorías y subcategorías recibidas del backend
      console.log('[ESTADISTICAS] Análisis de categorías recibido (RAW):', JSON.stringify(categoriasData, null, 2))
      if (categoriasData.categoriasGastos) {
        categoriasData.categoriasGastos.forEach((cat, idx) => {
          console.log(`[ESTADISTICAS] Categoría de gasto ${idx + 1}:`, {
            nombre: cat.categoria,
            monto: cat.monto,
            tieneSubcategorias: !!cat.subcategorias,
            cantidadSubcategorias: cat.subcategorias?.length || 0,
            subcategorias: cat.subcategorias,
            tipoSubcategorias: typeof cat.subcategorias,
            esArray: Array.isArray(cat.subcategorias)
          })
        })
      }

      // Verificar si el backend ya envió subcategorías
      const backendTieneSubcategorias = categoriasData.categoriasGastos?.some(
        cat => cat.subcategorias && Array.isArray(cat.subcategorias) && cat.subcategorias.length > 0
      ) || false

      console.log('[ESTADISTICAS] ========================================')
      console.log('[ESTADISTICAS] 🔄 PROCESANDO SUBCATEGORÍAS')
      console.log('[ESTADISTICAS] Backend tiene subcategorías:', backendTieneSubcategorias)
      console.log('[ESTADISTICAS] ========================================')
      
      let categoriasDataConSubcategorias = categoriasData
      
      // Si el backend NO envió subcategorías, usar fallback (calcular desde gastos)
      // Si el backend SÍ envió subcategorías, usar directamente esos datos
      if (!backendTieneSubcategorias) {
        console.log('[ESTADISTICAS] ⚠️ Backend no envió subcategorías, usando fallback...')
        
        try {
        const usuarioActual = getUsuarioActual()
        console.log('[ESTADISTICAS] 👤 Usuario actual:', usuarioActual ? 'Sí' : 'No')
        
        if (usuarioActual) {
          // Obtener todas las categorías con sus subcategorías definidas
          console.log('[ESTADISTICAS] 📥 Obteniendo categorías del backend...')
          const categoriasCompletas = await getCategorias(usuarioActual.id)
          console.log('[ESTADISTICAS] 📋 Categorías obtenidas:', categoriasCompletas.length)
          
          // Crear un mapa de categorías con sus subcategorías definidas
          const categoriasConSubcategorias = new Map<string, string[]>()
          categoriasCompletas.forEach(cat => {
            if (cat.subcategorias && cat.subcategorias.length > 0) {
              categoriasConSubcategorias.set(cat.nombre, cat.subcategorias)
              console.log(`[ESTADISTICAS] 📦 Categoría "${cat.nombre}" tiene ${cat.subcategorias.length} subcategorías definidas:`, cat.subcategorias)
            }
          })
          
          // Obtener todos los gastos del periodo para calcular montos de subcategorías
          if (categoriasConSubcategorias.size > 0) {
            // Calcular rango de fechas según el periodo
            const fechaFin = new Date()
            let fechaInicio = new Date()
            
            if (periodo === 'mensual') {
              fechaInicio = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1)
            } else if (periodo === 'anual') {
              fechaInicio = new Date(fechaFin.getFullYear(), 0, 1)
            } else {
              // Semanal: últimos 7 días
              fechaInicio = new Date(fechaFin)
              fechaInicio.setDate(fechaInicio.getDate() - 7)
            }
            
            // Obtener todos los meses que cubren el periodo
            const meses: string[] = []
            const currentDate = new Date(fechaInicio)
            while (currentDate <= fechaFin) {
              const mesNombre = currentDate.toLocaleDateString('es-ES', { month: 'long' })
              meses.push(mesNombre)
              currentDate.setMonth(currentDate.getMonth() + 1)
            }
            
            // Obtener gastos de todos los meses del periodo
            const todosLosGastos: Gasto[] = []
            console.log(`[ESTADISTICAS] 📅 Rango de fechas:`, {
              fechaInicio: fechaInicio.toISOString(),
              fechaFin: fechaFin.toISOString(),
              meses: meses
            })
            
            for (const mes of meses) {
              try {
                const { gastos } = await gastosService.getGastosByMes(mes, carteraId)
                console.log(`[ESTADISTICAS] 📅 Gastos obtenidos del mes ${mes}:`, gastos.length)
                
                // Log detallado de TODOS los gastos de Ropa del mes, sin filtrar
                const gastosRopaMes = gastos.filter(g => g.categoria && g.categoria.toLowerCase().includes('ropa'))
                if (gastosRopaMes.length > 0) {
                  console.log(`[ESTADISTICAS] 👕 Gastos de Ropa en mes ${mes} (SIN filtrar):`, gastosRopaMes.length)
                  gastosRopaMes.forEach((g, idx) => {
                    const fechaGasto = new Date(g.fecha)
                    const dentroRango = fechaGasto >= fechaInicio && fechaGasto <= fechaFin
                    console.log(`[ESTADISTICAS] 👕 Gasto Ropa #${idx + 1} del mes ${mes}:`, {
                      id: g._id,
                      categoria: g.categoria,
                      subcategoria: g.subcategoria,
                      tieneSubcategoria: !!g.subcategoria,
                      subcategoriaType: typeof g.subcategoria,
                      subcategoriaValue: g.subcategoria,
                      monto: g.monto,
                      fecha: g.fecha,
                      fechaGastoISO: fechaGasto.toISOString(),
                      fechaInicioISO: fechaInicio.toISOString(),
                      fechaFinISO: fechaFin.toISOString(),
                      dentroRango: dentroRango,
                      razonFueraRango: !dentroRango ? (
                        fechaGasto < fechaInicio ? 'fecha anterior al inicio' : 
                        fechaGasto > fechaFin ? 'fecha posterior al fin' : 'desconocido'
                      ) : 'dentro del rango'
                    })
                  })
                }
                
                // NO filtrar por fecha - incluir TODOS los gastos del mes
                // El backend ya filtra por mes, así que incluimos todos
                console.log(`[ESTADISTICAS] 📅 Gastos del mes ${mes} (SIN filtrar por fecha):`, gastos.length)
                todosLosGastos.push(...gastos)
              } catch (error) {
                console.warn(`[ESTADISTICAS] Error al obtener gastos del mes ${mes}:`, error)
              }
            }
            
            console.log(`[ESTADISTICAS] 📊 Gastos obtenidos para calcular subcategorías:`, todosLosGastos.length)
            
            // Log detallado de los primeros gastos para ver su estructura
            console.log(`[ESTADISTICAS] 🔍 Muestra de gastos (primeros 5):`, todosLosGastos.slice(0, 5).map(g => ({
              id: g._id,
              categoria: g.categoria,
              subcategoria: g.subcategoria,
              tieneSubcategoria: !!g.subcategoria,
              subcategoriaType: typeof g.subcategoria,
              subcategoriaValue: g.subcategoria,
              monto: g.monto,
              descripcion: g.descripcion,
              todasLasPropiedades: Object.keys(g),
              objetoCompleto: g
            })))
            
            // Log de TODOS los gastos de "Ropa" para verificar
            const gastosRopa = todosLosGastos.filter(g => g.categoria && g.categoria.toLowerCase().includes('ropa'))
            console.log(`[ESTADISTICAS] 👕 Total gastos de Ropa:`, gastosRopa.length)
            gastosRopa.forEach((g, idx) => {
              console.log(`[ESTADISTICAS] 👕 Gasto Ropa #${idx + 1}:`, {
                id: g._id,
                categoria: g.categoria,
                subcategoria: g.subcategoria,
                tieneSubcategoria: !!g.subcategoria,
                subcategoriaType: typeof g.subcategoria,
                subcategoriaValue: g.subcategoria,
                monto: g.monto,
                descripcion: g.descripcion,
                todasLasPropiedades: Object.keys(g),
                objetoCompleto: JSON.stringify(g, null, 2)
              })
            })
            
            // Log de gastos con subcategorías
            const gastosConSubcategoria = todosLosGastos.filter(g => g.subcategoria && g.subcategoria.trim() !== '')
            console.log(`[ESTADISTICAS] 📋 Gastos con subcategoría:`, gastosConSubcategoria.length)
            
            // Verificar todos los gastos para ver cuáles tienen subcategoría
            todosLosGastos.forEach((g, idx) => {
              if (g.categoria && g.categoria.toLowerCase().includes('ropa')) {
                console.log(`[ESTADISTICAS] 🔍 Gasto de Ropa #${idx}:`, {
                  id: g._id,
                  categoria: g.categoria,
                  subcategoria: g.subcategoria,
                  tieneSubcategoria: !!g.subcategoria,
                  subcategoriaType: typeof g.subcategoria,
                  subcategoriaValue: g.subcategoria,
                  monto: g.monto,
                  descripcion: g.descripcion,
                  todasLasPropiedades: Object.keys(g)
                })
              }
            })
            
            gastosConSubcategoria.forEach(g => {
              console.log(`  - ${g.categoria} > ${g.subcategoria}: ${g.monto}€`)
            })
            
            // Calcular subcategorías por categoría
            const subcategoriasPorCategoria = new Map<string, Map<string, { monto: number; cantidad: number }>>()
            
            // Log detallado ANTES de procesar
            console.log(`[ESTADISTICAS] 🔍 ANTES de procesar - Total gastos:`, todosLosGastos.length)
            const gastosRopaAntes = todosLosGastos.filter(g => g.categoria && g.categoria.toLowerCase().includes('ropa'))
            console.log(`[ESTADISTICAS] 🔍 Gastos de Ropa ANTES de procesar:`, gastosRopaAntes.length)
            gastosRopaAntes.forEach((g, idx) => {
              console.log(`[ESTADISTICAS] 🔍 Gasto Ropa #${idx + 1} ANTES de procesar:`, {
                id: g._id,
                categoria: g.categoria,
                subcategoria: g.subcategoria,
                subcategoriaRaw: g.subcategoria,
                subcategoriaType: typeof g.subcategoria,
                subcategoriaIsNull: g.subcategoria === null,
                subcategoriaIsUndefined: g.subcategoria === undefined,
                subcategoriaLength: g.subcategoria?.length,
                monto: g.monto,
                descripcion: g.descripcion,
                todasLasPropiedades: Object.keys(g),
                objetoCompleto: JSON.stringify(g, null, 2)
              })
            })
            
            todosLosGastos.forEach((gasto, idx) => {
              // Verificar subcategoría con múltiples formas posibles
              // El campo puede ser string, null, undefined, o no existir
              const subcategoria = gasto.subcategoria !== null && gasto.subcategoria !== undefined
                ? gasto.subcategoria
                : (gasto as any).subcategoría || null
              
              // Validar que sea un string no vacío
              const subcategoriaValida = subcategoria 
                && typeof subcategoria === 'string' 
                && subcategoria.trim().length > 0
              
              // Log detallado para gastos de Ropa
              if (gasto.categoria && gasto.categoria.toLowerCase().includes('ropa')) {
                console.log(`[ESTADISTICAS] 🔍 Procesando gasto Ropa #${idx}:`, {
                  id: gasto._id,
                  categoria: gasto.categoria,
                  subcategoria: gasto.subcategoria,
                  subcategoriaRaw: subcategoria,
                  subcategoriaType: typeof subcategoria,
                  subcategoriaValida: subcategoriaValida,
                  subcategoriaTrim: subcategoriaValida ? subcategoria.trim() : 'N/A',
                  monto: gasto.monto,
                  descripcion: gasto.descripcion
                })
              }
              
              if (subcategoriaValida) {
                const categoriaNombre = gasto.categoria.trim()
                const subcategoriaTrim = subcategoria.trim()
                
                if (!subcategoriasPorCategoria.has(categoriaNombre)) {
                  subcategoriasPorCategoria.set(categoriaNombre, new Map())
                  console.log(`[ESTADISTICAS] 📦 Nueva categoría en mapa: "${categoriaNombre}"`)
                }
                
                const subcategorias = subcategoriasPorCategoria.get(categoriaNombre)!
                if (!subcategorias.has(subcategoriaTrim)) {
                  subcategorias.set(subcategoriaTrim, { monto: 0, cantidad: 0 })
                  console.log(`[ESTADISTICAS] 📦 Nueva subcategoría en mapa: "${categoriaNombre}" > "${subcategoriaTrim}"`)
                }
                
                const datos = subcategorias.get(subcategoriaTrim)!
                const montoAnterior = datos.monto
                const cantidadAnterior = datos.cantidad
                datos.monto += gasto.monto
                datos.cantidad += 1
                
                console.log(`[ESTADISTICAS] ✅ Procesado gasto con subcategoría: ${categoriaNombre} > ${subcategoriaTrim}: ${gasto.monto}€ (Total: ${datos.monto}€, Cantidad: ${datos.cantidad})`)
              } else if (gasto.categoria && gasto.categoria.toLowerCase().includes('ropa')) {
                // Log solo para debugging de Ropa
                console.log(`[ESTADISTICAS] ⚠️ Gasto de Ropa sin subcategoría válida:`, {
                  id: gasto._id,
                  categoria: gasto.categoria,
                  subcategoria: gasto.subcategoria,
                  subcategoriaRaw: subcategoria,
                  subcategoriaType: typeof subcategoria,
                  subcategoriaIsNull: subcategoria === null,
                  subcategoriaIsUndefined: subcategoria === undefined,
                  subcategoriaLength: typeof subcategoria === 'string' ? subcategoria.length : 'N/A',
                  monto: gasto.monto,
                  descripcion: gasto.descripcion
                })
              }
            })
            
            console.log(`[ESTADISTICAS] 📦 Categorías con subcategorías calculadas:`, Array.from(subcategoriasPorCategoria.keys()))
            subcategoriasPorCategoria.forEach((subs, cat) => {
              console.log(`  - ${cat}:`, Array.from(subs.keys()))
            })
            
            // Log del mapa de subcategorías calculadas ANTES de combinar
            console.log(`[ESTADISTICAS] 📦 Mapa de subcategorías calculadas ANTES de combinar:`, {
              categoriasEnMapa: Array.from(subcategoriasPorCategoria.keys()),
              detalles: Array.from(subcategoriasPorCategoria.entries()).map(([cat, subs]) => ({
                categoria: cat,
                subcategorias: Array.from(subs.entries()).map(([sub, datos]) => ({
                  nombre: sub,
                  monto: datos.monto,
                  cantidad: datos.cantidad
                }))
              }))
            })
            
            // Combinar subcategorías definidas con gastos calculados
            categoriasDataConSubcategorias = {
              ...categoriasData,
              categoriasGastos: categoriasData.categoriasGastos.map(cat => {
                const categoriaNombre = cat.categoria.trim()
                // Buscar subcategorías definidas (case-insensitive)
                const subcategoriasDefinidas = categoriasConSubcategorias.get(categoriaNombre) || 
                  Array.from(categoriasConSubcategorias.entries())
                    .find(([key]) => key.toLowerCase().trim() === categoriaNombre.toLowerCase())?.[1] || []
                
                console.log(`[ESTADISTICAS] 🔍 Procesando categoría "${categoriaNombre}":`, {
                  tieneSubcategoriasDefinidas: subcategoriasDefinidas.length > 0,
                  subcategoriasDefinidas: subcategoriasDefinidas,
                  categoriasEnMapa: Array.from(categoriasConSubcategorias.keys()),
                  tieneGastosCalculados: subcategoriasPorCategoria.has(categoriaNombre)
                })
                
                if (subcategoriasDefinidas.length > 0) {
                  const montoCategoria = cat.monto || 0
                  const totalGastos = categoriasData.totalGastos || 0
                  
                  // Buscar gastos calculados para esta categoría (case-insensitive)
                  let gastosCalculados = subcategoriasPorCategoria.get(categoriaNombre)
                  if (!gastosCalculados) {
                    for (const [key, value] of subcategoriasPorCategoria.entries()) {
                      if (key.toLowerCase().trim() === categoriaNombre.toLowerCase()) {
                        gastosCalculados = value
                        console.log(`[ESTADISTICAS] 🔄 Gastos encontrados con búsqueda case-insensitive: "${key}" -> "${categoriaNombre}"`)
                        break
                      }
                    }
                  }
                  
                  // Crear array de subcategorías combinando definidas con gastos
                  const subcategoriasArray: SubcategoriaAnalisis[] = subcategoriasDefinidas.map(nombreSub => {
                    // Buscar si hay gastos para esta subcategoría
                    const gastosSub = gastosCalculados?.get(nombreSub) || null
                    
                    const monto = gastosSub?.monto || 0
                    const cantidad = gastosSub?.cantidad || 0
                    const porcentaje = totalGastos > 0 ? (monto / totalGastos) * 100 : 0
                    const promedio = cantidad > 0 ? monto / cantidad : 0
                    
                    console.log(`[ESTADISTICAS] 📊 Subcategoría "${nombreSub}" de "${categoriaNombre}":`, {
                      tieneGastos: !!gastosSub,
                      monto: monto,
                      cantidad: cantidad,
                      porcentaje: porcentaje.toFixed(2) + '%',
                      gastosCalculadosKeys: gastosCalculados ? Array.from(gastosCalculados.keys()) : 'N/A'
                    })
                    
                    return {
                      nombre: nombreSub,
                      monto,
                      porcentaje,
                      cantidad,
                      promedio,
                    }
                  })
                  
                  console.log(`[ESTADISTICAS] ✅ Subcategorías finales para "${categoriaNombre}":`, {
                    definidas: subcategoriasDefinidas.length,
                    conGastos: subcategoriasArray.filter(s => s.monto > 0).length,
                    subcategorias: subcategoriasArray.map(s => ({
                      nombre: s.nombre,
                      monto: s.monto,
                      cantidad: s.cantidad
                    }))
                  })
                  
                  return {
                    ...cat,
                    subcategorias: subcategoriasArray,
                  }
                }
                
                return cat
              }),
            }
            
            console.log('[ESTADISTICAS] ✅ Subcategorías añadidas a las categorías')
          } else {
            console.log('[ESTADISTICAS] ℹ️ No hay categorías con subcategorías definidas')
          }
        } else {
          console.warn('[ESTADISTICAS] ⚠️ No hay usuario actual, no se pueden obtener subcategorías')
        }
        } catch (error) {
          console.error('[ESTADISTICAS] ❌ Error al obtener subcategorías (fallback):', error)
          console.error('[ESTADISTICAS] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
        }
      } else {
        console.log('[ESTADISTICAS] ✅ Backend envió subcategorías, usando datos del backend directamente')
        // El backend ya envió subcategorías, usar directamente categoriasData
        categoriasDataConSubcategorias = categoriasData
      }

      // Actualizar estados
      console.log('[ESTADISTICAS] 💾 Actualizando estados con datos finales...')
      console.log('[ESTADISTICAS] Categorías finales antes de actualizar estado:', categoriasDataConSubcategorias.categoriasGastos.map(c => ({
        nombre: c.categoria,
        tieneSubcategorias: !!c.subcategorias && c.subcategorias.length > 0,
        cantidad: c.subcategorias?.length || 0,
        subcategorias: c.subcategorias
      })))
      
      setResumen(resumenData)
      setTendencias(tendenciasData)
      setAnalisisCategorias(categoriasDataConSubcategorias)
      setMetricasComportamiento(comportamientoData)
      
      console.log('[ESTADISTICAS] ✅ Estados actualizados correctamente')
    } catch (error: any) {
      if (!cancelled) {
        console.error('[ESTADISTICAS] Error al cargar datos:', error)
        
        // Manejar errores según código de estado
        if (error.status === 404) {
          setBackendNoDisponible(false)
          setError('No se encontraron datos para el periodo seleccionado. Intenta con otro periodo o cartera.')
        } else {
          setBackendNoDisponible(false)
          setError(error.error || error.message || 'Error al cargar las estadísticas. Por favor, intenta de nuevo.')
        }
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }

    return () => {
      cancelled = true
    }
  }, [periodo, carteraActivaId])

  // Cargar datos cuando cambia el periodo o la cartera
  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Formatear fecha para mostrar
  const formatearRangoFechas = (fechaInicio: string, fechaFin: string): string => {
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)

    if (periodo === 'anual') {
      return `${inicio.getFullYear()}`
    } else if (periodo === 'mensual') {
      return inicio.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    } else {
      // Semanal
      const inicioStr = inicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
      const finStr = fin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
      return `${inicioStr} - ${finStr}`
    }
  }

  // Preparar datos para gráfico de categorías
  const COLORS = [
    '#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ]

  const pieChartData = analisisCategorias?.categoriasGastos.map((item, index) => ({
    categoria: item.categoria,
    monto: item.monto,
    porcentaje: item.porcentaje,
    color: COLORS[index % COLORS.length],
  })) || []

  const totalGastosChart = analisisCategorias?.totalGastos || 0
  
  // Función para toggle expandir/colapsar subcategorías
  const toggleExpandCategoria = (categoria: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoria)) {
      newExpanded.delete(categoria)
    } else {
      newExpanded.add(categoria)
    }
    setExpandedCategories(newExpanded)
  }
  
  // Función para formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  // Calcular datos acumulados para el gráfico
  const datosGraficoAcumulados = useMemo(() => {
    if (!tendencias?.datosGrafico || tendencias.datosGrafico.length === 0) {
      return []
    }

    let ingresosAcumulados = 0
    let gastosAcumulados = 0

    return tendencias.datosGrafico.map((punto) => {
      // Sumar los valores del punto actual a los acumulados
      ingresosAcumulados += punto.ingresos
      gastosAcumulados += punto.gastos

      return {
        fecha: punto.fecha,
        ingresos: ingresosAcumulados,
        gastos: gastosAcumulados,
        balance: ingresosAcumulados - gastosAcumulados,
        // Mantener los valores del periodo para el tooltip
        ingresoPeriodo: punto.ingresos,
        gastoPeriodo: punto.gastos
      }
    })
  }, [tendencias?.datosGrafico])

  // Mostrar estado de carga
  if (loading && !resumen) {
    return (
      <div className="estadisticas-page">
        <div className="estadisticas-container">
          <div className="estadisticas-loading">
            <p>Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar estado de error (especialmente para backend no disponible)
  if (error && !resumen) {
    return (
      <div className="estadisticas-page">
        <div className="estadisticas-container">
          <div className="estadisticas-header">
            <div>
              <h1 className="estadisticas-title">Estadísticas Financieras</h1>
              <p className="estadisticas-subtitle">
                Análisis detallado de tus finanzas
              </p>
            </div>
          </div>
          
          <div className={`estadisticas-error ${backendNoDisponible ? 'backend-no-disponible' : ''}`}>
            {backendNoDisponible ? (
              <>
                <div className="estadisticas-error-icon">🚧</div>
                <h2 className="estadisticas-error-title">Funcionalidad en Desarrollo</h2>
                <p className="estadisticas-error-message">
                  La sección de estadísticas está actualmente en desarrollo. 
                  El backend aún no está implementado, pero el frontend ya está listo.
                </p>
                <div className="estadisticas-error-details">
                  <p><strong>Estado:</strong> Frontend completado ✅</p>
                  <p><strong>Estado:</strong> Backend pendiente ⏳</p>
                  <p className="estadisticas-error-note">
                    Una vez que el backend esté implementado según la documentación en 
                    <code>Doc_backend/estadisticas-integracion.md</code>, 
                    esta funcionalidad estará completamente operativa.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="estadisticas-error-icon">❌</div>
                <p className="estadisticas-error-message">{error}</p>
                <button onClick={() => cargarDatos()} className="btn btn-primary">
                  Reintentar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="estadisticas-page">
      <div className="estadisticas-container">
        {/* Header */}
        <div className="estadisticas-header">
          <div>
            <h1 className="estadisticas-title">Estadísticas Financieras</h1>
            <p className="estadisticas-subtitle">
              Análisis detallado de tus finanzas
            </p>
          </div>
        </div>

        {/* Selector de periodo */}
        <div className="estadisticas-controls">
          <PeriodSelector periodo={periodo} onChange={setPeriodo} />
          {resumen && (
            <div className="estadisticas-periodo-info">
              <span className="estadisticas-periodo-label">
                {formatearRangoFechas(resumen.fechaInicio, resumen.fechaFin)}
              </span>
            </div>
          )}
        </div>

        {/* Mensaje de error si hay datos parciales */}
        {error && resumen && (
          <div className="estadisticas-error-partial">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Indicador de carga parcial */}
        {loading && resumen && (
          <div className="estadisticas-loading-partial">
            <p>Actualizando datos...</p>
          </div>
        )}

        {/* Resumen principal */}
        {resumen && (
          <div className="estadisticas-resumen-grid">
            <EstadisticasCard
              titulo="Total Ingresos"
              valor={resumen.ingresos.total}
              subtitulo={`${resumen.ingresos.cantidad} transacciones`}
              icono="💰"
              color="success"
              formato="currency"
            />
            <EstadisticasCard
              titulo="Total Gastos"
              valor={resumen.gastos.total}
              subtitulo={`${resumen.gastos.cantidad} transacciones`}
              icono="💸"
              color="danger"
              formato="currency"
            />
            <EstadisticasCard
              titulo="Balance Neto"
              valor={resumen.balance.total}
              subtitulo={`Promedio diario: ${resumen.balance.promedioDiario.toFixed(2)}€`}
              icono="💵"
              color={resumen.balance.total >= 0 ? 'success' : 'danger'}
              formato="currency"
            />
            <EstadisticasCard
              titulo="Tasa de Ahorro"
              valor={resumen.tasaAhorro}
              subtitulo="% del total de ingresos"
              icono="📈"
              color="info"
              formato="percentage"
            />
            <EstadisticasCard
              titulo="Ratio Gastos/Ingresos"
              valor={resumen.ratioGastosIngresos}
              subtitulo="% de ingresos gastados"
              icono="📊"
              color="warning"
              formato="percentage"
            />
          </div>
        )}

        {/* Tendencias y comparativas */}
        {tendencias && (
          <div className="estadisticas-tendencias-section">
            <h2 className="estadisticas-section-title">Tendencias Temporales</h2>
            
            {/* Gráfico de líneas */}
            <div className="estadisticas-chart-card">
              <h3 className="estadisticas-chart-title">Evolución Acumulada de Ingresos y Gastos</h3>
              <LineChart 
                data={datosGraficoAcumulados} 
                width={800} 
                height={400}
                showArea={true}
                showBalanceLine={true}
              />
            </div>

            {/* Comparativas */}
            <div className="estadisticas-comparativas-grid">
              <ComparativaCard
                titulo="Ingresos"
                valorActual={tendencias.periodoActual.ingresos}
                valorAnterior={tendencias.periodoAnterior.ingresos}
                cambio={tendencias.cambios.ingresos}
                formato="currency"
                icono="💰"
              />
              <ComparativaCard
                titulo="Gastos"
                valorActual={tendencias.periodoActual.gastos}
                valorAnterior={tendencias.periodoAnterior.gastos}
                cambio={tendencias.cambios.gastos}
                formato="currency"
                icono="💸"
              />
              <ComparativaCard
                titulo="Balance"
                valorActual={tendencias.periodoActual.balance}
                valorAnterior={tendencias.periodoAnterior.balance}
                cambio={tendencias.cambios.balance}
                formato="currency"
                icono="💵"
              />
            </div>
          </div>
        )}

        {/* Análisis por categorías */}
        {analisisCategorias && (
          <div className="estadisticas-categorias-section">
            <h2 className="estadisticas-section-title">Análisis por Categorías</h2>
            
            <div className="estadisticas-categorias-grid">
              {/* Gráfico circular de gastos */}
              {analisisCategorias.categoriasGastos.length > 0 && (
                <div className="estadisticas-chart-card">
                  <h3 className="estadisticas-chart-title">Distribución de Gastos</h3>
                  <PieChart data={pieChartData} total={totalGastosChart} size={350} />
                </div>
              )}

              {/* Tabla de categorías de gastos */}
              <div className="estadisticas-categorias-table-card">
                <h3 className="estadisticas-chart-title">Top Categorías de Gastos</h3>
                {analisisCategorias.categoriasGastos.length > 0 ? (
                  <table className="estadisticas-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30px' }}></th>
                        <th>Categoría</th>
                        <th>Monto</th>
                        <th>%</th>
                        <th>Trans.</th>
                        <th>Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        console.log('[ESTADISTICAS UI] 🎨 ===== INICIANDO RENDERIZADO DE TABLA =====')
                        console.log('[ESTADISTICAS UI] Total categorías:', analisisCategorias.categoriasGastos.length)
                        analisisCategorias.categoriasGastos.forEach(c => {
                          console.log(`[ESTADISTICAS UI] Categoría "${c.categoria}":`, {
                            tieneSubcategorias: !!c.subcategorias && c.subcategorias.length > 0,
                            cantidad: c.subcategorias?.length || 0,
                            subcategorias: c.subcategorias
                          })
                        })
                        return null
                      })()}
                      {analisisCategorias.categoriasGastos.map((cat, index) => {
                        // Verificar si tiene subcategorías - con validación más robusta
                        const subcategoriasArray = Array.isArray(cat.subcategorias) ? cat.subcategorias : []
                        const hasSubcategorias = subcategoriasArray.length > 0
                        const isExpanded = expandedCategories.has(cat.categoria)
                        
                        return (
                          <>
                            {/* Fila principal de categoría - SIEMPRE expandible */}
                            <tr 
                              key={`cat-${index}`}
                              className="estadisticas-categoria-row expandible"
                              onClick={() => {
                                console.log(`[ESTADISTICAS UI] 🔄 Toggle categoría "${cat.categoria}", estado actual: ${isExpanded ? 'expandida' : 'colapsada'}`)
                                toggleExpandCategoria(cat.categoria)
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <td className="estadisticas-expand-cell">
                                <button
                                  type="button"
                                  className="estadisticas-expand-btn"
                                  aria-label={isExpanded ? 'Ocultar subcategorías' : 'Ver subcategorías'}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    console.log(`[ESTADISTICAS UI] 🖱️ Click en botón expandir categoría "${cat.categoria}"`)
                                    toggleExpandCategoria(cat.categoria)
                                  }}
                                  style={{ 
                                    fontSize: '0.9rem',
                                    padding: '2px 6px',
                                    minWidth: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {isExpanded ? '▼' : '▶'}
                                </button>
                              </td>
                              <td>
                                <span
                                  className="estadisticas-categoria-color"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <strong>{cat.categoria}</strong>
                                {hasSubcategorias && (
                                  <span style={{ 
                                    marginLeft: '8px', 
                                    fontSize: '0.75rem', 
                                    color: '#94a3b8',
                                    fontWeight: 'normal'
                                  }}>
                                    ({subcategoriasArray.length} subcategoría{subcategoriasArray.length > 1 ? 's' : ''})
                                  </span>
                                )}
                              </td>
                              <td><strong>{formatCurrency(cat.monto)}</strong></td>
                              <td><strong>{cat.porcentaje.toFixed(1)}%</strong></td>
                              <td><strong>{cat.cantidad}</strong></td>
                              <td><strong>{formatCurrency(cat.promedio)}</strong></td>
                            </tr>
                            
                            {/* Filas de subcategorías (expandible) - Mostrar siempre cuando está expandido */}
                            {isExpanded && (
                              <>
                                {hasSubcategorias ? (
                                  // Mostrar subcategorías si existen
                                  subcategoriasArray.map((sub, subIndex) => {
                                    console.log(`[ESTADISTICAS UI] ✅ Renderizando subcategoría "${sub.nombre}" de "${cat.categoria}":`, sub)
                                    return (
                                      <tr key={`subcat-${index}-${subIndex}`} className="estadisticas-subcategoria-row">
                                        <td></td>
                                        <td>
                                          <span className="estadisticas-subcategoria-indent">↳</span>
                                          <span style={{ fontWeight: 500 }}>{sub.nombre}</span>
                                        </td>
                                        <td className="text-muted">{formatCurrency(sub.monto)}</td>
                                        <td className="text-muted">{sub.porcentaje.toFixed(1)}%</td>
                                        <td className="text-muted">{sub.cantidad}</td>
                                        <td className="text-muted">{formatCurrency(sub.promedio)}</td>
                                      </tr>
                                    )
                                  })
                                ) : (
                                  // Mostrar mensaje si no hay subcategorías
                                  <tr className="estadisticas-subcategoria-row">
                                    <td></td>
                                    <td colSpan={5} style={{ 
                                      padding: '1rem',
                                      textAlign: 'center',
                                      color: '#94a3b8',
                                      fontStyle: 'italic',
                                      fontSize: '0.9rem'
                                    }}>
                                      No hay subcategorías registradas para esta categoría
                                    </td>
                                  </tr>
                                )}
                              </>
                            )}
                          </>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="estadisticas-empty">No hay gastos registrados en este periodo</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Métricas de comportamiento */}
        {metricasComportamiento && (
          <div className="estadisticas-comportamiento-section">
            <h2 className="estadisticas-section-title">Métricas de Comportamiento</h2>
            
            <div className="estadisticas-comportamiento-grid">
              <EstadisticasCard
                titulo="Total Transacciones"
                valor={metricasComportamiento.transacciones.total}
                subtitulo={`${metricasComportamiento.transacciones.ingresos} ingresos, ${metricasComportamiento.transacciones.gastos} gastos`}
                icono="📝"
                color="info"
                formato="number"
              />
              <EstadisticasCard
                titulo="Promedio Diario"
                valor={metricasComportamiento.transacciones.promedioDiario.toFixed(1)}
                subtitulo="Transacciones por día"
                icono="📅"
                color="primary"
                formato="number"
              />
              <EstadisticasCard
                titulo="Gasto Promedio"
                valor={metricasComportamiento.gastoPromedio.porTransaccion}
                subtitulo="Por transacción"
                icono="💳"
                color="warning"
                formato="currency"
              />
              <EstadisticasCard
                titulo="Días Activos"
                valor={metricasComportamiento.diasActivos.conGastos}
                subtitulo={`${metricasComportamiento.diasActivos.porcentajeActividad.toFixed(1)}% de actividad`}
                icono="📊"
                color="success"
                formato="number"
              />
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && !resumen && !error && (
          <div className="estadisticas-empty-state">
            <p>No hay datos disponibles para mostrar</p>
            <p className="estadisticas-empty-subtitle">
              Registra ingresos y gastos para ver tus estadísticas
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

