/**
 * Servicios de API para el panel de administración
 * Métricas y estadísticas de usuarios para admins
 */

import { apiClient } from './config';

// Interfaces para métricas de administración
export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  registrationGrowth: number;
  lastUpdated: string;
}

export interface RegistrationStats {
  date: string;
  count: number;
}

export interface ActivityMetrics {
  totalLogins: number;
  loginsToday: number;
  loginsThisWeek: number;
  loginsThisMonth: number;
  averageSessionDuration: number;
  mostActiveHour: number;
}

export interface UserStats {
  totalUsers: number;
  usersByStatus: {
    active: number;
    inactive: number;
  };
  usersByVerification: {
    verified: number;
    unverified: number;
  };
  usersByGender: {
    male: number;
    female: number;
    other: number;
  };
  usersByAgeGroup: {
    '18-25': number;
    '26-35': number;
    '36-45': number;
    '46-55': number;
    '55+': number;
  };
}

export interface AdminResponse {
  success: boolean;
  data?: any;
  message?: string;
}

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
      
      if (response.success) {
        console.log('✅ [adminService] Métricas obtenidas:', response.data);
      } else {
        console.log('❌ [adminService] Error obteniendo métricas:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('💥 [adminService] Error obteniendo métricas:', error);
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
      
      if (response.success) {
        console.log('✅ [adminService] Lista de usuarios obtenida');
      } else {
        console.log('❌ [adminService] Error obteniendo lista:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('💥 [adminService] Error obteniendo lista:', error);
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
      
      if (response.success && response.data?.role === 'admin') {
        console.log('✅ [adminService] Rol de admin verificado');
        return { success: true, data: { isAdmin: true } };
      } else {
        console.log('❌ [adminService] Usuario no es admin');
        return { success: false, message: 'Usuario no tiene permisos de administrador' };
      }
    } catch (error) {
      console.error('💥 [adminService] Error verificando rol:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }
};
