// Modelos de chat
// Define las interfaces y tipos relacionados con mensajes de chat entre usuarios
// Alineados con la respuesta del backend

export interface MensajeChat {
  _id: string
  remitenteId: string
  destinatarioId: string
  amigoId: string
  contenido: string
  esSistema: boolean
  leido: boolean
  createdAt: string // ISO date string
}

// Request para enviar un mensaje de chat
export interface SendMensajeRequest {
  contenido: string
  esSistema?: boolean
}

// Respuesta del backend para obtener lista de chats
export interface BackendChatsResponse {
  success: boolean
  data: Chat[]
}

// Respuesta del backend para obtener mensajes de un chat
export interface BackendMensajesChatResponse {
  success: boolean
  data: MensajeChat[]
}

// Respuesta del backend para enviar mensaje
export interface BackendMensajeChatResponse {
  success: boolean
  data: MensajeChat
  message?: string
}

// Respuesta del backend para marcar como leído
export interface BackendMarkChatLeidoResponse {
  success: boolean
  data: {
    mensajesActualizados: number
  }
  message?: string
}

// Chat con información del amigo y último mensaje
export interface Chat {
  amigoId: string
  amigoNombre: string
  amigoEmail: string
  ultimoMensaje: {
    contenido: string
    fecha: string
    esSistema: boolean
  } | null
  noLeidos: number
}

// Error del backend
export interface BackendError {
  success: false
  error: string
  message?: string
}

// Error personalizado para chat
export interface ChatError {
  message: string
  status?: number
}

