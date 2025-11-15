'use client'

// Componente reutilizable para mostrar la lista de amigos con sus chats
// Permite buscar y filtrar amigos, y acceder a sus chats

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import type { Amigo } from '@/lib/amigos'
import type { ChatInfo } from '@/lib/chat'
import { getChatsInfo } from '@/lib/chat'
import AmigoListItem from './AmigoListItem'

interface AmigosListProps {
  amigos: Amigo[]
  onAmigoClick?: (amigo: Amigo) => void
}

export default function AmigosList({ amigos, onAmigoClick }: AmigosListProps) {
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'con-mensajes' | 'sin-mensajes'>('todos')
  const [chatsInfo, setChatsInfo] = useState<ChatInfo[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar información de chats desde el backend
  useEffect(() => {
    const loadChatsInfo = async () => {
      if (amigos.length === 0) {
        setChatsInfo([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const info = await getChatsInfo(amigos)
        setChatsInfo(info)
      } catch (error) {
        console.error('Error al cargar información de chats:', error)
        // En caso de error, crear ChatInfo vacío para cada amigo
        setChatsInfo(amigos.map(amigo => ({
          amigo,
          ultimoMensaje: null,
          mensajesNoLeidos: 0,
          fechaUltimoMensaje: null,
        })))
      } finally {
        setLoading(false)
      }
    }

    loadChatsInfo()
  }, [amigos])

  // Filtrar y buscar amigos
  const amigosFiltrados = useMemo(() => {
    let filtrados = chatsInfo

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const query = busqueda.toLowerCase()
      filtrados = filtrados.filter(chatInfo =>
        chatInfo.amigo.nombre.toLowerCase().includes(query) ||
        chatInfo.amigo.email.toLowerCase().includes(query)
      )
    }

    // Filtrar por tipo
    if (filtro === 'con-mensajes') {
      filtrados = filtrados.filter(chatInfo => chatInfo.ultimoMensaje !== null)
    } else if (filtro === 'sin-mensajes') {
      filtrados = filtrados.filter(chatInfo => chatInfo.ultimoMensaje === null)
    }

    // Ordenar: primero los que tienen mensajes no leídos, luego por fecha del último mensaje
    filtrados.sort((a, b) => {
      // Prioridad a mensajes no leídos
      if (a.mensajesNoLeidos > 0 && b.mensajesNoLeidos === 0) return -1
      if (a.mensajesNoLeidos === 0 && b.mensajesNoLeidos > 0) return 1
      
      // Luego por fecha del último mensaje (más reciente primero)
      if (a.fechaUltimoMensaje && b.fechaUltimoMensaje) {
        return new Date(b.fechaUltimoMensaje).getTime() - new Date(a.fechaUltimoMensaje).getTime()
      }
      if (a.fechaUltimoMensaje) return -1
      if (b.fechaUltimoMensaje) return 1
      
      // Si no hay mensajes, ordenar alfabéticamente
      return a.amigo.nombre.localeCompare(b.amigo.nombre)
    })

    return filtrados
  }, [chatsInfo, busqueda, filtro])

  const amigosConMensajes = chatsInfo.filter(ci => ci.ultimoMensaje !== null).length
  const amigosSinMensajes = chatsInfo.filter(ci => ci.ultimoMensaje === null).length

  if (loading) {
    return (
      <div className="amigos-list-container">
        <div className="amigos-list-loading">
          <p>Cargando chats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="amigos-list-container">
      {/* Barra de búsqueda y filtros */}
      <div className="amigos-list-controls">
        <div className="amigos-list-search">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="amigos-list-search-icon"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            className="amigos-list-search-input"
            placeholder="Buscar amigos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <div className="amigos-list-filtros">
          <button
            onClick={() => setFiltro('todos')}
            className={`amigos-list-filtro-btn ${filtro === 'todos' ? 'active' : ''}`}
          >
            Todos ({amigos.length})
          </button>
          <button
            onClick={() => setFiltro('con-mensajes')}
            className={`amigos-list-filtro-btn ${filtro === 'con-mensajes' ? 'active' : ''}`}
          >
            Con mensajes ({amigosConMensajes})
          </button>
          <button
            onClick={() => setFiltro('sin-mensajes')}
            className={`amigos-list-filtro-btn ${filtro === 'sin-mensajes' ? 'active' : ''}`}
          >
            Sin mensajes ({amigosSinMensajes})
          </button>
        </div>
      </div>

      {/* Lista de amigos */}
      <div className="amigos-list">
        {amigosFiltrados.length === 0 ? (
          <div className="amigos-list-empty">
            <svg 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <p>
              {busqueda.trim() 
                ? 'No se encontraron amigos con ese nombre' 
                : filtro === 'con-mensajes' 
                  ? 'No hay amigos con mensajes'
                  : filtro === 'sin-mensajes'
                    ? 'Todos tus amigos tienen mensajes'
                    : 'No tienes amigos agregados'}
            </p>
            {!busqueda.trim() && amigos.length === 0 && (
              <Link href="/dashboard/amigos" className="btn btn-primary">
                Agregar amigos
              </Link>
            )}
          </div>
        ) : (
          amigosFiltrados.map((chatInfo) => (
            <AmigoListItem
              key={chatInfo.amigo.id}
              chatInfo={chatInfo}
              onClick={() => onAmigoClick?.(chatInfo.amigo)}
            />
          ))
        )}
      </div>
    </div>
  )
}

