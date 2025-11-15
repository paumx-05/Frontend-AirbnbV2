// Servicio de amigos
// Maneja las llamadas HTTP al backend para amigos
// Integración completa con backend MongoDB

import { API_CONFIG } from '@/config/api'
import type { 
  CreateAmigoRequest,
  EnviarSolicitudRequest,
  UpdateAmigoRequest,
  BackendAmigosResponse,
  BackendAmigoResponse,
  BackendUpdateEstadoResponse,
  BackendDeleteAmigoResponse,
  BackendUsuariosConEstadoResponse,
  BackendEnviarSolicitudResponse,
  BackendSolicitudesResponse,
  BackendAceptarSolicitudResponse,
  BackendRechazarSolicitudResponse,
  BackendError,
  AmigoError,
  Amigo,
  UsuarioConEstado,
  SolicitudAmistad
} from '@/models/amigos'
import { 
  AmigosResponseSchema,
  AmigoResponseSchema,
  UpdateEstadoResponseSchema,
  DeleteAmigoResponseSchema,
  CreateAmigoRequestSchema,
  EnviarSolicitudRequestSchema,
  UpdateAmigoRequestSchema,
  UpdateEstadoRequestSchema,
  UsuariosConEstadoResponseSchema,
  EnviarSolicitudResponseSchema,
  SolicitudesResponseSchema,
  AceptarSolicitudResponseSchema,
  RechazarSolicitudResponseSchema
} from '@/schemas/amigos.schema'
import { BackendErrorSchema } from '@/schemas/auth.schema'
import { getToken, clearTokens } from '@/utils/jwt'
import { z } from 'zod'

// Telemetría básica: logs de red y latencia
const logRequest = (endpoint: string, method: string, startTime: number) => {
  const duration = Date.now() - startTime
  console.log(`[AMIGOS API] ${method} ${endpoint} - ${duration}ms`)
}

const logError = (endpoint: string, method: string, status: number, error: string) => {
  console.error(`[AMIGOS API ERROR] ${method} ${endpoint} - ${status}: ${error}`)
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
      console.log('[AMIGOS API DEBUG]', {
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
      
      const error: AmigoError = {
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
        console.error('[AMIGOS VALIDATION ERROR]', validated.error)
        throw {
          message: 'Respuesta del servidor inválida',
          status: response.status,
        } as AmigoError
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
      } as AmigoError
    }
    
    throw error
  }
}

/**
 * Servicio de amigos
 */
export const amigosService = {
  /**
   * Obtiene todos los amigos del usuario autenticado
   */
  async getAllAmigos(): Promise<Amigo[]> {
    const response = await fetchAPI<BackendAmigosResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.GET_ALL,
      {
        method: 'GET',
      },
      AmigosResponseSchema
    )
    
    return response.data
  },

  /**
   * Obtiene un amigo por ID
   */
  async getAmigoById(id: string): Promise<Amigo> {
    const response = await fetchAPI<BackendAmigoResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.GET_BY_ID(id),
      {
        method: 'GET',
      },
      AmigoResponseSchema
    )
    
    return response.data
  },

  /**
   * Busca amigos por nombre o email
   */
  async searchAmigos(query: string): Promise<Amigo[]> {
    const response = await fetchAPI<BackendAmigosResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.SEARCH(query),
      {
        method: 'GET',
      },
      AmigosResponseSchema
    )
    
    return response.data
  },

  /**
   * Obtiene amigos filtrados por estado
   */
  async getAmigosByEstado(estado: 'activo' | 'pendiente' | 'rechazada' | 'bloqueado'): Promise<Amigo[]> {
    const response = await fetchAPI<BackendAmigosResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.GET_BY_ESTADO(estado),
      {
        method: 'GET',
      },
      AmigosResponseSchema
    )
    
    return response.data
  },

  /**
   * Busca usuarios del sistema (no solo amigos)
   */
  async searchUsuarios(query: string): Promise<UsuarioConEstado[]> {
    const response = await fetchAPI<BackendUsuariosConEstadoResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.SEARCH_USUARIOS(query),
      {
        method: 'GET',
      },
      UsuariosConEstadoResponseSchema
    )
    
    return response.data
  },

  /**
   * Envía una solicitud de amistad a otro usuario
   */
  async enviarSolicitud(amigoUserId: string): Promise<Amigo> {
    // Validar request
    const validated = EnviarSolicitudRequestSchema.safeParse({ amigoUserId })
    if (!validated.success) {
      throw {
        message: validated.error.issues[0].message,
        status: 400,
      } as AmigoError
    }
    
    const response = await fetchAPI<BackendEnviarSolicitudResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.ENVIAR_SOLICITUD,
      {
        method: 'POST',
        body: JSON.stringify(validated.data),
      },
      EnviarSolicitudResponseSchema
    )
    
    return response.data
  },

  /**
   * Obtiene las solicitudes de amistad recibidas
   */
  async getSolicitudesRecibidas(): Promise<SolicitudAmistad[]> {
    const response = await fetchAPI<BackendSolicitudesResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.GET_SOLICITUDES,
      {
        method: 'GET',
      },
      SolicitudesResponseSchema
    )
    
    return response.data
  },

  /**
   * Acepta una solicitud de amistad
   */
  async aceptarSolicitud(solicitudId: string): Promise<void> {
    await fetchAPI<BackendAceptarSolicitudResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.ACEPTAR_SOLICITUD(solicitudId),
      {
        method: 'PUT',
      },
      AceptarSolicitudResponseSchema
    )
  },

  /**
   * Rechaza una solicitud de amistad
   */
  async rechazarSolicitud(solicitudId: string): Promise<void> {
    await fetchAPI<BackendRechazarSolicitudResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.RECHAZAR_SOLICITUD(solicitudId),
      {
        method: 'PUT',
      },
      RechazarSolicitudResponseSchema
    )
  },

  /**
   * Crea un nuevo amigo
   */
  async createAmigo(amigoData: CreateAmigoRequest): Promise<Amigo> {
    // Validar request
    const validated = CreateAmigoRequestSchema.safeParse(amigoData)
    if (!validated.success) {
      throw {
        message: validated.error.issues[0].message,
        status: 400,
      } as AmigoError
    }
    
    const response = await fetchAPI<BackendAmigoResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.CREATE,
      {
        method: 'POST',
        body: JSON.stringify(validated.data),
      },
      AmigoResponseSchema
    )
    
    return response.data
  },

  /**
   * Actualiza un amigo existente
   */
  async updateAmigo(id: string, amigoData: UpdateAmigoRequest): Promise<Amigo> {
    // Validar request
    const validated = UpdateAmigoRequestSchema.safeParse(amigoData)
    if (!validated.success) {
      throw {
        message: validated.error.issues[0].message,
        status: 400,
      } as AmigoError
    }
    
    const response = await fetchAPI<BackendAmigoResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.UPDATE(id),
      {
        method: 'PUT',
        body: JSON.stringify(validated.data),
      },
      AmigoResponseSchema
    )
    
    return response.data
  },

  /**
   * Actualiza el estado de un amigo
   */
  async updateEstadoAmigo(id: string, estado: 'activo' | 'pendiente' | 'rechazada' | 'bloqueado'): Promise<Amigo> {
    // Validar request
    const validated = UpdateEstadoRequestSchema.safeParse({ estado })
    if (!validated.success) {
      throw {
        message: validated.error.issues[0].message,
        status: 400,
      } as AmigoError
    }
    
    await fetchAPI<BackendUpdateEstadoResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.UPDATE_ESTADO(id),
      {
        method: 'PUT',
        body: JSON.stringify(validated.data),
      },
      UpdateEstadoResponseSchema
    )
    
    // Obtener el amigo completo actualizado
    return this.getAmigoById(id)
  },

  /**
   * Elimina un amigo
   */
  async deleteAmigo(id: string): Promise<void> {
    await fetchAPI<BackendDeleteAmigoResponse>(
      API_CONFIG.ENDPOINTS.AMIGOS.DELETE(id),
      {
        method: 'DELETE',
      },
      DeleteAmigoResponseSchema
    )
  },
}

