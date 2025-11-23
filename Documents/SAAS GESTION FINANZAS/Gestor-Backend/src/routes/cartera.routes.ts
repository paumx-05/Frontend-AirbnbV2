import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as carteraController from '../controllers/cartera.controller';

const router = express.Router();

// Todas las rutas requieren autenticación
router.get('/', authenticate, carteraController.getCarteras);
router.get('/:id', authenticate, carteraController.getCarteraById);
router.post('/', authenticate, carteraController.createCartera);
router.put('/:id', authenticate, carteraController.updateCartera);
router.delete('/:id', authenticate, carteraController.deleteCartera);

// ============ NUEVAS RUTAS ============
router.post('/:id/depositar', authenticate, carteraController.depositar);
router.post('/:id/retirar', authenticate, carteraController.retirar);
router.post('/transferir', authenticate, carteraController.transferir);
router.get('/:id/transacciones', authenticate, carteraController.getTransacciones);
router.get('/:id/saldo', authenticate, carteraController.getSaldo);
router.post('/:id/sincronizar', authenticate, carteraController.sincronizar);

export default router;

