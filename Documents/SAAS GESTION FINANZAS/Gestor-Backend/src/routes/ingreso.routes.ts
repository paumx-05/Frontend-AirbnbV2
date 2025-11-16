import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as ingresoController from '../controllers/ingreso.controller';

const router = Router();

// Todas las rutas de ingresos requieren autenticación
router.use(authenticate);

// POST /api/ingresos - Crear un nuevo ingreso (debe ir antes de las rutas con parámetros)
router.post('/', ingresoController.createIngreso);

// GET /api/ingresos/:mes/categoria/:categoria - Obtener ingresos por categoría (ruta más específica primero)
router.get('/:mes/categoria/:categoria', ingresoController.getIngresosByCategoria);

// GET /api/ingresos/:mes/total - Obtener total de ingresos del mes (ruta específica antes de la genérica)
router.get('/:mes/total', ingresoController.getTotalIngresosByMes);

// GET /api/ingresos/:mes - Obtener todos los ingresos de un mes
router.get('/:mes', ingresoController.getIngresosByMes);

// PUT /api/ingresos/:id - Actualizar un ingreso existente
router.put('/:id', ingresoController.updateIngreso);

// DELETE /api/ingresos/:id - Eliminar un ingreso
router.delete('/:id', ingresoController.deleteIngreso);

export { router as ingresoRoutes };

