'use client'

// Página de Mensajes
// Muestra la lista de amigos agregados y permite acceder a sus chats
// Integración con sistema de amigos y chats

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuth } from '@/lib/auth'
import { getAmigos, type Amigo } from '@/lib/amigos'
import AmigosList from '@/components/AmigosList'

export default function MensajesPage() {
  const router = useRouter()
  const [amigos, setAmigos] = useState<Amigo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verificar autenticación y cargar amigos
  useEffect(() => {
    const isAuthenticated = getAuth()
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    loadAmigos()
  }, [router])

  // Cargar amigos desde el backend
  const loadAmigos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const amigosData = await getAmigos()
      setAmigos(amigosData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar amigos'
      setError(errorMessage)
      console.error('Error al cargar amigos:', err)
      setAmigos([])
    } finally {
      setLoading(false)
    }
  }

  // Función para manejar click en un amigo
  const handleAmigoClick = (amigo: Amigo) => {
    // La navegación se maneja automáticamente por el Link en AmigoListItem
    // Esta función puede usarse para tracking o acciones adicionales
    console.log('Navegando al chat con:', amigo.nombre)
  }

  // Estado de carga
  if (loading) {
    return (
      <div className="mensajes-page">
        <div className="mensajes-container">
          <div className="mensajes-loading">
            <p>Cargando amigos...</p>
          </div>
        </div>
      </div>
    )
  }

  // Estado de error
  if (error && amigos.length === 0) {
    return (
      <div className="mensajes-page">
        <div className="mensajes-container">
          <div className="mensajes-error">
            <p>Error: {error}</p>
            <button onClick={loadAmigos} className="btn btn-primary">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mensajes-page">
      <div className="mensajes-container">
        {/* Header de la página */}
        <div className="mensajes-header">
          <div>
            <h1 className="mensajes-title">Mensajes</h1>
            <p className="mensajes-subtitle">
              {amigos.length > 0
                ? `${amigos.length} amigo${amigos.length > 1 ? 's' : ''} agregado${amigos.length > 1 ? 's' : ''}`
                : 'No tienes amigos agregados'}
            </p>
          </div>
          <div className="mensajes-header-actions">
            <Link href="/dashboard/amigos" className="btn btn-primary">
              Gestionar amigos
            </Link>
          </div>
        </div>

        {/* Mensaje de error (si hay amigos pero ocurrió un error) */}
        {error && amigos.length > 0 && (
          <div className="mensajes-error-banner">
            <p>Error: {error}</p>
            <button onClick={() => setError(null)} className="btn-close">×</button>
          </div>
        )}

        {/* Contenido principal - Lista de amigos con chats */}
        <div className="mensajes-content">
          <div className="mensajes-lista-container">
            {amigos.length === 0 ? (
              <div className="mensajes-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <p>No tienes amigos agregados</p>
                <Link href="/dashboard/amigos" className="btn btn-primary">
                  Agregar amigos
                </Link>
              </div>
            ) : (
              <AmigosList amigos={amigos} onAmigoClick={handleAmigoClick} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

