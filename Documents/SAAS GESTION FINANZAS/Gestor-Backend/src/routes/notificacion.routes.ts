import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as notificacionController from '../controllers/notificacion.controller';

const router = Router();

// Todas las rutas de notificaciones requieren autenticación
router.use(authenticate);

// GET /api/notificaciones - Obtener todas las notificaciones (query: ?leida=true/false&tipo=info)
router.get('/', notificacionController.getNotificaciones);

// GET /api/notificaciones/tipo/:tipo - Obtener notificaciones por tipo
router.get('/tipo/:tipo', notificacionController.getNotificacionesByTipo);

// GET /api/notificaciones/:id - Obtener notificación por ID
router.get('/:id', notificacionController.getNotificacionById);

// POST /api/notificaciones - Crear nueva notificación
router.post('/', notificacionController.createNotificacion);

// PUT /api/notificaciones/leer-todas - Marcar todas las notificaciones como leídas
router.put('/leer-todas', notificacionController.markAllAsLeidas);

// PUT /api/notificaciones/:id/leida - Marcar notificación como leída
router.put('/:id/leida', notificacionController.markAsLeida);

// DELETE /api/notificaciones/:id - Eliminar notificación por ID
router.delete('/:id', notificacionController.deleteNotificacion);

// DELETE /api/notificaciones - Eliminar todas las notificaciones
router.delete('/', notificacionController.deleteAllNotificaciones);

export { router as notificacionRoutes };

