'use client'

// Componente reutilizable para mostrar un amigo en la lista de chats
// Muestra información del amigo, último mensaje y permite acceder al chat

import Link from 'next/link'
import { getUsuarioActual } from '@/lib/auth'
import type { Amigo } from '@/lib/amigos'
import type { ChatInfo } from '@/lib/chat'
import { formatFechaUltimoMensaje } from '@/lib/chat'

interface AmigoListItemProps {
  chatInfo: ChatInfo
  onClick?: () => void
}

export default function AmigoListItem({ chatInfo, onClick }: AmigoListItemProps) {
  const { amigo, ultimoMensaje, mensajesNoLeidos, fechaUltimoMensaje } = chatInfo

  // Función para obtener iniciales del nombre
  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  // Obtener preview del último mensaje
  const getPreviewMensaje = () => {
    if (!ultimoMensaje) {
      return 'No hay mensajes aún'
    }
    
    // Si el mensaje es del usuario actual, mostrar "Tú: ..."
    const usuarioActual = getUsuarioActual()
    
    // El remitenteId es el ID del usuario que envió el mensaje
    const esMio = ultimoMensaje.remitenteId === usuarioActual?.id
    
    const preview = ultimoMensaje.contenido.length > 50 
      ? ultimoMensaje.contenido.substring(0, 50) + '...'
      : ultimoMensaje.contenido
    
    return esMio ? `Tú: ${preview}` : preview
  }

  // Solo mostrar link de chat si el amigo está activo (amistad mutua)
  const puedeChatear = amigo.estado === 'activo'
  
  const contenido = (
    <>
      <div className="amigo-list-item-avatar">
        {amigo.avatar ? (
          <img 
            src={amigo.avatar} 
            alt={amigo.nombre} 
            className="amigo-list-item-avatar-image" 
          />
        ) : (
          <div className="amigo-list-item-avatar-placeholder">
            {getInitials(amigo.nombre)}
          </div>
        )}
        {mensajesNoLeidos > 0 && (
          <span className="amigo-list-item-badge">{mensajesNoLeidos}</span>
        )}
      </div>
      
      <div className="amigo-list-item-content">
        <div className="amigo-list-item-header">
          <h3 className="amigo-list-item-nombre">{amigo.nombre}</h3>
          {fechaUltimoMensaje && (
            <span className="amigo-list-item-fecha">
              {formatFechaUltimoMensaje(fechaUltimoMensaje)}
            </span>
          )}
        </div>
        <div className="amigo-list-item-preview">
          <p className="amigo-list-item-mensaje">{getPreviewMensaje()}</p>
          {mensajesNoLeidos > 0 && (
            <span className="amigo-list-item-indicator"></span>
          )}
        </div>
      </div>
    </>
  )

  // Si puede chatear, envolver en Link, si no, solo mostrar contenido sin link
  if (puedeChatear) {
    return (
      <Link 
        href={`/dashboard/chat/${amigo.id}`}
        className="amigo-list-item"
        onClick={onClick}
      >
        {contenido}
      </Link>
    )
  }

  return (
    <div className="amigo-list-item amigo-list-item-disabled">
      {contenido}
    </div>
  )
}

