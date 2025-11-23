// Hook personalizado para gestión de carteras
// Proporciona funciones helper para trabajar con carteras

import { useCarteraContext } from '@/contexts/CarteraContext'
import { carterasController } from '@/controllers/carteras.controller'
import type { CreateCarteraRequest, UpdateCarteraRequest } from '@/models/carteras'

export function useCartera() {
  // Verificar que estamos en el cliente antes de usar el contexto
  if (typeof window === 'undefined') {
    // En el servidor, retornar valores por defecto
    return {
      carteraActiva: null,
      carteras: [],
      carteraActivaId: null,
      loading: true,
      error: null,
      setCarteraActiva: () => {},
      setCarteraActivaId: () => {},
      refreshCarteras: async () => {},
      createCartera: async () => ({ success: false, error: 'No disponible en servidor' }),
      updateCartera: async () => ({ success: false, error: 'No disponible en servidor' }),
      deleteCartera: async () => ({ success: false, error: 'No disponible en servidor' }),
    }
  }
  
  const context = useCarteraContext()

  /**
   * Crea una nueva cartera
   */
  const createCartera = async (data: CreateCarteraRequest) => {
    try {
      const result = await carterasController.createCartera(data)
      if (result.success && result.cartera) {
        // Recargar lista de carteras
        await context.refreshCarteras()
        // Opcionalmente, establecer la nueva cartera como activa
        if (result.cartera) {
          context.setCarteraActiva(result.cartera)
        }
        return { success: true, cartera: result.cartera }
      }
      return { success: false, error: result.error || 'Error al crear cartera' }
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al crear cartera' }
    }
  }

  /**
   * Actualiza una cartera existente
   */
  const updateCartera = async (id: string, data: UpdateCarteraRequest) => {
    try {
      const result = await carterasController.updateCartera(id, data)
      if (result.success && result.cartera) {
        // Recargar lista de carteras
        await context.refreshCarteras()
        // Si la cartera actualizada es la activa, actualizarla
        if (context.carteraActivaId === id) {
          context.setCarteraActiva(result.cartera)
        }
        return { success: true, cartera: result.cartera }
      }
      return { success: false, error: result.error || 'Error al actualizar cartera' }
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al actualizar cartera' }
    }
  }

  /**
   * Elimina una cartera
   * @param id - ID de la cartera a eliminar
   * @param deleteData - Si es true, elimina todos los datos asociados. Si es false, mantiene los datos pero los desasocia (default: false)
   */
  const deleteCartera = async (id: string, deleteData: boolean = false) => {
    try {
      const result = await carterasController.deleteCartera(id, deleteData)
      if (result.success) {
        // Si la cartera eliminada era la activa, cambiar a otra o null
        if (context.carteraActivaId === id) {
          const otrasCarteras = context.carteras.filter(c => c._id !== id)
          if (otrasCarteras.length > 0) {
            context.setCarteraActiva(otrasCarteras[0])
          } else {
            context.setCarteraActiva(null)
          }
        }
        // Recargar lista de carteras
        await context.refreshCarteras()
        return { success: true }
      }
      return { success: false, error: result.error || 'Error al eliminar cartera' }
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al eliminar cartera' }
    }
  }

  return {
    // Estado del contexto
    carteraActiva: context.carteraActiva,
    carteras: context.carteras,
    carteraActivaId: context.carteraActivaId,
    loading: context.loading,
    error: context.error,
    
    // Funciones del contexto
    setCarteraActiva: context.setCarteraActiva,
    setCarteraActivaId: context.setCarteraActivaId,
    refreshCarteras: context.refreshCarteras,
    
    // Funciones adicionales
    createCartera,
    updateCartera,
    deleteCartera,
  }
}

