// Modelos de mensajes
// Define las interfaces y tipos relacionados con mensajes
// Alineados con la respuesta del backend

export interface Mensaje {
  _id: string
  userId: string
  remitente: string
  asunto: string
  contenido: string
  leido: boolean
  createdAt: string // ISO date string
}

// Request para crear un mensaje
export interface CreateMensajeRequest {
  remitente: string
  asunto: string
  contenido: string
  leido?: boolean
}

// Respuesta del backend para obtener mensajes
export interface BackendMensajesResponse {
  success: boolean
  data: Mensaje[]
}

// Respuesta del backend para obtener un mensaje
export interface BackendMensajeResponse {
  success: boolean
  data: Mensaje
  message?: string
}

// Respuesta del backend para marcar como leído
export interface BackendMarkLeidoResponse {
  success: boolean
  data: Mensaje
  message?: string
}

// Respuesta del backend para marcar todos como leídos
export interface BackendMarkAllLeidosResponse {
  success: boolean
  data: {
    mensajesActualizados: number
  }
  message?: string
}

// Respuesta del backend para eliminar mensaje
export interface BackendDeleteMensajeResponse {
  success: boolean
  message: string
}

// Respuesta del backend para eliminar todos los mensajes
export interface BackendDeleteAllMensajesResponse {
  success: boolean
  data: {
    mensajesEliminados: number
  }
  message?: string
}

// Error del backend
export interface BackendError {
  success: false
  error: string
  message?: string
}

// Error personalizado para mensajes
export interface MensajeError {
  message: string
  status?: number
}

