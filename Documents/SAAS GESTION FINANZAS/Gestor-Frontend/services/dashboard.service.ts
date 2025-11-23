// Servicio de dashboard
// Maneja las llamadas HTTP al backend para el dashboard
// Integración completa con backend MongoDB - NO USAR MOCK

import { API_CONFIG } from '@/config/api'
import type {
  ResumenMesActual,
  GastoReciente,
  GastosPorCategoriaResponse,
  ComparativaMensual,
  AlertaFinanciera,
  DashboardError,
} from '@/models/dashboard'
import {
  ResumenResponseSchema,
  GastosRecientesResponseSchema,
  GastosPorCategoriaResponseSchema,
  ComparativaResponseSchema,
  AlertasResponseSchema,
} from '@/schemas/dashboard.schema'
import { BackendErrorSchema } from '@/schemas/auth.schema'
import { getToken, clearTokens } from '@/utils/jwt'
import { z } from 'zod'

// Telemetría básica: logs de red y latencia
const logRequest = (endpoint: string, method: string, startTime: number) => {
  const duration = Date.now() - startTime
  console.log(`[DASHBOARD API] ${method} ${endpoint} - ${duration}ms`)
}

const logError = (endpoint: string, method: string, status: number, error: string) => {
  console.error(`[DASHBOARD API ERROR] ${method} ${endpoint} - ${status}: ${error}`)
}

/**
 * Realiza una petición HTTP al backend con manejo de errores y validación
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodType<T>
): Promise<T> {
  const token = getToken()
  const startTime = Date.now()
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  // Agregar token de autenticación si existe
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }
  
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`
    const requestOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    }
    
    // Log detallado del request (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('[DASHBOARD API DEBUG]', {
        method: options.method || 'GET',
        url,
        headers: requestOptions.headers,
      })
    }
    
    const response = await fetch(url, requestOptions)
    
    // Log de respuesta cruda
    const responseText = await response.text()
    let data: any
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('[DASHBOARD API] Error al parsear respuesta JSON:', responseText)
      throw {
        message: 'Respuesta inválida del servidor',
        status: response.status,
      } as DashboardError
    }
    
    // Log de request
    logRequest(endpoint, options.method || 'GET', startTime)
    
    if (!response.ok) {
      // Intentar parsear como error del backend
      const errorData = BackendErrorSchema.safeParse(data)
      
      const errorMessage = errorData.success 
        ? errorData.data.error 
        : data.error || data.message || `Error ${response.status}: ${response.statusText}`
      
      const error: DashboardError = {
        error: errorMessage,
        status: response.status,
      }
      
      logError(endpoint, options.method || 'GET', response.status, errorMessage)
      
      // Si es 401, limpiar tokens automáticamente
      if (response.status === 401) {
        clearTokens()
      }
      
      throw error
    }
    
    // Validar respuesta con schema si se proporciona
    if (schema) {
      const validated = schema.safeParse(data)
      if (!validated.success) {
        console.error('[DASHBOARD VALIDATION ERROR]', {
          issues: validated.error.issues,
          data: data,
        })
        throw {
          error: `Respuesta del servidor inválida: ${validated.error.issues[0]?.message || 'Error de validación'}`,
          status: response.status,
        } as DashboardError
      }
      return validated.data
    }
    
    return data
  } catch (error: any) {
    logError(endpoint, options.method || 'GET', error.status || 0, error.error || error.message || 'Network error')
    
    // Si es error de timeout o red
    if (error.name === 'AbortError' || error.name === 'TypeError') {
      throw {
        error: 'Error de conexión. Verifica que el servidor esté disponible.',
        status: 0,
      } as DashboardError
    }
    
    throw error
  }
}

/**
 * Servicio de dashboard
 */
export const dashboardService = {
  /**
   * Obtiene el resumen del mes actual
   * @param carteraId - ID de la cartera para filtrar (opcional)
   */
  async getResumenMesActual(carteraId?: string): Promise<ResumenMesActual> {
    const endpoint = API_CONFIG.ENDPOINTS.DASHBOARD.RESUMEN(carteraId)
    console.log('[DASHBOARD SERVICE] getResumenMesActual - endpoint:', endpoint, 'carteraId:', carteraId)
    
    const response = await fetchAPI(
      endpoint,
      {
        method: 'GET',
      },
      ResumenResponseSchema
    )
    
    console.log('[DASHBOARD SERVICE] getResumenMesActual - respuesta:', response.data)
    return response.data
  },

  /**
   * Obtiene los últimos 7 gastos del mes actual
   * @param carteraId - ID de la cartera para filtrar (opcional)
   */
  async getGastosRecientes(carteraId?: string): Promise<GastoReciente[]> {
    const endpoint = API_CONFIG.ENDPOINTS.DASHBOARD.GASTOS_RECIENTES(carteraId)
    console.log('[DASHBOARD SERVICE] getGastosRecientes - endpoint:', endpoint, 'carteraId:', carteraId)
    
    const response = await fetchAPI(
      endpoint,
      {
        method: 'GET',
      },
      GastosRecientesResponseSchema
    )
    
    console.log('[DASHBOARD SERVICE] getGastosRecientes - cantidad:', response.data?.length || 0)
    return response.data
  },

  /**
   * Obtiene las top 3 categorías con más gastos del mes actual
   * @param carteraId - ID de la cartera para filtrar (opcional)
   */
  async getGastosPorCategoria(carteraId?: string): Promise<GastosPorCategoriaResponse> {
    const response = await fetchAPI(
      API_CONFIG.ENDPOINTS.DASHBOARD.GASTOS_CATEGORIA(carteraId),
      {
        method: 'GET',
      },
      GastosPorCategoriaResponseSchema
    )
    
    return {
      data: response.data,
      total: response.total,
    }
  },

  /**
   * Obtiene la comparativa mensual (mes actual vs mes anterior)
   * @param carteraId - ID de la cartera para filtrar (opcional)
   */
  async getComparativaMensual(carteraId?: string): Promise<ComparativaMensual> {
    const endpoint = API_CONFIG.ENDPOINTS.DASHBOARD.COMPARATIVA(carteraId)
    console.log('[DASHBOARD SERVICE] getComparativaMensual - endpoint:', endpoint, 'carteraId:', carteraId)
    
    const response = await fetchAPI(
      endpoint,
      {
        method: 'GET',
      },
      ComparativaResponseSchema
    )
    
    console.log('[DASHBOARD SERVICE] getComparativaMensual - respuesta:', response.data)
    return response.data
  },

  /**
   * Obtiene las alertas financieras del mes actual
   * @param carteraId - ID de la cartera para filtrar (opcional)
   */
  async getAlertasFinancieras(carteraId?: string): Promise<AlertaFinanciera[]> {
    const response = await fetchAPI(
      API_CONFIG.ENDPOINTS.DASHBOARD.ALERTAS(carteraId),
      {
        method: 'GET',
      },
      AlertasResponseSchema
    )
    
    return response.data
  },
}

