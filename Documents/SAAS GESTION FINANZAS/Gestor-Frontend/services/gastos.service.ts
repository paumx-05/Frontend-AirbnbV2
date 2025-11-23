// Servicio de gastos
// Maneja las llamadas HTTP al backend para gastos
// Integración completa con backend MongoDB

import { API_CONFIG } from '@/config/api'
import type { 
  CreateGastoRequest,
  UpdateGastoRequest,
  BackendGastosResponse,
  BackendGastoResponse,
  BackendTotalGastosResponse,
  BackendDeleteGastoResponse,
  BackendError,
  GastoError,
  Gasto
} from '@/models/gastos'
import { 
  GastosResponseSchema,
  GastoResponseSchema,
  TotalGastosResponseSchema,
  DeleteGastoResponseSchema,
  CreateGastoRequestSchema,
  UpdateGastoRequestSchema
} from '@/schemas/gastos.schema'
import { BackendErrorSchema } from '@/schemas/auth.schema'
import { getToken, clearTokens, decodeToken } from '@/utils/jwt'
import { z } from 'zod'

// Telemetría básica: logs de red y latencia
const logRequest = (endpoint: string, method: string, startTime: number) => {
  const duration = Date.now() - startTime
  console.log(`[GASTOS API] ${method} ${endpoint} - ${duration}ms`)
}

const logError = (endpoint: string, method: string, status: number, error: string) => {
  console.error(`[GASTOS API ERROR] ${method} ${endpoint} - ${status}: ${error}`)
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
  
  // Log del token para depuración
  if (token) {
    try {
      const decoded = decodeToken(token)
      if (decoded) {
        console.log('[GASTOS API] Token decodificado:', {
          userId: decoded.userId,
          email: decoded.email,
          exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A'
        })
      } else {
        console.log('[GASTOS API] Token no pudo ser decodificado (puede ser mock)')
      }
    } catch (e) {
      console.log('[GASTOS API] Error al decodificar token:', e)
    }
  } else {
    console.warn('[GASTOS API] No hay token disponible')
  }
  
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
    if (process.env.NODE_ENV === 'development' || true) {
      console.log('[GASTOS API DEBUG]', {
        method: options.method || 'GET',
        url,
        headers: requestOptions.headers,
        body: options.body ? JSON.parse(options.body as string) : undefined,
      })
    }
    
    const response = await fetch(url, requestOptions)
    
    // Log de respuesta cruda
    const responseText = await response.text()
    let data: any
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('[GASTOS API] Error al parsear respuesta JSON:', responseText)
      throw {
        message: 'Respuesta inválida del servidor',
        status: response.status,
      } as GastoError
    }
    
    // Log de request
    logRequest(endpoint, options.method || 'GET', startTime)
    
    if (!response.ok) {
      // Intentar parsear como error del backend
      const errorData = BackendErrorSchema.safeParse(data)
      
      const error: GastoError = {
        message: errorData.success 
          ? errorData.data.error 
          : data.error || data.message || `Error ${response.status}: ${response.statusText}`,
        status: response.status,
      }
      
      logError(endpoint, options.method || 'GET', response.status, error.message)
      
      // Si es 401, limpiar tokens automáticamente
      if (response.status === 401) {
        clearTokens()
      }
      
      throw error
    }
    
    // Validar respuesta con schema si se proporciona
    if (schema) {
      console.log('[GASTOS API] Validando respuesta con schema:', data)
      const validated = schema.safeParse(data)
      if (!validated.success) {
        console.error('[GASTOS VALIDATION ERROR]', {
          issues: validated.error.issues,
          data: data,
        })
        throw {
          message: `Respuesta del servidor inválida: ${validated.error.issues[0]?.message || 'Error de validación'}`,
          status: response.status,
        } as GastoError
      }
      console.log('[GASTOS API] Validación exitosa:', validated.data)
      return validated.data
    }
    
    return data
  } catch (error: any) {
    logError(endpoint, options.method || 'GET', error.status || 0, error.message || 'Network error')
    
    // Si es error de timeout o red
    if (error.name === 'AbortError' || error.name === 'TypeError') {
      throw {
        message: 'Error de conexión. Verifica que el servidor esté disponible.',
        status: 0,
      } as GastoError
    }
    
    throw error
  }
}

/**
 * Servicio de gastos
 */
export const gastosService = {
  /**
   * Obtiene todos los gastos de un mes específico
   * @param mes - Mes en formato español (ej: 'noviembre')
   * @param carteraId - ID de la cartera para filtrar (opcional)
   */
  async getGastosByMes(mes: string, carteraId?: string): Promise<{ gastos: Gasto[]; total: number }> {
    const response = await fetchAPI<BackendGastosResponse>(
      API_CONFIG.ENDPOINTS.GASTOS.GET_BY_MES(mes, carteraId),
      {
        method: 'GET',
      },
      GastosResponseSchema
    )
    
    // Calcular total si no viene del backend
    const totalCalculado = response.total !== undefined 
      ? response.total 
      : (response.data || []).reduce((sum: number, gasto: Gasto) => sum + gasto.monto, 0)
    
    // Log para depuración - Detallado para gastos con subcategorías
    const gastosConSubcategoria = response.data?.filter((g: any) => g.subcategoria && g.subcategoria.trim() !== '') || []
    console.log('[GASTOS SERVICE] Respuesta del backend:', {
      mes,
      cantidadGastos: response.data?.length || 0,
      gastosConSubcategoria: gastosConSubcategoria.length,
      totalDelBackend: response.total,
      totalCalculado: totalCalculado,
    })
    
    // Log detallado de gastos con subcategorías
    if (gastosConSubcategoria.length > 0) {
      console.log('[GASTOS SERVICE] 📋 Gastos con subcategoría en mes', mes, ':', gastosConSubcategoria.map((g: any) => ({
        id: g._id,
        categoria: g.categoria,
        subcategoria: g.subcategoria,
        monto: g.monto,
        fecha: g.fecha
      })))
    }
    
    // Log de gastos de Ropa específicamente
    const gastosRopa = response.data?.filter((g: any) => g.categoria && g.categoria.toLowerCase().includes('ropa')) || []
    if (gastosRopa.length > 0) {
      console.log('[GASTOS SERVICE] 👕 Gastos de Ropa en mes', mes, ':', gastosRopa.map((g: any) => ({
        id: g._id,
        categoria: g.categoria,
        subcategoria: g.subcategoria,
        subcategoriaType: typeof g.subcategoria,
        subcategoriaIsNull: g.subcategoria === null,
        subcategoriaIsUndefined: g.subcategoria === undefined,
        monto: g.monto,
        fecha: g.fecha,
        todasLasPropiedades: Object.keys(g)
      })))
    }
    
    // El backend devuelve { success: true, data: [...], total: ... }
    // Si total no viene, lo calculamos sumando los montos
    return {
      gastos: response.data || [],
      total: totalCalculado,
    }
  },

  /**
   * Crea un nuevo gasto
   */
  async createGasto(gastoData: CreateGastoRequest): Promise<Gasto> {
    // Construir objeto limpio ANTES de validar, solo incluir campos con valor válido
    const cleanData: any = {
      descripcion: gastoData.descripcion,
      monto: gastoData.monto,
      fecha: gastoData.fecha,
      categoria: gastoData.categoria,
    }
    
    // Solo incluir mes si tiene valor
    if (gastoData.mes) {
      cleanData.mes = gastoData.mes
    }
    
    // IMPORTANTE: Procesar subcategoria según documentación del backend
    // Si tiene valor (string no vacío), incluir como string
    // Si no tiene valor, incluir como null (NO undefined)
    if (gastoData.subcategoria && gastoData.subcategoria.trim().length > 0) {
      cleanData.subcategoria = gastoData.subcategoria.trim()
    } else {
      cleanData.subcategoria = null // Enviar null explícito, NO undefined
    }
    
    // IMPORTANTE: Solo incluir carteraId si tiene un valor válido (no null, no undefined, no string vacío)
    if (gastoData.carteraId && gastoData.carteraId.trim() !== '') {
      cleanData.carteraId = gastoData.carteraId
    }
    
    // Solo incluir dividido si tiene elementos
    if (gastoData.dividido && gastoData.dividido.length > 0) {
      cleanData.dividido = gastoData.dividido
    }
    
    // Validar request después de limpiar
    const validated = CreateGastoRequestSchema.safeParse(cleanData)
    if (!validated.success) {
      throw {
        message: validated.error.issues[0].message,
        status: 400,
      } as GastoError
    }
    
    // Asegurar que el objeto final no tenga campos undefined
    const finalData: any = {
      descripcion: validated.data.descripcion,
      monto: validated.data.monto,
      fecha: validated.data.fecha,
      categoria: validated.data.categoria,
    }
    
    if (validated.data.mes) {
      finalData.mes = validated.data.mes
    }
    
    // IMPORTANTE: Incluir subcategoria siempre (null o string)
    finalData.subcategoria = validated.data.subcategoria !== undefined 
      ? (validated.data.subcategoria && validated.data.subcategoria.trim().length > 0 
          ? validated.data.subcategoria.trim() 
          : null)
      : null
    
    // Solo incluir carteraId si está presente y tiene valor válido
    if (validated.data.carteraId && validated.data.carteraId.trim() !== '') {
      finalData.carteraId = validated.data.carteraId
    }
    
    if (validated.data.dividido && validated.data.dividido.length > 0) {
      finalData.dividido = validated.data.dividido
    }
    
    console.log('[GASTOS SERVICE] Creando gasto:', {
      descripcion: finalData.descripcion,
      monto: finalData.monto,
      fecha: finalData.fecha,
      categoria: finalData.categoria,
      subcategoria: finalData.subcategoria !== null ? finalData.subcategoria : 'null (sin subcategoría)',
      mes: finalData.mes || 'no incluido',
      carteraId: finalData.carteraId || 'no incluido',
      dividido: finalData.dividido ? `${finalData.dividido.length} elementos` : 'no incluido'
    })
    
    // DEBUG: Ver qué se está enviando al backend
    console.log('[GASTOS SERVICE] 📤 Request body completo:', JSON.stringify(finalData, null, 2))
    console.log('[GASTOS SERVICE] 📤 Tipo de subcategoria:', typeof finalData.subcategoria)
    console.log('[GASTOS SERVICE] 📤 Valor de subcategoria:', finalData.subcategoria)
    
    const response = await fetchAPI<BackendGastoResponse>(
      API_CONFIG.ENDPOINTS.GASTOS.CREATE,
      {
        method: 'POST',
        body: JSON.stringify(finalData),
      },
      GastoResponseSchema
    )
    
    console.log('[GASTOS SERVICE] Gasto creado exitosamente:', {
      id: response.data._id,
      userId: response.data.userId,
      descripcion: response.data.descripcion,
      carteraId: response.data.carteraId || 'sin cartera'
    })
    
    return response.data
  },

  /**
   * Actualiza un gasto existente
   */
  async updateGasto(id: string, gastoData: UpdateGastoRequest): Promise<Gasto> {
    // Construir objeto limpio procesando subcategoria correctamente
    const cleanData: any = {}
    
    // Incluir solo campos que están presentes
    if (gastoData.descripcion !== undefined) {
      cleanData.descripcion = gastoData.descripcion
    }
    if (gastoData.monto !== undefined) {
      cleanData.monto = gastoData.monto
    }
    if (gastoData.fecha !== undefined) {
      cleanData.fecha = gastoData.fecha
    }
    if (gastoData.categoria !== undefined) {
      cleanData.categoria = gastoData.categoria
    }
    if (gastoData.mes !== undefined) {
      cleanData.mes = gastoData.mes
    }
    
    // IMPORTANTE: Procesar subcategoria según documentación del backend
    // Si está presente en el update, procesarlo correctamente
    if (gastoData.subcategoria !== undefined) {
      if (gastoData.subcategoria && gastoData.subcategoria.trim().length > 0) {
        cleanData.subcategoria = gastoData.subcategoria.trim()
      } else {
        cleanData.subcategoria = null // Enviar null explícito, NO undefined
      }
    }
    
    if (gastoData.carteraId !== undefined) {
      if (gastoData.carteraId && gastoData.carteraId.trim() !== '') {
        cleanData.carteraId = gastoData.carteraId
      }
    }
    
    if (gastoData.dividido !== undefined) {
      if (gastoData.dividido && gastoData.dividido.length > 0) {
        cleanData.dividido = gastoData.dividido
      }
    }
    
    // Validar request
    const validated = UpdateGastoRequestSchema.safeParse(cleanData)
    if (!validated.success) {
      throw {
        message: validated.error.issues[0].message,
        status: 400,
      } as GastoError
    }
    
    // Asegurar que subcategoria sea null o string (nunca undefined)
    const finalData: any = { ...validated.data }
    if (finalData.subcategoria !== undefined && (!finalData.subcategoria || finalData.subcategoria.trim().length === 0)) {
      finalData.subcategoria = null
    }
    
    console.log('[GASTOS SERVICE] Actualizando gasto:', {
      id,
      subcategoria: finalData.subcategoria !== undefined 
        ? (finalData.subcategoria !== null ? finalData.subcategoria : 'null (sin subcategoría)')
        : 'no incluido en update'
    })
    
    // DEBUG: Ver qué se está enviando al backend
    console.log('[GASTOS SERVICE] 📤 Update request body:', JSON.stringify(finalData, null, 2))
    
    const response = await fetchAPI<BackendGastoResponse>(
      API_CONFIG.ENDPOINTS.GASTOS.UPDATE(id),
      {
        method: 'PUT',
        body: JSON.stringify(validated.data),
      },
      GastoResponseSchema
    )
    
    return response.data
  },

  /**
   * Elimina un gasto
   */
  async deleteGasto(id: string): Promise<void> {
    await fetchAPI<BackendDeleteGastoResponse>(
      API_CONFIG.ENDPOINTS.GASTOS.DELETE(id),
      {
        method: 'DELETE',
      },
      DeleteGastoResponseSchema
    )
  },

  /**
   * Obtiene el total de gastos de un mes
   * @param mes - Mes en formato español (ej: 'noviembre')
   * @param carteraId - ID de la cartera para filtrar (opcional)
   */
  async getTotalByMes(mes: string, carteraId?: string): Promise<number> {
    const response = await fetchAPI<BackendTotalGastosResponse>(
      API_CONFIG.ENDPOINTS.GASTOS.GET_TOTAL(mes, carteraId),
      {
        method: 'GET',
      },
      TotalGastosResponseSchema
    )
    
    return response.data.total || 0
  },

  /**
   * Obtiene gastos filtrados por categoría en un mes
   * @param mes - Mes en formato español (ej: 'noviembre')
   * @param categoria - Nombre de la categoría
   * @param carteraId - ID de la cartera para filtrar (opcional)
   */
  async getGastosByCategoria(mes: string, categoria: string, carteraId?: string): Promise<{ gastos: Gasto[]; total: number }> {
    const response = await fetchAPI<BackendGastosResponse>(
      API_CONFIG.ENDPOINTS.GASTOS.GET_BY_CATEGORIA(mes, categoria, carteraId),
      {
        method: 'GET',
      },
      GastosResponseSchema
    )
    
    // Calcular total si no viene del backend
    const totalCalculado = response.total !== undefined 
      ? response.total 
      : (response.data || []).reduce((sum: number, gasto: Gasto) => sum + gasto.monto, 0)
    
    // El backend devuelve { success: true, data: [...], total: ... }
    // Si total no viene, lo calculamos sumando los montos
    return {
      gastos: response.data || [],
      total: totalCalculado,
    }
  },
}

