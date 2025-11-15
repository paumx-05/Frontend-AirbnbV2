// Servicio de mensajes
// Maneja las llamadas HTTP al backend para mensajes
// Integración completa con backend MongoDB

import { API_CONFIG } from '@/config/api'
import type { 
  CreateMensajeRequest,
  BackendMensajesResponse,
  BackendMensajeResponse,
  BackendMarkLeidoResponse,
  BackendMarkAllLeidosResponse,
  BackendDeleteMensajeResponse,
  BackendDeleteAllMensajesResponse,
  BackendError,
  MensajeError,
  Mensaje
} from '@/models/mensajes'
import { 
  MensajesResponseSchema,
  MensajeResponseSchema,
  MarkAllLeidosResponseSchema,
  DeleteMensajeResponseSchema,
  DeleteAllMensajesResponseSchema,
  CreateMensajeRequestSchema
} from '@/schemas/mensajes.schema'
import { BackendErrorSchema } from '@/schemas/auth.schema'
import { getToken, clearTokens } from '@/utils/jwt'
import { z } from 'zod'

// Telemetría básica: logs de red y latencia
const logRequest = (endpoint: string, method: string, startTime: number) => {
  const duration = Date.now() - startTime
  console.log(`[MENSAJES API] ${method} ${endpoint} - ${duration}ms`)
}

const logError = (endpoint: string, method: string, status: number, error: string) => {
  console.error(`[MENSAJES API ERROR] ${method} ${endpoint} - ${status}: ${error}`)
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
      console.log('[MENSAJES API DEBUG]', {
        method: options.method || 'GET',
        url,
        headers: requestOptions.headers,
        body: options.body ? JSON.parse(options.body as string) : undefined,
      })
    }
    
    const response = await fetch(url, requestOptions)
    
    const data = await response.json()
    
    // Log de request
    logRequest(endpoint, options.method || 'GET', startTime)
    
    if (!response.ok) {
      // Intentar parsear como error del backend
      const errorData = BackendErrorSchema.safeParse(data)
      
      const error: MensajeError = {
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
      const validated = schema.safeParse(data)
      if (!validated.success) {
        console.error('[MENSAJES VALIDATION ERROR]', validated.error)
        throw {
          message: 'Respuesta del servidor inválida',
          status: response.status,
        } as MensajeError
      }
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
      } as MensajeError
    }
    
    throw error
  }
}

/**
 * Servicio de mensajes
 */
export const mensajesService = {
  /**
   * Obtiene todos los mensajes del usuario autenticado
   * @param leido - Opcional: filtrar por estado de lectura (true/false)
   */
  async getMensajes(leido?: boolean): Promise<Mensaje[]> {
    const response = await fetchAPI<BackendMensajesResponse>(
      API_CONFIG.ENDPOINTS.MENSAJES.GET_ALL(leido),
      {
        method: 'GET',
      },
      MensajesResponseSchema
    )
    
    return response.data
  },

  /**
   * Obtiene un mensaje por ID
   */
  async getMensajeById(id: string): Promise<Mensaje> {
    const response = await fetchAPI<BackendMensajeResponse>(
      API_CONFIG.ENDPOINTS.MENSAJES.GET_BY_ID(id),
      {
        method: 'GET',
      },
      MensajeResponseSchema
    )
    
    return response.data
  },

  /**
   * Crea un nuevo mensaje
   */
  async createMensaje(mensajeData: CreateMensajeRequest): Promise<Mensaje> {
    // Validar request
    const validated = CreateMensajeRequestSchema.safeParse(mensajeData)
    if (!validated.success) {
      throw {
        message: validated.error.issues[0].message,
        status: 400,
      } as MensajeError
    }
    
    const response = await fetchAPI<BackendMensajeResponse>(
      API_CONFIG.ENDPOINTS.MENSAJES.CREATE,
      {
        method: 'POST',
        body: JSON.stringify(validated.data),
      },
      MensajeResponseSchema
    )
    
    return response.data
  },

  /**
   * Marca un mensaje como leído
   */
  async markAsLeido(id: string): Promise<Mensaje> {
    const response = await fetchAPI<BackendMarkLeidoResponse>(
      API_CONFIG.ENDPOINTS.MENSAJES.MARK_AS_LEIDO(id),
      {
        method: 'PUT',
      },
      MensajeResponseSchema
    )
    
    return response.data
  },

  /**
   * Marca todos los mensajes como leídos
   */
  async markAllAsLeidos(): Promise<{ mensajesActualizados: number }> {
    const response = await fetchAPI<BackendMarkAllLeidosResponse>(
      API_CONFIG.ENDPOINTS.MENSAJES.MARK_ALL_AS_LEIDOS,
      {
        method: 'PUT',
      },
      MarkAllLeidosResponseSchema
    )
    
    return response.data
  },

  /**
   * Elimina un mensaje
   */
  async deleteMensaje(id: string): Promise<void> {
    await fetchAPI<BackendDeleteMensajeResponse>(
      API_CONFIG.ENDPOINTS.MENSAJES.DELETE(id),
      {
        method: 'DELETE',
      },
      DeleteMensajeResponseSchema
    )
  },

  /**
   * Elimina todos los mensajes del usuario
   */
  async deleteAllMensajes(): Promise<{ mensajesEliminados: number }> {
    const response = await fetchAPI<BackendDeleteAllMensajesResponse>(
      API_CONFIG.ENDPOINTS.MENSAJES.DELETE_ALL,
      {
        method: 'DELETE',
      },
      DeleteAllMensajesResponseSchema
    )
    
    return response.data
  },
}

