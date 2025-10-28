/**
 * Sistema de telemetría básico para el módulo de administración
 * Registra métricas de rendimiento y errores para observabilidad
 */

import { useCallback } from 'react';

interface TelemetryEvent {
  event: string;
  timestamp: string;
  duration?: number;
  status?: 'success' | 'error' | 'warning';
  metadata?: Record<string, any>;
}

class AdminTelemetry {
  private events: TelemetryEvent[] = [];
  private isEnabled: boolean;

  constructor() {
    // Habilitar telemetría solo en desarrollo o si está explícitamente habilitada
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     process.env.NEXT_PUBLIC_ENABLE_TELEMETRY === 'true';
  }

  /**
   * Registrar un evento de telemetría
   */
  log(event: string, metadata?: Record<string, any>, status: 'success' | 'error' | 'warning' = 'success') {
    if (!this.isEnabled) return;

    const telemetryEvent: TelemetryEvent = {
      event,
      timestamp: new Date().toISOString(),
      status,
      metadata
    };

    this.events.push(telemetryEvent);
    
    // Mantener solo los últimos 100 eventos en memoria
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    // Log en consola para desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [Telemetry] ${event}:`, metadata);
    }
  }

  /**
   * Registrar métricas de rendimiento de API
   */
  logApiCall(endpoint: string, duration: number, status: 'success' | 'error', responseSize?: number) {
    this.log('api_call', {
      endpoint,
      duration,
      status,
      responseSize
    }, status);
  }

  /**
   * Registrar errores de componentes
   */
  logError(component: string, error: string, metadata?: Record<string, any>) {
    this.log('component_error', {
      component,
      error,
      ...metadata
    }, 'error');
  }

  /**
   * Registrar métricas de usuario
   */
  logUserAction(action: string, metadata?: Record<string, any>) {
    this.log('user_action', {
      action,
      ...metadata
    });
  }

  /**
   * Obtener eventos recientes
   */
  getRecentEvents(limit: number = 10): TelemetryEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Obtener métricas de rendimiento
   */
  getPerformanceMetrics() {
    const apiCalls = this.events.filter(e => e.event === 'api_call');
    const errors = this.events.filter(e => e.status === 'error');
    
    return {
      totalApiCalls: apiCalls.length,
      averageResponseTime: apiCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / apiCalls.length || 0,
      errorRate: errors.length / this.events.length || 0,
      totalErrors: errors.length
    };
  }

  /**
   * Exportar eventos para análisis
   */
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Limpiar eventos
   */
  clear() {
    this.events = [];
  }
}

// Instancia singleton
export const adminTelemetry = new AdminTelemetry();

// Hook para usar telemetría en componentes
export const useTelemetry = () => {
  const log = useCallback((event: string, metadata?: Record<string, any>, status: 'success' | 'error' | 'warning' = 'success') => {
    adminTelemetry.log(event, metadata, status);
  }, []);

  const logApiCall = useCallback((endpoint: string, duration: number, status: 'success' | 'error', responseSize?: number) => {
    adminTelemetry.logApiCall(endpoint, duration, status, responseSize);
  }, []);

  const logError = useCallback((component: string, error: string, metadata?: Record<string, any>) => {
    adminTelemetry.logError(component, error, metadata);
  }, []);

  const logUserAction = useCallback((action: string, metadata?: Record<string, any>) => {
    adminTelemetry.logUserAction(action, metadata);
  }, []);

  const getMetrics = useCallback(() => {
    return adminTelemetry.getPerformanceMetrics();
  }, []);

  return {
    log,
    logApiCall,
    logError,
    logUserAction,
    getMetrics
  };
};