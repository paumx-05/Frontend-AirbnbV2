// Esquemas Zod para validación de mensajes
// Valida requests y responses del backend

import { z } from 'zod'

// Schema para respuesta del backend (wrapper estándar)
export const BackendResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
  })

// Schema para mensaje del backend
export const MensajeSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  remitente: z.string(),
  asunto: z.string(),
  contenido: z.string(),
  leido: z.boolean(),
  createdAt: z.string(), // ISO date string
})

// Schema para request de crear mensaje
export const CreateMensajeRequestSchema = z.object({
  remitente: z.string().min(1, 'El remitente es requerido'),
  asunto: z.string().min(1, 'El asunto es requerido'),
  contenido: z.string().min(1, 'El contenido es requerido'),
  leido: z.boolean().optional().default(false),
})

// Schema para respuesta de obtener mensajes
export const MensajesResponseSchema = BackendResponseSchema(z.array(MensajeSchema))

// Schema para respuesta de obtener/crear/marcar como leído mensaje
export const MensajeResponseSchema = BackendResponseSchema(MensajeSchema)

// Schema para respuesta de marcar todos como leídos
export const MarkAllLeidosResponseSchema = BackendResponseSchema(
  z.object({
    mensajesActualizados: z.number(),
  })
)

// Schema para respuesta de eliminar mensaje
export const DeleteMensajeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

// Schema para respuesta de eliminar todos los mensajes
export const DeleteAllMensajesResponseSchema = BackendResponseSchema(
  z.object({
    mensajesEliminados: z.number(),
  })
)

// Tipos TypeScript derivados
export type Mensaje = z.infer<typeof MensajeSchema>
export type CreateMensajeRequest = z.infer<typeof CreateMensajeRequestSchema>
export type MensajesResponse = z.infer<typeof MensajesResponseSchema>
export type MensajeResponse = z.infer<typeof MensajeResponseSchema>
export type MarkAllLeidosResponse = z.infer<typeof MarkAllLeidosResponseSchema>
export type DeleteMensajeResponse = z.infer<typeof DeleteMensajeResponseSchema>
export type DeleteAllMensajesResponse = z.infer<typeof DeleteAllMensajesResponseSchema>

