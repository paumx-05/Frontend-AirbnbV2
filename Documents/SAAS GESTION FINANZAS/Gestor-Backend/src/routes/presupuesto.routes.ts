import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as presupuestoController from '../controllers/presupuesto.controller';

const router = Router();

// Todas las rutas de presupuestos requieren autenticación
router.use(authenticate);

// GET /api/presupuestos/:mes - Obtener todos los presupuestos de un mes
router.get('/:mes', presupuestoController.getPresupuestosByMes);

// GET /api/presupuestos/:mes/total - Obtener total presupuestado del mes (ruta específica antes de la genérica)
router.get('/:mes/total', presupuestoController.getTotalPresupuestosByMes);

// GET /api/presupuestos/:mes/resumen - Obtener resumen con distribución y porcentajes (ruta específica antes de la genérica)
router.get('/:mes/resumen', presupuestoController.getResumenPresupuestos);

// POST /api/presupuestos - Crear/actualizar un presupuesto (upsert)
router.post('/', presupuestoController.createOrUpdatePresupuesto);

// PUT /api/presupuestos/:id - Actualizar un presupuesto existente
router.put('/:id', presupuestoController.updatePresupuesto);

// DELETE /api/presupuestos/:mes/:categoria - Eliminar presupuesto por mes y categoría
router.delete('/:mes/:categoria', presupuestoController.deletePresupuesto);

export { router as presupuestoRoutes };

