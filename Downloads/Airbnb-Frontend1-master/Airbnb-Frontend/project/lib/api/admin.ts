/**
 * Servicios de API para el panel de administración
 * Métricas y estadísticas de usuarios para admins
 */

import { apiClient } from './config';
import { 
  UserMetricsSchema, 
  UsersListSchema, 
  UserStatsSchema, 
  ActivityMetricsSchema,
  AdminRoleSchema,
  AdminResponseSchema,
  type UserMetrics,
  type UsersList,
  type UserStats,
  type ActivityMetrics,
  type AdminRole,
  type AdminResponse
} from '@/schemas/admin';

// Re-exportar tipos desde schemas para compatibilidad
export type { UserMetrics, UsersList, UserStats, ActivityMetrics, AdminRole, AdminResponse };

/**
 * Servicios de administración para métricas de usuarios
 */
export const adminService = {
  /**
   * Obtener métricas generales de usuarios
   * GET /api/users/stats
   */
  async getUserMetrics(): Promise<AdminResponse> {
    try {
      console.log('🔍 [adminService] Obteniendo métricas de usuarios...');
      
      const response = await apiClient.get<AdminResponse>('/api/users/stats');
      
      // Validar respuesta con Zod
      const validatedResponse = AdminResponseSchema.parse(response);
      
      if (validatedResponse.success && validatedResponse.data) {
        // Validar datos de métricas
        const validatedMetrics = UserMetricsSchema.parse(validatedResponse.data);
        console.log('✅ [adminService] Métricas obtenidas y validadas:', validatedMetrics);
        
        return {
          success: true,
          data: validatedMetrics,
          message: 'Métricas obtenidas exitosamente'
        };
      } else {
        console.log('❌ [adminService] Error obteniendo métricas:', validatedResponse.message);
        return validatedResponse;
      }
    } catch (error) {
      console.error('💥 [adminService] Error obteniendo métricas:', error);
      
      // En desarrollo, usar datos mock como fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('🎭 [adminService] Usando datos mock como fallback');
        return {
          success: true,
          data: {
            totalUsers: 1250,
            activeUsers: 1100,
            inactiveUsers: 150,
            verifiedUsers: 1000,
            unverifiedUsers: 250,
            newUsersToday: 15,
            newUsersThisWeek: 95,
            newUsersThisMonth: 420,
            registrationGrowth: 12.5,
            lastUpdated: new Date().toISOString()
          },
          message: 'Datos mock (desarrollo)'
        };
      }
      
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  },

  /**
   * Obtener lista de usuarios para administración
   * GET /api/users?page=1&limit=10
   */
  async getUsersForAdmin(page: number = 1, limit: number = 10): Promise<AdminResponse> {
    try {
      console.log('🔍 [adminService] Obteniendo lista de usuarios para admin...');
      
      const response = await apiClient.get<AdminResponse>(`/api/users?page=${page}&limit=${limit}`);
      
      // Validar respuesta con Zod
      const validatedResponse = AdminResponseSchema.parse(response);
      
      if (validatedResponse.success && validatedResponse.data) {
        // Validar datos de lista de usuarios
        const validatedUsersList = UsersListSchema.parse(validatedResponse.data);
        console.log('✅ [adminService] Lista de usuarios obtenida y validada:', validatedUsersList.total);
        
        return {
          success: true,
          data: validatedUsersList,
          message: 'Lista de usuarios obtenida exitosamente'
        };
      } else {
        console.log('❌ [adminService] Error obteniendo lista:', validatedResponse.message);
        return validatedResponse;
      }
    } catch (error) {
      console.error('💥 [adminService] Error obteniendo lista:', error);
      
      // En desarrollo, usar datos mock como fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('🎭 [adminService] Usando datos mock como fallback');
        return {
          success: true,
          data: {
            users: [
              {
                id: 'user-1',
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan@ejemplo.com',
                isActive: true,
                isVerified: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              {
                id: 'user-2',
                firstName: 'María',
                lastName: 'García',
                email: 'maria@ejemplo.com',
                isActive: true,
                isVerified: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ],
            total: 2,
            page: page,
            limit: limit,
            totalPages: 1
          },
          message: 'Datos mock (desarrollo)'
        };
      }
      
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  },

  /**
   * Obtener métricas de actividad de usuarios
   * GET /api/users/stats (incluye métricas de actividad)
   */
  async getActivityMetrics(): Promise<AdminResponse> {
    try {
      console.log('🔍 [adminService] Obteniendo métricas de actividad...');
      
      const response = await apiClient.get<AdminResponse>('/api/users/stats');
      
      if (response.success) {
        console.log('✅ [adminService] Métricas de actividad obtenidas');
      } else {
        console.log('❌ [adminService] Error obteniendo métricas de actividad:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('💥 [adminService] Error obteniendo métricas de actividad:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  },

  /**
   * Obtener estadísticas detalladas de usuarios
   * GET /api/users/stats
   */
  async getUserStats(): Promise<AdminResponse> {
    try {
      console.log('🔍 [adminService] Obteniendo estadísticas detalladas...');
      
      const response = await apiClient.get<AdminResponse>('/api/users/stats');
      
      if (response.success) {
        console.log('✅ [adminService] Estadísticas detalladas obtenidas');
      } else {
        console.log('❌ [adminService] Error obteniendo estadísticas:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('💥 [adminService] Error obteniendo estadísticas:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  },

  /**
   * Verificar si el usuario actual es admin
   * GET /api/users/me (verificar rol en respuesta)
   */
  async checkAdminRole(): Promise<AdminResponse> {
    try {
      console.log('🔍 [adminService] Verificando rol de admin...');
      
      const response = await apiClient.get<AdminResponse>('/api/users/me');
      
      // Validar respuesta con Zod
      const validatedResponse = AdminResponseSchema.parse(response);
      
      if (validatedResponse.success && validatedResponse.data?.role === 'admin') {
        console.log('✅ [adminService] Rol de admin verificado');
        return { 
          success: true, 
          data: { isAdmin: true },
          message: 'Rol de administrador verificado'
        };
      } else {
        console.log('❌ [adminService] Usuario no es admin');
        return { 
          success: false, 
          message: 'Usuario no tiene permisos de administrador' 
        };
      }
    } catch (error) {
      console.error('💥 [adminService] Error verificando rol:', error);
      
      // En desarrollo, permitir acceso como admin
      if (process.env.NODE_ENV === 'development') {
        console.log('🎭 [adminService] Modo desarrollo - permitiendo acceso como admin');
        return {
          success: true,
          data: { isAdmin: true },
          message: 'Modo desarrollo - acceso permitido'
        };
      }
      
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }
};
