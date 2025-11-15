// Modelos de amigos
// Define las interfaces y tipos relacionados con amigos
// Alineados con la respuesta del backend

export interface Amigo {
  _id: string
  userId: string
  amigoUserId: string // ID del usuario que es el amigo
  nombre: string
  email: string
  avatar?: string | null
  estado: 'activo' | 'pendiente' | 'rechazada' | 'bloqueado'
  solicitadoPor?: string // ID del usuario que envió la solicitud
  fechaAmistad?: string // ISO date string (solo para amigos activos)
  createdAt?: string // ISO date string
}

// Usuario con estado de amistad (para búsqueda de usuarios)
export interface UsuarioConEstado {
  _id: string
  nombre: string
  email: string
  avatar?: string | null
  estadoAmistad: 'pendiente' | 'activo' | 'rechazada' | 'bloqueado' | null
  esAmigo: boolean
}

// Solicitud de amistad recibida
export interface SolicitudAmistad {
  _id: string
  solicitante: {
    _id: string
    nombre: string
    email: string
    avatar?: string | null
  }
  estado: 'pendiente'
  createdAt: string // ISO date string
}

// Request para crear un amigo (DEPRECADO - usar EnviarSolicitudRequest)
export interface CreateAmigoRequest {
  nombre: string
  email: string
  avatar?: string
  estado?: 'activo' | 'pendiente' | 'bloqueado'
}

// Request para enviar solicitud de amistad
export interface EnviarSolicitudRequest {
  amigoUserId: string
}

// Request para aceptar/rechazar solicitud
export interface AceptarSolicitudResponse {
  _id: string
  estado: 'activo'
  fechaAmistad: string
}

// Request para actualizar un amigo (todos los campos opcionales)
export interface UpdateAmigoRequest {
  nombre?: string
  email?: string
  avatar?: string
  estado?: 'activo' | 'pendiente' | 'rechazada' | 'bloqueado'
}

// Respuesta del backend para obtener amigos
export interface BackendAmigosResponse {
  success: boolean
  data: Amigo[]
}

// Respuesta del backend para obtener un amigo
export interface BackendAmigoResponse {
  success: boolean
  data: Amigo
  message?: string
}

// Respuesta del backend para actualizar estado
export interface BackendUpdateEstadoResponse {
  success: boolean
  data: {
    _id: string
    estado: 'activo' | 'pendiente' | 'rechazada' | 'bloqueado'
  }
  message?: string
}

// Respuesta del backend para buscar usuarios
export interface BackendUsuariosConEstadoResponse {
  success: boolean
  data: UsuarioConEstado[]
}

// Respuesta del backend para enviar solicitud
export interface BackendEnviarSolicitudResponse {
  success: boolean
  data: Amigo
  message?: string
}

// Respuesta del backend para obtener solicitudes
export interface BackendSolicitudesResponse {
  success: boolean
  data: SolicitudAmistad[]
}

// Respuesta del backend para aceptar solicitud
export interface BackendAceptarSolicitudResponse {
  success: boolean
  data: AceptarSolicitudResponse
  message?: string
}

// Respuesta del backend para rechazar solicitud
export interface BackendRechazarSolicitudResponse {
  success: boolean
  message: string
}

// Respuesta del backend para eliminar amigo
export interface BackendDeleteAmigoResponse {
  success: boolean
  message: string
}

// Error del backend
export interface BackendError {
  success: false
  error: string
  message?: string
}

// Error personalizado para amigos
export interface AmigoError {
  message: string
  status?: number
}

