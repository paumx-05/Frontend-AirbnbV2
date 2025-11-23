// Modelos de carteras
// Define las interfaces y tipos relacionados con carteras
// Alineados con la respuesta del backend

export interface Cartera {
  _id: string
  userId: string
  nombre: string
  descripcion?: string
  createdAt: string // ISO date string
  updatedAt?: string // ISO date string
}

// Request para crear una cartera
export interface CreateCarteraRequest {
  nombre: string
  descripcion?: string
}

// Request para actualizar una cartera (todos los campos opcionales)
// descripcion puede ser null para eliminar la descripción
export interface UpdateCarteraRequest {
  nombre?: string
  descripcion?: string | null
}

// Respuesta del backend para obtener todas las carteras
export interface BackendCarterasResponse {
  success: boolean
  data: Cartera[]
}

// Respuesta del backend para obtener una cartera
export interface BackendCarteraResponse {
  success: boolean
  data: Cartera
  message?: string
}

// Respuesta del backend para eliminar cartera
export interface BackendDeleteCarteraResponse {
  success: boolean
  message: string
}

// Error del backend (reutilizado de auth)
export interface BackendError {
  success: false
  error: string
  message?: string
}

// Error personalizado para carteras
export interface CarteraError {
  message: string
  status?: number
}

