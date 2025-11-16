import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as categoriaController from '../controllers/categoria.controller';

const router = Router();

// Todas las rutas de categorías requieren autenticación
router.use(authenticate);

// GET /api/categorias - Obtener todas las categorías del usuario
router.get('/', categoriaController.getCategorias);

// GET /api/categorias/tipo/:tipo - Obtener categorías por tipo (ruta específica antes de la genérica)
router.get('/tipo/:tipo', categoriaController.getCategoriasByTipo);

// POST /api/categorias - Crear una nueva categoría
router.post('/', categoriaController.createCategoria);

// PUT /api/categorias/:id - Actualizar una categoría existente
router.put('/:id', categoriaController.updateCategoria);

// DELETE /api/categorias/:id - Eliminar una categoría
router.delete('/:id', categoriaController.deleteCategoria);

export { router as categoriaRoutes };

