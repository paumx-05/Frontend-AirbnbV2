// Esquemas Zod para validación de carteras
// Valida requests y responses del backend

import { z } from 'zod'

// Schema para respuesta del backend (wrapper estándar)
export const BackendResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
  })

// Schema para cartera del backend
export const CarteraSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string().optional(), // ISO date string
})

// Schema para request de crear cartera
export const CreateCarteraRequestSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
})

// Schema para request de actualizar cartera (todos opcionales)
// descripcion puede ser null para eliminar la descripción
export const UpdateCarteraRequestSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  descripcion: z.string().max(500).nullable().optional(),
})

// Schema para respuesta de obtener todas las carteras
export const CarterasResponseSchema = BackendResponseSchema(z.array(CarteraSchema))

// Schema para respuesta de obtener/crear/actualizar una cartera
export const CarteraResponseSchema = BackendResponseSchema(CarteraSchema)

// Schema para respuesta de eliminar cartera
export const DeleteCarteraResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

