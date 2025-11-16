import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Gasto } from '../models/Gasto.model';
import { Ingreso } from '../models/Ingreso.model';
import { Presupuesto } from '../models/Presupuesto.model';

const mesesValidos = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Helper: Obtener mes actual en formato español
const getMesActual = (): string => {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return meses[new Date().getMonth()];
};

// Helper: Obtener mes anterior en formato español
const getMesAnterior = (): string => {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mesActual = new Date().getMonth();
  const mesAnteriorIndex = mesActual === 0 ? 11 : mesActual - 1;
  return meses[mesAnteriorIndex];
};

// Helper: Calcular porcentaje de cambio
const calcularPorcentajeCambio = (actual: number, anterior: number): number => {
  if (anterior === 0) {
    return actual > 0 ? 100 : 0;
  }
  return ((actual - anterior) / anterior) * 100;
};

// Obtener resumen del mes actual
export const getResumenMesActual = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    const userId = req.user.userId;
    const mesActual = getMesActual();

    // Obtener ingresos y gastos del mes actual en paralelo
    const [ingresos, gastos] = await Promise.all([
      Ingreso.find({ userId, mes: mesActual }).lean(),
      Gasto.find({ userId, mes: mesActual }).lean()
    ]);

    // Calcular totales
    const totalIngresos = ingresos.reduce((sum, ing) => sum + ing.monto, 0);
    const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
    const balance = totalIngresos - totalGastos;
    const porcentajeGastado = totalIngresos > 0 
      ? (totalGastos / totalIngresos) * 100 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        mes: mesActual,
        ingresos: Number(totalIngresos.toFixed(2)),
        gastos: Number(totalGastos.toFixed(2)),
        balance: Number(balance.toFixed(2)),
        porcentajeGastado: Number(porcentajeGastado.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener resumen del mes actual'
    });
  }
};

// Obtener gastos recientes (últimos 7)
export const getGastosRecientes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    const userId = req.user.userId;
    const mesActual = getMesActual();

    // Obtener últimos 7 gastos del mes actual, ordenados por fecha descendente
    const gastos = await Gasto.find({ userId, mes: mesActual })
      .sort({ fecha: -1 })
      .limit(7)
      .lean();

    res.status(200).json({
      success: true,
      data: gastos.map(gasto => ({
        _id: gasto._id.toString(),
        descripcion: gasto.descripcion,
        monto: gasto.monto,
        categoria: gasto.categoria,
        fecha: gasto.fecha instanceof Date ? gasto.fecha.toISOString() : gasto.fecha,
        mes: gasto.mes
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener gastos recientes'
    });
  }
};

// Obtener gastos por categorías (top 3)
export const getGastosPorCategoria = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    const userId = req.user.userId;
    const mesActual = getMesActual();

    // Obtener todos los gastos del mes actual
    const gastos = await Gasto.find({ userId, mes: mesActual }).lean();

    // Agrupar gastos por categoría
    const gastosPorCategoria: { [key: string]: number } = {};
    gastos.forEach(gasto => {
      const categoria = gasto.categoria;
      if (!gastosPorCategoria[categoria]) {
        gastosPorCategoria[categoria] = 0;
      }
      gastosPorCategoria[categoria] += gasto.monto;
    });

    // Convertir a array y ordenar
    const categoriasOrdenadas = Object.entries(gastosPorCategoria)
      .map(([categoria, monto]) => ({ categoria, monto }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 3); // Top 3

    // Calcular total de gastos
    const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);

    // Calcular porcentajes
    const categoriasConPorcentaje = categoriasOrdenadas.map(item => ({
      categoria: item.categoria,
      monto: Number(item.monto.toFixed(2)),
      porcentaje: totalGastos > 0 
        ? Number(((item.monto / totalGastos) * 100).toFixed(2))
        : 0
    }));

    res.status(200).json({
      success: true,
      data: categoriasConPorcentaje,
      total: Number(totalGastos.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener gastos por categoría'
    });
  }
};

// Obtener comparativa mes anterior vs actual
export const getComparativaMensual = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    const userId = req.user.userId;
    const mesActual = getMesActual();
    const mesAnterior = getMesAnterior();

    // Obtener datos de ambos meses en paralelo
    const [ingresosActual, gastosActual, ingresosAnterior, gastosAnterior] = await Promise.all([
      Ingreso.find({ userId, mes: mesActual }).lean(),
      Gasto.find({ userId, mes: mesActual }).lean(),
      Ingreso.find({ userId, mes: mesAnterior }).lean(),
      Gasto.find({ userId, mes: mesAnterior }).lean()
    ]);

    // Calcular totales del mes actual
    const totalIngresosActual = ingresosActual.reduce((sum, ing) => sum + ing.monto, 0);
    const totalGastosActual = gastosActual.reduce((sum, gasto) => sum + gasto.monto, 0);
    const balanceActual = totalIngresosActual - totalGastosActual;

    // Calcular totales del mes anterior
    const totalIngresosAnterior = ingresosAnterior.reduce((sum, ing) => sum + ing.monto, 0);
    const totalGastosAnterior = gastosAnterior.reduce((sum, gasto) => sum + gasto.monto, 0);
    const balanceAnterior = totalIngresosAnterior - totalGastosAnterior;

    // Calcular cambios
    const cambioIngresos = calcularPorcentajeCambio(totalIngresosActual, totalIngresosAnterior);
    const cambioGastos = calcularPorcentajeCambio(totalGastosActual, totalGastosAnterior);
    const cambioBalance = calcularPorcentajeCambio(balanceActual, balanceAnterior);

    // Determinar tipo de cambio
    const determinarTipo = (valor: number): 'aumento' | 'disminucion' => {
      return valor >= 0 ? 'aumento' : 'disminucion';
    };

    res.status(200).json({
      success: true,
      data: {
        mesActual: {
          ingresos: Number(totalIngresosActual.toFixed(2)),
          gastos: Number(totalGastosActual.toFixed(2)),
          balance: Number(balanceActual.toFixed(2))
        },
        mesAnterior: {
          ingresos: Number(totalIngresosAnterior.toFixed(2)),
          gastos: Number(totalGastosAnterior.toFixed(2)),
          balance: Number(balanceAnterior.toFixed(2))
        },
        cambios: {
          ingresos: {
            valor: Number((totalIngresosActual - totalIngresosAnterior).toFixed(2)),
            porcentaje: Number(cambioIngresos.toFixed(2)),
            tipo: determinarTipo(cambioIngresos)
          },
          gastos: {
            valor: Number((totalGastosActual - totalGastosAnterior).toFixed(2)),
            porcentaje: Number(cambioGastos.toFixed(2)),
            tipo: determinarTipo(cambioGastos)
          },
          balance: {
            valor: Number((balanceActual - balanceAnterior).toFixed(2)),
            porcentaje: Number(cambioBalance.toFixed(2)),
            tipo: determinarTipo(cambioBalance)
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener comparativa mensual'
    });
  }
};

// Obtener alertas financieras
export const getAlertasFinancieras = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    const userId = req.user.userId;
    const mesActual = getMesActual();

    // Obtener datos del mes actual
    const [ingresos, gastos, presupuestos] = await Promise.all([
      Ingreso.find({ userId, mes: mesActual }).lean(),
      Gasto.find({ userId, mes: mesActual }).lean(),
      Presupuesto.find({ userId, mes: mesActual }).lean()
    ]);

    const totalIngresos = ingresos.reduce((sum, ing) => sum + ing.monto, 0);
    const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
    const balance = totalIngresos - totalGastos;

    const alertas: Array<{
      tipo: 'info' | 'success' | 'warning' | 'error';
      titulo: string;
      mensaje: string;
    }> = [];

    // Alerta: Sin ingresos registrados
    if (totalIngresos === 0) {
      alertas.push({
        tipo: 'info',
        titulo: 'Sin ingresos registrados',
        mensaje: 'No hay ingresos registrados para este mes'
      });
    }

    // Alerta: Balance negativo
    if (balance < 0) {
      alertas.push({
        tipo: 'error',
        titulo: 'Balance negativo',
        mensaje: `Los gastos superan los ingresos en ${Math.abs(balance).toFixed(2)}€`
      });
    }

    // Alerta: Porcentaje gastado muy alto (>90%)
    const porcentajeGastado = totalIngresos > 0 ? (totalGastos / totalIngresos) * 100 : 0;
    if (porcentajeGastado > 90 && totalIngresos > 0) {
      alertas.push({
        tipo: 'warning',
        titulo: 'Gastos elevados',
        mensaje: `Has gastado el ${porcentajeGastado.toFixed(1)}% de tus ingresos este mes`
      });
    }

    // Alerta: Presupuesto excedido por categoría
    const gastosPorCategoria: { [key: string]: number } = {};
    gastos.forEach(gasto => {
      const categoria = gasto.categoria;
      if (!gastosPorCategoria[categoria]) {
        gastosPorCategoria[categoria] = 0;
      }
      gastosPorCategoria[categoria] += gasto.monto;
    });

    presupuestos.forEach(presupuesto => {
      const gastosCategoria = gastosPorCategoria[presupuesto.categoria] || 0;
      if (gastosCategoria > presupuesto.monto) {
        const exceso = gastosCategoria - presupuesto.monto;
        alertas.push({
          tipo: 'warning',
          titulo: `Presupuesto excedido: ${presupuesto.categoria}`,
          mensaje: `Has superado el presupuesto en ${exceso.toFixed(2)}€`
        });
      }
    });

    // Alerta: Balance positivo y porcentaje bajo (<50%)
    if (balance > 0 && porcentajeGastado < 50 && totalIngresos > 0) {
      alertas.push({
        tipo: 'success',
        titulo: 'Excelente gestión',
        mensaje: `Has ahorrado ${balance.toFixed(2)}€ este mes (${(100 - porcentajeGastado).toFixed(1)}% de tus ingresos)`
      });
    }

    res.status(200).json({
      success: true,
      data: alertas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener alertas financieras'
    });
  }
};

