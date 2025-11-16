import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/dashboard/resumen - Obtener resumen del mes actual
router.get('/resumen', dashboardController.getResumenMesActual);

// GET /api/dashboard/gastos-recientes - Obtener gastos recientes
router.get('/gastos-recientes', dashboardController.getGastosRecientes);

// GET /api/dashboard/gastos-categoria - Obtener gastos por categorías (top 3)
router.get('/gastos-categoria', dashboardController.getGastosPorCategoria);

// GET /api/dashboard/comparativa - Obtener comparativa mensual
router.get('/comparativa', dashboardController.getComparativaMensual);

// GET /api/dashboard/alertas - Obtener alertas financieras
router.get('/alertas', dashboardController.getAlertasFinancieras);

export { router as dashboardRoutes };

