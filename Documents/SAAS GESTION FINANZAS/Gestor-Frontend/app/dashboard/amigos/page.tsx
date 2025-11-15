'use client'

// Página de Amigos
// Sistema completo de solicitudes de amistad
// Flujo: Buscar usuarios → Enviar solicitud → Aceptar/Rechazar → Chatear (solo activos mutuos)

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuth } from '@/lib/auth'
import { 
  getAmigos, 
  searchUsuarios,
  enviarSolicitud,
  getSolicitudesRecibidas,
  aceptarSolicitud,
  rechazarSolicitud,
  deleteAmigo,
  type Amigo,
  type UsuarioConEstado,
  type SolicitudAmistad
} from '@/lib/amigos'

type Tab = 'amigos' | 'buscar' | 'solicitudes'

export default function AmigosPage() {
  const router = useRouter()
  const [tabActivo, setTabActivo] = useState<Tab>('amigos')
  
  // Estado para amigos
  const [amigos, setAmigos] = useState<Amigo[]>([])
  const [loadingAmigos, setLoadingAmigos] = useState(true)
  
  // Estado para búsqueda de usuarios
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('')
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<UsuarioConEstado[]>([])
  const [loadingBusqueda, setLoadingBusqueda] = useState(false)
  
  // Estado para solicitudes
  const [solicitudes, setSolicitudes] = useState<SolicitudAmistad[]>([])
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true)
  
  const [error, setError] = useState<string | null>(null)

  // Verificar autenticación y cargar datos iniciales
  useEffect(() => {
    const isAuthenticated = getAuth()
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    loadAmigos()
    loadSolicitudes()
  }, [router])

  // Cargar amigos (solo activos)
  const loadAmigos = async () => {
    setLoadingAmigos(true)
    setError(null)
    
    try {
      const amigosData = await getAmigos()
      setAmigos(amigosData)
    } catch (err: any) {
      console.error('Error al cargar amigos:', err)
      setError(err.message || 'Error al cargar los amigos')
      setAmigos([])
    } finally {
      setLoadingAmigos(false)
    }
  }

  // Cargar solicitudes recibidas
  const loadSolicitudes = async () => {
    setLoadingSolicitudes(true)
    setError(null)
    
    try {
      const solicitudesData = await getSolicitudesRecibidas()
      setSolicitudes(solicitudesData)
    } catch (err: any) {
      console.error('Error al cargar solicitudes:', err)
      setError(err.message || 'Error al cargar las solicitudes')
      setSolicitudes([])
    } finally {
      setLoadingSolicitudes(false)
    }
  }

  // Buscar usuarios del sistema
  useEffect(() => {
    if (tabActivo !== 'buscar') return
    
    const buscarUsuarios = async () => {
      if (!busquedaUsuarios.trim()) {
        setUsuariosEncontrados([])
        return
      }

      try {
        setLoadingBusqueda(true)
        const usuarios = await searchUsuarios(busquedaUsuarios.trim())
        setUsuariosEncontrados(usuarios)
        setError(null)
      } catch (err: any) {
        console.error('Error al buscar usuarios:', err)
        setError(err.message || 'Error al buscar usuarios')
        setUsuariosEncontrados([])
      } finally {
        setLoadingBusqueda(false)
      }
    }

    // Debounce: esperar 500ms después de que el usuario deje de escribir
    const timeoutId = setTimeout(buscarUsuarios, 500)
    return () => clearTimeout(timeoutId)
  }, [busquedaUsuarios, tabActivo])

  // Función para enviar solicitud de amistad
  const handleEnviarSolicitud = async (amigoUserId: string) => {
    try {
      setError(null)
      await enviarSolicitud(amigoUserId)
      
      // Actualizar estado del usuario en la lista
      setUsuariosEncontrados(usuariosEncontrados.map(u => 
        u._id === amigoUserId 
          ? { ...u, estadoAmistad: 'pendiente', esAmigo: false }
          : u
      ))
      
      // Mostrar mensaje de éxito
      alert('Solicitud enviada exitosamente')
    } catch (err: any) {
      const errorMessage = err.message || 'Error al enviar solicitud'
      setError(errorMessage)
      alert(errorMessage)
    }
  }

  // Función para aceptar solicitud
  const handleAceptarSolicitud = async (solicitudId: string) => {
    try {
      setError(null)
      await aceptarSolicitud(solicitudId)
      
      // Recargar solicitudes y amigos
      await loadSolicitudes()
      await loadAmigos()
      
      alert('Solicitud aceptada. ¡Ahora son amigos!')
    } catch (err: any) {
      const errorMessage = err.message || 'Error al aceptar solicitud'
      setError(errorMessage)
      alert(errorMessage)
    }
  }

  // Función para rechazar solicitud
  const handleRechazarSolicitud = async (solicitudId: string) => {
    try {
      setError(null)
      await rechazarSolicitud(solicitudId)
      
      // Recargar solicitudes
      await loadSolicitudes()
      
      alert('Solicitud rechazada')
    } catch (err: any) {
      const errorMessage = err.message || 'Error al rechazar solicitud'
      setError(errorMessage)
      alert(errorMessage)
    }
  }

  // Función para eliminar amigo
  const handleEliminarAmigo = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este amigo?')) {
      return
    }

    try {
      setError(null)
      await deleteAmigo(id)
      setAmigos(amigos.filter(amigo => amigo.id !== id))
      alert('Amigo eliminado exitosamente')
    } catch (err: any) {
      const errorMessage = err.message || 'Error al eliminar amigo'
      setError(errorMessage)
      alert(errorMessage)
    }
  }

  // Función para obtener iniciales del nombre
  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  // Función para formatear fecha
  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })
  }

  return (
    <div className="amigos-page">
      <div className="amigos-container">
        {/* Header de la página */}
        <div className="amigos-header">
          <div>
            <h1 className="amigos-title">Amigos</h1>
            <p className="amigos-subtitle">
              {tabActivo === 'amigos' && `${amigos.length} amigo${amigos.length !== 1 ? 's' : ''} activo${amigos.length !== 1 ? 's' : ''}`}
              {tabActivo === 'buscar' && 'Buscar usuarios del sistema'}
              {tabActivo === 'solicitudes' && `${solicitudes.length} solicitud${solicitudes.length !== 1 ? 'es' : ''} pendiente${solicitudes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="amigos-tabs">
          <button
            onClick={() => setTabActivo('amigos')}
            className={`amigos-tab ${tabActivo === 'amigos' ? 'active' : ''}`}
          >
            Mis Amigos ({amigos.length})
          </button>
          <button
            onClick={() => setTabActivo('buscar')}
            className={`amigos-tab ${tabActivo === 'buscar' ? 'active' : ''}`}
          >
            Buscar Usuarios
          </button>
          <button
            onClick={() => setTabActivo('solicitudes')}
            className={`amigos-tab ${tabActivo === 'solicitudes' ? 'active' : ''}`}
          >
            Solicitudes ({solicitudes.length})
          </button>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="amigos-error-banner">
            <p>Error: {error}</p>
            <button onClick={() => setError(null)} className="btn-close">×</button>
          </div>
        )}

        {/* Contenido según tab activo */}
        {tabActivo === 'amigos' && (
          <div className="amigos-content">
            {loadingAmigos ? (
              <div className="amigos-empty">
                <p>Cargando amigos...</p>
              </div>
            ) : amigos.length === 0 ? (
              <div className="amigos-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <p>No tienes amigos activos. Busca usuarios y envía solicitudes de amistad.</p>
                <button
                  onClick={() => setTabActivo('buscar')}
                  className="btn btn-primary"
                >
                  Buscar Usuarios
                </button>
              </div>
            ) : (
              <div className="amigos-grid">
                {amigos.map((amigo) => (
                  <div key={amigo.id} className="amigo-card">
                    <div className="amigo-avatar">
                      {amigo.avatar ? (
                        <img src={amigo.avatar} alt={amigo.nombre} className="amigo-avatar-image" />
                      ) : (
                        <div className="amigo-avatar-placeholder">
                          {getInitials(amigo.nombre)}
                        </div>
                      )}
                    </div>
                    <div className="amigo-info">
                      <h3 className="amigo-nombre">{amigo.nombre}</h3>
                      <p className="amigo-email">{amigo.email}</p>
                      {amigo.fechaAmistad && (
                        <p className="amigo-fecha">
                          Amigos desde {formatFecha(amigo.fechaAmistad)}
                        </p>
                      )}
                    </div>
                    <div className="amigo-actions">
                      {/* Solo amigos activos pueden chatear */}
                      {amigo.estado === 'activo' && (
                        <Link
                          href={`/dashboard/chat/${amigo.id}`}
                          className="btn-link btn-link-chat"
                          title="Abrir chat"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          Chat
                        </Link>
                      )}
                      <button
                        onClick={() => handleEliminarAmigo(amigo.id)}
                        className="btn-link btn-link-danger"
                        title="Eliminar amigo"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tabActivo === 'buscar' && (
          <div className="amigos-content">
            <div className="amigos-search-container">
              <div className="amigos-search">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  className="amigos-search-input"
                  placeholder="Buscar por nombre o email..."
                  value={busquedaUsuarios}
                  onChange={(e) => setBusquedaUsuarios(e.target.value)}
                />
              </div>
            </div>

            {loadingBusqueda ? (
              <div className="amigos-empty">
                <p>Buscando usuarios...</p>
              </div>
            ) : busquedaUsuarios.trim() === '' ? (
              <div className="amigos-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <p>Escribe un nombre o email para buscar usuarios del sistema</p>
              </div>
            ) : usuariosEncontrados.length === 0 ? (
              <div className="amigos-empty">
                <p>No se encontraron usuarios con ese nombre o email</p>
              </div>
            ) : (
              <div className="amigos-grid">
                {usuariosEncontrados.map((usuario) => (
                  <div key={usuario._id} className="amigo-card">
                    <div className="amigo-avatar">
                      {usuario.avatar ? (
                        <img src={usuario.avatar} alt={usuario.nombre} className="amigo-avatar-image" />
                      ) : (
                        <div className="amigo-avatar-placeholder">
                          {getInitials(usuario.nombre)}
                        </div>
                      )}
                    </div>
                    <div className="amigo-info">
                      <h3 className="amigo-nombre">{usuario.nombre}</h3>
                      <p className="amigo-email">{usuario.email}</p>
                      <span className={`amigo-estado estado-${usuario.estadoAmistad || 'sin-relacion'}`}>
                        {usuario.estadoAmistad === 'activo' && '✓ Ya son amigos'}
                        {usuario.estadoAmistad === 'pendiente' && 'Solicitud pendiente'}
                        {usuario.estadoAmistad === 'rechazada' && 'Solicitud rechazada'}
                        {usuario.estadoAmistad === 'bloqueado' && 'Bloqueado'}
                        {!usuario.estadoAmistad && 'Sin relación'}
                      </span>
                    </div>
                    <div className="amigo-actions">
                      {!usuario.esAmigo && usuario.estadoAmistad !== 'pendiente' && usuario.estadoAmistad !== 'rechazada' && (
                        <button
                          onClick={() => handleEnviarSolicitud(usuario._id)}
                          className="btn-link btn-link-primary"
                          title="Enviar solicitud de amistad"
                        >
                          Enviar Solicitud
                        </button>
                      )}
                      {usuario.estadoAmistad === 'pendiente' && (
                        <span className="amigo-estado-badge">Solicitud pendiente</span>
                      )}
                      {usuario.esAmigo && (
                        <span className="amigo-estado-badge">✓ Ya son amigos</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tabActivo === 'solicitudes' && (
          <div className="amigos-content">
            {loadingSolicitudes ? (
              <div className="amigos-empty">
                <p>Cargando solicitudes...</p>
              </div>
            ) : solicitudes.length === 0 ? (
              <div className="amigos-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <p>No tienes solicitudes de amistad pendientes</p>
              </div>
            ) : (
              <div className="amigos-grid">
                {solicitudes.map((solicitud) => (
                  <div key={solicitud._id} className="amigo-card">
                    <div className="amigo-avatar">
                      {solicitud.solicitante.avatar ? (
                        <img src={solicitud.solicitante.avatar} alt={solicitud.solicitante.nombre} className="amigo-avatar-image" />
                      ) : (
                        <div className="amigo-avatar-placeholder">
                          {getInitials(solicitud.solicitante.nombre)}
                        </div>
                      )}
                    </div>
                    <div className="amigo-info">
                      <h3 className="amigo-nombre">{solicitud.solicitante.nombre}</h3>
                      <p className="amigo-email">{solicitud.solicitante.email}</p>
                      <p className="amigo-fecha">
                        Solicitud recibida el {formatFecha(solicitud.createdAt)}
                      </p>
                    </div>
                    <div className="amigo-actions">
                      <button
                        onClick={() => handleAceptarSolicitud(solicitud._id)}
                        className="btn-link btn-link-primary"
                        title="Aceptar solicitud"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => handleRechazarSolicitud(solicitud._id)}
                        className="btn-link btn-link-danger"
                        title="Rechazar solicitud"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
