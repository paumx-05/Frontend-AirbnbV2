'use client'

// Componente selector de cartera - DISEÑO MEJORADO
// Permite al usuario cambiar entre carteras, crear nuevas y eliminar carteras

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartera } from '@/hooks/useCartera'

export default function CarteraSelector() {
  const router = useRouter()
  const {
    carteraActiva,
    carteras,
    setCarteraActivaId,
    deleteCartera,
    loading,
  } = useCartera()

  const [showDropdown, setShowDropdown] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [carteraToDelete, setCarteraToDelete] = useState<string | null>(null)
  const [deleteData, setDeleteData] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectCartera = (carteraId: string) => {
    setCarteraActivaId(carteraId)
    setShowDropdown(false)
  }

  const handleCrearNuevaCartera = () => {
    setShowDropdown(false)
    router.push('/dashboard/carteras')
  }

  const handleDeleteClick = () => {
    if (!carteraActiva) {
      alert('No hay cartera seleccionada para eliminar')
      return
    }
    setCarteraToDelete(carteraActiva._id)
    setDeleteData(false)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!carteraToDelete) return

    setDeleting(true)
    try {
      const result = await deleteCartera(carteraToDelete, deleteData)

      if (result.success) {
        setShowDeleteModal(false)
        setCarteraToDelete(null)
        setDeleteData(false)
      } else {
        alert(result.error || 'Error al eliminar cartera')
      }
    } catch (error: any) {
      alert(error.message || 'Error al eliminar cartera')
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setCarteraToDelete(null)
    setDeleteData(false)
  }

  if (loading) {
    return (
      <div className="cartera-selector-v2">
        <div className="cartera-selector-loading">
          <div className="spinner-small"></div>
          <span>Cargando carteras...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="cartera-selector-v2" ref={dropdownRef}>
      <div className="cartera-selector-header">
        <span className="cartera-selector-icon">💼</span>
        <span className="cartera-selector-title">Cartera Activa</span>
      </div>
      
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="cartera-dropdown-trigger"
      >
        <div className="cartera-trigger-content">
          <div className="cartera-trigger-left">
            <span className="cartera-trigger-icon">{carteraActiva?.icono || '💳'}</span>
            <div className="cartera-trigger-info">
              <span className="cartera-trigger-name">
                {carteraActiva?.nombre || 'Sin cartera'}
              </span>
              {carteraActiva?.descripcion && (
                <span className="cartera-trigger-desc">{carteraActiva.descripcion}</span>
              )}
            </div>
          </div>
          <svg
            className={`cartera-trigger-arrow ${showDropdown ? 'open' : ''}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {showDropdown && (
        <div className="cartera-dropdown-menu">
          <div className="cartera-dropdown-header">
            <span className="dropdown-header-text">Seleccionar Cartera</span>
            <button
              type="button"
              onClick={handleCrearNuevaCartera}
              className="dropdown-header-btn"
              title="Crear nueva cartera"
            >
              <span className="dropdown-header-btn-icon">+</span>
              <span className="dropdown-header-btn-text">Nueva</span>
            </button>
          </div>

          <div className="cartera-dropdown-list">
            {carteras.length === 0 ? (
              <div className="cartera-dropdown-empty">
                <span className="empty-icon">📭</span>
                <p className="empty-text">No hay carteras disponibles</p>
                <button
                  onClick={handleCrearNuevaCartera}
                  className="empty-btn"
                >
                  Crear primera cartera
                </button>
              </div>
            ) : (
              carteras.map((cartera) => (
                <button
                  key={cartera._id}
                  onClick={() => handleSelectCartera(cartera._id)}
                  className={`cartera-dropdown-item ${
                    carteraActiva?._id === cartera._id ? 'active' : ''
                  }`}
                >
                  <div className="dropdown-item-left">
                    <span
                      className="dropdown-item-icon"
                      style={{ backgroundColor: cartera.color || '#3b82f6' }}
                    >
                      {cartera.icono || '💳'}
                    </span>
                    <div className="dropdown-item-info">
                      <span className="dropdown-item-name">{cartera.nombre}</span>
                      {cartera.descripcion && (
                        <span className="dropdown-item-desc">{cartera.descripcion}</span>
                      )}
                    </div>
                  </div>
                  {carteraActiva?._id === cartera._id && (
                    <svg
                      className="dropdown-item-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16.6667 5L7.50004 14.1667L3.33337 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>

          {carteraActiva && carteras.length > 0 && (
            <div className="cartera-dropdown-footer">
              <button
                type="button"
                onClick={() => {
                  handleDeleteClick()
                  setShowDropdown(false)
                }}
                className="dropdown-footer-btn dropdown-footer-btn-danger"
              >
                <span className="dropdown-footer-icon">🗑️</span>
                <span className="dropdown-footer-text">Eliminar cartera actual</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal para eliminar cartera */}
      {showDeleteModal && carteraToDelete && (
        <div className="cartera-modal-overlay" onClick={handleCancelDelete}>
          <div className="cartera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cartera-modal-header">
              <h3>Eliminar Cartera</h3>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="cartera-modal-close"
                disabled={deleting}
              >
                ×
              </button>
            </div>
            <div className="cartera-modal-body">
              <p>
                ¿Estás seguro de que deseas eliminar la cartera{' '}
                <strong>{carteras.find(c => c._id === carteraToDelete)?.nombre}</strong>?
              </p>
              
              <div className="cartera-modal-field" style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={deleteData}
                    onChange={(e) => setDeleteData(e.target.checked)}
                    disabled={deleting}
                  />
                  <span>
                    <strong>Eliminar también todos los datos asociados</strong> (gastos, ingresos, presupuestos)
                  </span>
                </label>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                  {deleteData
                    ? '⚠️ Esta acción eliminará permanentemente todos los gastos, ingresos y presupuestos asociados a esta cartera. Esta acción no se puede deshacer.'
                    : 'Los datos se mantendrán pero quedarán sin cartera asignada (carteraId = null).'}
                </p>
              </div>
            </div>
            <div className="cartera-modal-actions">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="btn btn-secondary"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn btn-danger"
                disabled={deleting}
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                {deleting ? 'Eliminando...' : 'Eliminar Cartera'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

