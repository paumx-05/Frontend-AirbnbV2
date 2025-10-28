'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/lib/api/admin';
import { type UserMetrics } from '@/schemas/admin';
import { useTelemetry } from '@/lib/telemetry/admin';
import MetricCard from '@/components/admin/MetricCard';
import UserChart from '@/components/admin/UserChart';
import ActivityChart from '@/components/admin/ActivityChart';
import UserTable from '@/components/admin/UserTable';
import ExecutiveSummary from '@/components/admin/ExecutiveSummary';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logApiCall, logError, logUserAction } = useTelemetry();

  // Cargar métricas al montar el componente
  useEffect(() => {
    const loadMetrics = async () => {
      const startTime = Date.now();
      try {
        setIsLoading(true);
        setError(null);
        
        logUserAction('dashboard_load_start');
        
        const response = await adminService.getUserMetrics();
        const duration = Date.now() - startTime;
        
        if (response.success && response.data) {
          setMetrics(response.data);
          logApiCall('/api/users/stats', duration, 'success');
          logUserAction('dashboard_load_success', { 
            totalUsers: response.data.totalUsers 
          });
        } else {
          setError(response.message || 'Error cargando métricas');
          logApiCall('/api/users/stats', duration, 'error');
          logError('AdminDashboard', response.message || 'Error cargando métricas');
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error('Error cargando métricas:', error);
        setError('Error de conexión con el servidor');
        logApiCall('/api/users/stats', duration, 'error');
        logError('AdminDashboard', 'Error de conexión con el servidor', { error: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, []); // Eliminar dependencias para evitar bucle infinito

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error cargando métricas</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setIsLoading(true);
            setError(null);
            // Recargar métricas sin usar useEffect
            const loadMetrics = async () => {
              const startTime = Date.now();
              try {
                const response = await adminService.getUserMetrics();
                const duration = Date.now() - startTime;
                
                if (response.success && response.data) {
                  setMetrics(response.data);
                  logApiCall('/api/users/stats', duration, 'success');
                } else {
                  setError(response.message || 'Error cargando métricas');
                  logApiCall('/api/users/stats', duration, 'error');
                }
              } catch (error) {
                const duration = Date.now() - startTime;
                console.error('Error cargando métricas:', error);
                setError('Error de conexión con el servidor');
                logApiCall('/api/users/stats', duration, 'error');
              } finally {
                setIsLoading(false);
              }
            };
            loadMetrics();
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título y última actualización */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Administración</h1>
        {metrics?.lastUpdated && (
          <p className="text-sm text-gray-500">
            Última actualización: {new Date(metrics.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {/* Resumen ejecutivo */}
      <ExecutiveSummary />

      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Usuarios"
          value={metrics?.totalUsers || 0}
          icon="👥"
          color="blue"
          trend={metrics?.registrationGrowth || 0}
        />
        
        <MetricCard
          title="Usuarios Activos"
          value={metrics?.activeUsers || 0}
          icon="✅"
          color="green"
          subtitle={`${metrics?.inactiveUsers || 0} inactivos`}
        />
        
        <MetricCard
          title="Usuarios Verificados"
          value={metrics?.verifiedUsers || 0}
          icon="🔒"
          color="purple"
          subtitle={`${metrics?.unverifiedUsers || 0} sin verificar`}
        />
        
        <MetricCard
          title="Nuevos Hoy"
          value={metrics?.newUsersToday || 0}
          icon="📈"
          color="orange"
          subtitle={`${metrics?.newUsersThisWeek || 0} esta semana`}
        />
      </div>

      {/* Gráficos y tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de registros */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Registros por Período
          </h2>
          <UserChart />
        </div>

        {/* Gráfico de actividad */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Actividad de Usuarios
          </h2>
          <ActivityChart />
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Gestión de Usuarios
          </h2>
        </div>
        <UserTable />
      </div>
    </div>
  );
};

export default AdminDashboard;
