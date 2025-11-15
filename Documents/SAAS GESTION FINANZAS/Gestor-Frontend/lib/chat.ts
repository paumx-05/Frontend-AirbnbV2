// Utilidades para manejar chats y mensajes
// Funciones helper para obtener información de chats con amigos
// Integración completa con backend MongoDB

import { getUsuarioActual } from './auth'
import { chatService } from '@/services/chat.service'
import type { Amigo } from './amigos'
import type { Chat, MensajeChat } from '@/models/chat'

export interface ChatInfo {
  amigo: Amigo
  ultimoMensaje: MensajeChat | null
  mensajesNoLeidos: number
  fechaUltimoMensaje: string | null
}

/**
 * Obtiene información de chat para un amigo desde el backend
 */
export async function getChatInfo(amigo: Amigo): Promise<ChatInfo> {
  try {
    // Obtener lista de chats desde el backend
    const chats = await chatService.getChatsList()
    
    // Buscar el chat de este amigo usando el id del registro de amistad
    // El backend devuelve amigoId como el _id del registro de amistad
    const chat = chats.find(c => c.amigoId === amigo.id)
    
    if (chat && chat.ultimoMensaje) {
      // Adaptar el último mensaje del formato del backend
      const ultimoMensaje: MensajeChat = {
        _id: chat.ultimoMensaje.fecha, // Usar fecha como ID temporal
        remitenteId: '', // No disponible en la lista
        destinatarioId: '',
        amigoId: chat.amigoId,
        contenido: chat.ultimoMensaje.contenido,
        esSistema: chat.ultimoMensaje.esSistema,
        leido: false, // Asumir no leído si hay noLeidos > 0
        createdAt: chat.ultimoMensaje.fecha,
      }
      
      return {
        amigo,
        ultimoMensaje,
        mensajesNoLeidos: chat.noLeidos,
        fechaUltimoMensaje: chat.ultimoMensaje.fecha,
      }
    }
    
    return {
      amigo,
      ultimoMensaje: null,
      mensajesNoLeidos: 0,
      fechaUltimoMensaje: null,
    }
  } catch (error) {
    console.error('Error al obtener información de chat:', error)
    // Retornar información vacía en caso de error
    return {
      amigo,
      ultimoMensaje: null,
      mensajesNoLeidos: 0,
      fechaUltimoMensaje: null,
    }
  }
}

/**
 * Obtiene información de chats para todos los amigos desde el backend
 */
export async function getChatsInfo(amigos: Amigo[]): Promise<ChatInfo[]> {
  try {
    // Obtener lista de chats desde el backend
    const chats = await chatService.getChatsList()
    
    // Crear un mapa de chats por amigoId para acceso rápido
    const chatsMap = new Map<string, Chat>()
    chats.forEach(chat => {
      chatsMap.set(chat.amigoId, chat)
    })
    
    // Mapear amigos a ChatInfo usando el id del registro de amistad
    // El backend devuelve amigoId como el _id del registro de amistad
    return amigos.map(amigo => {
      const chat = chatsMap.get(amigo.id)
      
      if (chat && chat.ultimoMensaje) {
        // Adaptar el último mensaje del formato del backend
        const ultimoMensaje: MensajeChat = {
          _id: chat.ultimoMensaje.fecha, // Usar fecha como ID temporal
          remitenteId: '', // No disponible en la lista
          destinatarioId: '',
          amigoId: chat.amigoId,
          contenido: chat.ultimoMensaje.contenido,
          esSistema: chat.ultimoMensaje.esSistema,
          leido: false, // Asumir no leído si hay noLeidos > 0
          createdAt: chat.ultimoMensaje.fecha,
        }
        
        return {
          amigo,
          ultimoMensaje,
          mensajesNoLeidos: chat.noLeidos,
          fechaUltimoMensaje: chat.ultimoMensaje.fecha,
        }
      }
      
      return {
        amigo,
        ultimoMensaje: null,
        mensajesNoLeidos: 0,
        fechaUltimoMensaje: null,
      }
    })
  } catch (error) {
    console.error('Error al obtener información de chats:', error)
    // Retornar información vacía para todos los amigos en caso de error
    return amigos.map(amigo => ({
      amigo,
      ultimoMensaje: null,
      mensajesNoLeidos: 0,
      fechaUltimoMensaje: null,
    }))
  }
}

/**
 * Formatea la fecha del último mensaje para mostrar
 */
export function formatFechaUltimoMensaje(fechaStr: string | null): string {
  if (!fechaStr) return ''
  
  const fecha = new Date(fechaStr)
  const ahora = new Date()
  const esHoy = fecha.toDateString() === ahora.toDateString()
  const esAyer = new Date(ahora.getTime() - 24 * 60 * 60 * 1000).toDateString() === fecha.toDateString()
  
  if (esHoy) {
    return fecha.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  if (esAyer) {
    return 'Ayer'
  }
  
  // Si es de la misma semana, mostrar día de la semana
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const diasDiferencia = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diasDiferencia < 7) {
    return diasSemana[fecha.getDay()]
  }
  
  // Si es más antiguo, mostrar fecha completa
  return fecha.toLocaleDateString('es-ES', { 
    day: 'numeric',
    month: 'short'
  })
}
