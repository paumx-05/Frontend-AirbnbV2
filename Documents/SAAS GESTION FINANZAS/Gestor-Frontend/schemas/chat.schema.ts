// Esquemas Zod para validación de chat
// Valida requests y responses del backend

import { z } from 'zod'

// Schema para respuesta del backend (wrapper estándar)
export const BackendResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
  })

// Schema para mensaje de chat del backend
export const MensajeChatSchema = z.object({
  _id: z.string(),
  remitenteId: z.string(),
  destinatarioId: z.string(),
  amigoId: z.string(),
  contenido: z.string(),
  esSistema: z.boolean(),
  leido: z.boolean(),
  createdAt: z.string(), // ISO date string
})

// Schema para request de enviar mensaje
export const SendMensajeRequestSchema = z.object({
  contenido: z.string().min(1, 'El contenido es requerido'),
  esSistema: z.boolean().optional().default(false),
})

// Schema para último mensaje en lista de chats
export const UltimoMensajeSchema = z.object({
  contenido: z.string(),
  fecha: z.string(),
  esSistema: z.boolean(),
}).nullable()

// Schema para chat en lista de chats
export const ChatSchema = z.object({
  amigoId: z.string(),
  amigoNombre: z.string(),
  amigoEmail: z.string(),
  ultimoMensaje: UltimoMensajeSchema,
  noLeidos: z.number(),
})

// Schema para respuesta de obtener lista de chats
export const ChatsResponseSchema = BackendResponseSchema(z.array(ChatSchema))

// Schema para respuesta de obtener mensajes de chat
export const MensajesChatResponseSchema = BackendResponseSchema(z.array(MensajeChatSchema))

// Schema para respuesta de enviar mensaje
export const MensajeChatResponseSchema = BackendResponseSchema(MensajeChatSchema)

// Schema para respuesta de marcar como leído
export const MarkChatLeidoResponseSchema = BackendResponseSchema(
  z.object({
    mensajesActualizados: z.number(),
  })
)

// Tipos TypeScript derivados
export type MensajeChat = z.infer<typeof MensajeChatSchema>
export type SendMensajeRequest = z.infer<typeof SendMensajeRequestSchema>
export type Chat = z.infer<typeof ChatSchema>
export type ChatsResponse = z.infer<typeof ChatsResponseSchema>
export type MensajesChatResponse = z.infer<typeof MensajesChatResponseSchema>
export type MensajeChatResponse = z.infer<typeof MensajeChatResponseSchema>
export type MarkChatLeidoResponse = z.infer<typeof MarkChatLeidoResponseSchema>

