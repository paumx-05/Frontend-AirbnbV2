// Controlador de carteras
// Lógica de negocio y orquestación de las carteras
// Integración completa con backend MongoDB

import { carterasService } from '@/services/carteras.service'
import type { CreateCarteraRequest, UpdateCarteraRequest, CarteraError } from '@/models/carteras'

/**
 * Controlador de carteras
 */
export const carterasController = {
  /**
   * Obtiene todas las carteras del usuario autenticado
   */
  async getCarteras(): Promise<{ success: boolean; carteras?: any[]; error?: string }> {
    try {
      const carteras = await carterasService.getCarteras()
      return {
        success: true,
        carteras,
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al obtener carteras'
      
      if (error.status === 401) {
        return {
          success: false,
          error: 'No autorizado. Por favor, inicia sesión nuevamente.',
        }
      }
      
      if (error.status === 0) {
        return {
          success: false,
          error: 'Error de conexión. Verifica que el servidor esté disponible.',
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  },

  /**
   * Obtiene una cartera por ID
   */
  async getCarteraById(id: string): Promise<{ success: boolean; cartera?: any; error?: string }> {
    try {
      const cartera = await carterasService.getCarteraById(id)
      return {
        success: true,
        cartera,
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al obtener cartera'
      
      if (error.status === 404) {
        return {
          success: false,
          error: 'Cartera no encontrada',
        }
      }
      
      if (error.status === 401) {
        return {
          success: false,
          error: 'No autorizado. Por favor, inicia sesión nuevamente.',
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  },

  /**
   * Crea una nueva cartera
   */
  async createCartera(data: CreateCarteraRequest): Promise<{ success: boolean; cartera?: any; error?: string }> {
    try {
      const cartera = await carterasService.createCartera(data)
      return {
        success: true,
        cartera,
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al crear cartera'
      
      if (error.status === 400) {
        return {
          success: false,
          error: errorMessage,
        }
      }
      
      if (error.status === 401) {
        return {
          success: false,
          error: 'No autorizado. Por favor, inicia sesión nuevamente.',
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  },

  /**
   * Actualiza una cartera existente
   */
  async updateCartera(id: string, data: UpdateCarteraRequest): Promise<{ success: boolean; cartera?: any; error?: string }> {
    try {
      const cartera = await carterasService.updateCartera(id, data)
      return {
        success: true,
        cartera,
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al actualizar cartera'
      
      if (error.status === 404) {
        return {
          success: false,
          error: 'Cartera no encontrada',
        }
      }
      
      if (error.status === 400) {
        return {
          success: false,
          error: errorMessage,
        }
      }
      
      if (error.status === 401) {
        return {
          success: false,
          error: 'No autorizado. Por favor, inicia sesión nuevamente.',
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  },

  /**
   * Elimina una cartera
   * @param id - ID de la cartera a eliminar
   * @param deleteData - Si es true, elimina todos los datos asociados. Si es false, mantiene los datos pero los desasocia (default: false)
   */
  async deleteCartera(id: string, deleteData: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      await carterasService.deleteCartera(id, deleteData)
      return {
        success: true,
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al eliminar cartera'
      
      if (error.status === 404) {
        return {
          success: false,
          error: 'Cartera no encontrada',
        }
      }
      
      if (error.status === 401) {
        return {
          success: false,
          error: 'No autorizado. Por favor, inicia sesión nuevamente.',
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  },
}

