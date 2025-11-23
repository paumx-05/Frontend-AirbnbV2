// Utilidades para manejo de divisas
// Incluye formateo, conversión y símbolos

import { Divisa, simbolosDivisa } from '@/contexts/ConfiguracionContext'

/**
 * Formatea un monto con el símbolo de divisa
 * @param monto - El monto a formatear
 * @param divisa - El código de la divisa (USD, EUR, etc.)
 * @param mostrarSimbolo - Si se debe mostrar el símbolo (default: true)
 * @returns String formateado con el símbolo de divisa
 */
export function formatearMonto(
  monto: number,
  divisa: Divisa = 'USD',
  mostrarSimbolo: boolean = true
): string {
  const simbolo = simbolosDivisa[divisa] || '$'
  const montoFormateado = monto.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (mostrarSimbolo) {
    // Para símbolos que van después del número (según convención)
    if (divisa === 'EUR') {
      return `${montoFormateado}${simbolo}`
    }
    // Para la mayoría de divisas, el símbolo va antes
    return `${simbolo}${montoFormateado}`
  }

  return montoFormateado
}

/**
 * Obtiene el símbolo de una divisa
 * @param divisa - El código de la divisa
 * @returns El símbolo correspondiente
 */
export function obtenerSimboloDivisa(divisa: Divisa): string {
  return simbolosDivisa[divisa] || '$'
}

/**
 * Convierte un monto de una divisa a otra
 * NOTA: Esta es una implementación básica con tasas fijas.
 * En producción, usar una API de tasas de cambio en tiempo real.
 * 
 * @param monto - El monto a convertir
 * @param divisaOrigen - Divisa de origen
 * @param divisaDestino - Divisa de destino
 * @returns El monto convertido
 */
export function convertirDivisa(
  monto: number,
  divisaOrigen: Divisa,
  divisaDestino: Divisa
): number {
  // Si son iguales, retornar el mismo monto
  if (divisaOrigen === divisaDestino) return monto

  // Tasas de cambio fijas respecto a USD (solo para demo)
  // En producción, usar una API como exchangerate-api.com
  const tasasRespectoDolar: Record<Divisa, number> = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.5,
    CAD: 1.36,
    AUD: 1.53,
    CHF: 0.88,
    CNY: 7.24,
    MXN: 17.0,
    ARS: 350.0,
    COP: 3900.0,
    CLP: 890.0,
  }

  // Primero convertir a USD
  const montoEnDolares = monto / tasasRespectoDolar[divisaOrigen]
  
  // Luego convertir a la divisa destino
  const montoConvertido = montoEnDolares * tasasRespectoDolar[divisaDestino]

  return Math.round(montoConvertido * 100) / 100 // Redondear a 2 decimales
}

/**
 * Formatea un monto compacto (K, M, B)
 * @param monto - El monto a formatear
 * @param divisa - El código de la divisa
 * @returns String formateado de forma compacta
 */
export function formatearMontoCompacto(
  monto: number,
  divisa: Divisa = 'USD'
): string {
  const simbolo = simbolosDivisa[divisa] || '$'
  
  if (monto >= 1000000000) {
    return `${simbolo}${(monto / 1000000000).toFixed(1)}B`
  }
  if (monto >= 1000000) {
    return `${simbolo}${(monto / 1000000).toFixed(1)}M`
  }
  if (monto >= 1000) {
    return `${simbolo}${(monto / 1000).toFixed(1)}K`
  }
  
  return `${simbolo}${monto.toFixed(2)}`
}

/**
 * Valida si una divisa es válida
 * @param divisa - La divisa a validar
 * @returns true si es válida, false si no
 */
export function esDivisaValida(divisa: string): divisa is Divisa {
  const divisasValidas: Divisa[] = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 
    'CHF', 'CNY', 'MXN', 'ARS', 'COP', 'CLP'
  ]
  return divisasValidas.includes(divisa as Divisa)
}

/**
 * Obtiene el nombre completo de una divisa
 * @param divisa - El código de la divisa
 * @returns El nombre completo de la divisa
 */
export function obtenerNombreDivisa(divisa: Divisa): string {
  const nombres: Record<Divisa, string> = {
    USD: 'Dólar Estadounidense',
    EUR: 'Euro',
    GBP: 'Libra Esterlina',
    JPY: 'Yen Japonés',
    CAD: 'Dólar Canadiense',
    AUD: 'Dólar Australiano',
    CHF: 'Franco Suizo',
    CNY: 'Yuan Chino',
    MXN: 'Peso Mexicano',
    ARS: 'Peso Argentino',
    COP: 'Peso Colombiano',
    CLP: 'Peso Chileno',
  }
  return nombres[divisa] || 'Desconocida'
}

/**
 * Formatea un monto para input de formulario
 * @param valor - El valor del input
 * @returns Número parseado o 0 si es inválido
 */
export function parsearMontoInput(valor: string): number {
  // Remover todo excepto números, puntos y comas
  const limpio = valor.replace(/[^\d.,]/g, '')
  
  // Reemplazar coma por punto (formato decimal)
  const normalizado = limpio.replace(',', '.')
  
  const numero = parseFloat(normalizado)
  return isNaN(numero) ? 0 : numero
}

/**
 * Calcula el total de un array de montos
 * @param montos - Array de montos a sumar
 * @returns El total
 */
export function calcularTotal(montos: number[]): number {
  return montos.reduce((acc, monto) => acc + monto, 0)
}

/**
 * Calcula el promedio de un array de montos
 * @param montos - Array de montos
 * @returns El promedio
 */
export function calcularPromedio(montos: number[]): number {
  if (montos.length === 0) return 0
  return calcularTotal(montos) / montos.length
}

/**
 * Obtiene la diferencia porcentual entre dos montos
 * @param montoActual - Monto actual
 * @param montoAnterior - Monto anterior
 * @returns Porcentaje de diferencia
 */
export function calcularPorcentajeDiferencia(
  montoActual: number,
  montoAnterior: number
): number {
  if (montoAnterior === 0) return montoActual > 0 ? 100 : 0
  return ((montoActual - montoAnterior) / montoAnterior) * 100
}

/**
 * Formatea un porcentaje
 * @param porcentaje - El porcentaje a formatear
 * @param decimales - Cantidad de decimales (default: 1)
 * @returns String formateado
 */
export function formatearPorcentaje(
  porcentaje: number,
  decimales: number = 1
): string {
  const valor = porcentaje.toFixed(decimales)
  const signo = porcentaje > 0 ? '+' : ''
  return `${signo}${valor}%`
}

// Ejemplos de uso:
// 
// import { formatearMonto, convertirDivisa } from '@/lib/currency-utils'
// 
// formatearMonto(1234.56, 'USD') // "$1,234.56"
// formatearMonto(1234.56, 'EUR') // "1.234,56€"
// convertirDivisa(100, 'USD', 'EUR') // ~92
// formatearMontoCompacto(1500000, 'USD') // "$1.5M"

