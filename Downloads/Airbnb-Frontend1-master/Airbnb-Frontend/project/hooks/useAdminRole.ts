/**
 * Hook personalizado para verificar si el usuario actual es administrador
 * Proporciona una forma simple y reactiva de verificar el rol de admin
 */

import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/admin';
import { useState, useEffect } from 'react';

interface UseAdminRoleReturn {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  checkRole: () => Promise<void>;
}

/**
 * Hook para verificar rol de administrador
 * @returns {UseAdminRoleReturn} Estado del rol de admin y funciones de verificación
 */
export const useAdminRole = (): UseAdminRoleReturn => {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verificar rol de admin desde el contexto local
   * Verificación rápida basada en el campo role del usuario
   */
  const checkLocalRole = () => {
    if (!user) {
      setIsAdmin(false);
      return false;
    }

    // Verificación local del rol desde el contexto
    const userIsAdmin = user.role === 'admin';
    setIsAdmin(userIsAdmin);
    
    console.log('🔍 [useAdminRole] Verificación local:', {
      userRole: user.role,
      isAdmin: userIsAdmin
    });

    return userIsAdmin;
  };

  /**
   * Verificar rol de admin con el backend
   * Verificación completa que consulta el servidor
   */
  const checkRole = async (): Promise<void> => {
    if (!isAuthenticated || !user) {
      setIsAdmin(false);
      setError('Usuario no autenticado');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 [useAdminRole] Verificando rol con backend...');
      
      const response = await adminService.checkAdminRole();
      
      if (response.success && response.data?.isAdmin) {
        setIsAdmin(true);
        console.log('✅ [useAdminRole] Rol de admin verificado por backend');
      } else {
        setIsAdmin(false);
        console.log('❌ [useAdminRole] Usuario no es admin según backend');
        setError(response.message || 'Usuario no tiene permisos de administrador');
      }
    } catch (error) {
      console.error('💥 [useAdminRole] Error verificando rol:', error);
      setIsAdmin(false);
      setError('Error verificando permisos de administrador');
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar rol local cuando cambie el usuario
  useEffect(() => {
    checkLocalRole();
  }, [user]);

  // En desarrollo, permitir acceso como admin si el usuario tiene rol admin
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user?.role === 'admin') {
      console.log('🎭 [useAdminRole] Modo desarrollo - usuario con rol admin detectado');
      setIsAdmin(true);
    }
  }, [user]);

  return {
    isAdmin,
    isLoading,
    error,
    checkRole
  };
};

/**
 * Hook simplificado que solo retorna si el usuario es admin
 * Para casos donde no se necesita verificación completa con backend
 */
export const useIsAdmin = (): boolean => {
  const { user } = useAuth();
  
  if (!user) return false;
  
  // En desarrollo, permitir acceso si el email contiene 'admin'
  if (process.env.NODE_ENV === 'development') {
    return user.role === 'admin' || user.email.includes('admin');
  }
  
  return user.role === 'admin';
};
