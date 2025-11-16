import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Notificacion } from '../models/Notificacion.model';

// Obtener todas las notificaciones con filtros opcionales
export const getNotificaciones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    const { leida, tipo } = req.query;

    // Construir filtro
    const filtro: any = { userId: req.user.userId };

    // Filtrar por estado leída
    if (leida !== undefined) {
      filtro.leida = leida === 'true';
    }

    // Filtrar por tipo
    if (tipo) {
      const tiposValidos = ['info', 'success', 'warning', 'error'];
      if (!tiposValidos.includes(tipo as string)) {
        res.status(400).json({
          success: false,
          error: `Tipo inválido: ${tipo}. Debe ser uno de: ${tiposValidos.join(', ')}`
        });
        return;
      }
      filtro.tipo = tipo;
    }

    // Obtener notificaciones ordenadas por fecha descendente (más recientes primero)
    const notificaciones = await Notificacion.find(filtro)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: notificaciones.map(notif => ({
        _id: notif._id.toString(),
        userId: notif.userId.toString(),
        tipo: notif.tipo,
        titulo: notif.titulo,
        mensaje: notif.mensaje,
        leida: notif.leida,
        createdAt: notif.createdAt instanceof Date 
          ? notif.createdAt.toISOString() 
          : notif.createdAt
      }))
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener notificaciones'
    });
  }
};

// Obtener notificación por ID
export const getNotificacionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    const { id } = req.params;

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'ID de notificación inválido'
      });
      return;
    }

    // Buscar notificación y verificar que pertenece al usuario
    const notificacion = await Notificacion.findOne({
      _id: id,
      userId: req.user.userId
    }).lean();

    if (!notificacion) {
      res.status(404).json({
        success: false,
        error: 'Notificación no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        _id: notificacion._id.toString(),
        userId: notificacion.userId.toString(),
        tipo: notificacion.tipo,
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje,
        leida: notificacion.leida,
        createdAt: notificacion.createdAt instanceof Date 
          ? notificacion.createdAt.toISOString() 
          : notificacion.createdAt
      }
    });
  } catch (error) {
    console.error('Error al obtener notificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener notificación'
    });
  }
};

// Obtener notificaciones por tipo
export const getNotificacionesByTipo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    const { tipo } = req.params;

    // Validar tipo
    const tiposValidos = ['info', 'success', 'warning', 'error'];
    if (!tiposValidos.includes(tipo)) {
      res.status(400).json({
        success: false,
        error: `Tipo inválido: ${tipo}. Debe ser uno de: ${tiposValidos.join(', ')}`
      });
      return;
    }

    // Obtener notificaciones por tipo, ordenadas por fecha descendente
    const notificaciones = await Notificacion.find({
      userId: req.user.userId,
      tipo: tipo
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: notificaciones.map(notif => ({
        _id: notif._id.toString(),
        userId: notif.userId.toString(),
        tipo: notif.tipo,
        titulo: notif.titulo,
        mensaje: notif.mensaje,
        leida: notif.leida,
        createdAt: notif.createdAt instanceof Date 
          ? notif.createdAt.toISOString() 
          : notif.createdAt
      }))
    });
  } catch (error) {
    console.error('Error al obtener notificaciones por tipo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener notificaciones por tipo'
    });
  }
};

// Crear nueva notificación
export const createNotificacion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    const { tipo, titulo, mensaje, leida } = req.body;

    // Validar campos requeridos
    if (!tipo || !titulo || !mensaje) {
      res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos (tipo, titulo, mensaje)'
      });
      return;
    }

    // Validar tipo
    const tiposValidos = ['info', 'success', 'warning', 'error'];
    if (!tiposValidos.includes(tipo)) {
      res.status(400).json({
        success: false,
        error: `Tipo inválido: ${tipo}. Debe ser uno de: ${tiposValidos.join(', ')}`
      });
      return;
    }

    // Validar que titulo y mensaje no estén vacíos
    if (typeof titulo !== 'string' || titulo.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'El título no puede estar vacío'
      });
      return;
    }

    if (typeof mensaje !== 'string' || mensaje.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'El mensaje no puede estar vacío'
      });
      return;
    }

    // Crear nueva notificación
    const nuevaNotificacion = new Notificacion({
      userId: req.user.userId,
      tipo,
      titulo: titulo.trim(),
      mensaje: mensaje.trim(),
      leida: leida === true || leida === 'true' ? true : false
    });

    const notificacionGuardada = await nuevaNotificacion.save();

    res.status(201).json({
      success: true,
      message: 'Notificación creada exitosamente',
      data: {
        _id: notificacionGuardada._id.toString(),
        userId: notificacionGuardada.userId.toString(),
        tipo: notificacionGuardada.tipo,
        titulo: notificacionGuardada.titulo,
        mensaje: notificacionGuardada.mensaje,
        leida: notificacionGuardada.leida,
        createdAt: notificacionGuardada.createdAt instanceof Date 
          ? notificacionGuardada.createdAt.toISOString() 
          : notificacionGuardada.createdAt
      }
    });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear notificación'
    });
  }
};

// Marcar notificación como leída
export const markAsLeida = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    const { id } = req.params;

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'ID de notificación inválido'
      });
      return;
    }

    // Buscar y actualizar notificación, verificando que pertenece al usuario
    const notificacion = await Notificacion.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.userId
      },
      {
        leida: true
      },
      {
        new: true
      }
    ).lean();

    if (!notificacion) {
      res.status(404).json({
        success: false,
        error: 'Notificación no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notificación marcada como leída',
      data: {
        _id: notificacion._id.toString(),
        userId: notificacion.userId.toString(),
        tipo: notificacion.tipo,
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje,
        leida: notificacion.leida,
        createdAt: notificacion.createdAt instanceof Date 
          ? notificacion.createdAt.toISOString() 
          : notificacion.createdAt
      }
    });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar notificación como leída'
    });
  }
};

// Marcar todas las notificaciones como leídas
export const markAllAsLeidas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    // Actualizar todas las notificaciones no leídas del usuario
    const resultado = await Notificacion.updateMany(
      {
        userId: req.user.userId,
        leida: false
      },
      {
        leida: true
      }
    );

    res.status(200).json({
      success: true,
      message: `${resultado.modifiedCount} notificación(es) marcada(s) como leída(s)`,
      data: {
        modificadas: resultado.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar todas las notificaciones como leídas'
    });
  }
};

// Eliminar notificación por ID
export const deleteNotificacion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    const { id } = req.params;

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'ID de notificación inválido'
      });
      return;
    }

    // Eliminar notificación, verificando que pertenece al usuario
    const notificacion = await Notificacion.findOneAndDelete({
      _id: id,
      userId: req.user.userId
    });

    if (!notificacion) {
      res.status(404).json({
        success: false,
        error: 'Notificación no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar notificación'
    });
  }
};

// Eliminar todas las notificaciones del usuario
export const deleteAllNotificaciones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    // Eliminar todas las notificaciones del usuario
    const resultado = await Notificacion.deleteMany({
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: `${resultado.deletedCount} notificación(es) eliminada(s)`,
      data: {
        eliminadas: resultado.deletedCount
      }
    });
  } catch (error) {
    console.error('Error al eliminar todas las notificaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar todas las notificaciones'
    });
  }
};

