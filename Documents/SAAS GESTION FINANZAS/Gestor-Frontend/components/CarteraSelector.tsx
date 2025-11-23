'use client'

// Componente selector de cartera
// Permite al usuario cambiar entre carteras, crear nuevas y eliminar carteras

import { useState } from 'react'
import { useCartera } from '@/hooks/useCartera'

export default function CarteraSelector() {
  const {
    carteraActiva,
    carteras,
    setCarteraActivaId,
    createCartera,
    deleteCartera,
    loading,
  } = useCartera()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [carteraToDelete, setCarteraToDelete] = useState<string | null>(null)
  const [deleteData, setDeleteData] = useState(false)
  const [newCarteraNombre, setNewCarteraNombre] = useState('')
  const [newCarteraDescripcion, setNewCarteraDescripcion] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSelectCartera = (carteraId: string) => {
    setCarteraActivaId(carteraId)
  }

  const handleCreateCartera = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCarteraNombre.trim()) return

    setCreating(true)
    try {
      const result = await createCartera({
        nombre: newCarteraNombre.trim(),
        descripcion: newCarteraDescripcion.trim() || undefined,
      })

      if (result.success) {
        setShowCreateModal(false)
        setNewCarteraNombre('')
        setNewCarteraDescripcion('')
      } else {
        alert(result.error || 'Error al crear cartera')
      }
    } catch (error: any) {
      alert(error.message || 'Error al crear cartera')
    } finally {
      setCreating(false)
    }
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
      <div className="cartera-selector">
        <div className="cartera-selector-loading">Cargando carteras...</div>
      </div>
    )
  }

  return (
    <div className="cartera-selector">
      <div className="cartera-selector-container">
        <label htmlFor="cartera-select" className="cartera-selector-label">
          Cartera:
        </label>
        <select
          id="cartera-select"
          value={carteraActiva?._id || ''}
          onChange={(e) => handleSelectCartera(e.target.value)}
          className="cartera-selector-select"
        >
          {carteras.length === 0 ? (
            <option value="">No hay carteras</option>
          ) : (
            carteras.map((cartera) => (
              <option key={cartera._id} value={cartera._id}>
                {cartera.nombre}
              </option>
            ))
          )}
        </select>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="cartera-selector-add-btn"
          title="Crear nueva cartera"
        >
          +
        </button>
        {carteraActiva && carteras.length > 0 && (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="cartera-selector-delete-btn"
            title="Eliminar cartera activa"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Modal para crear nueva cartera */}
      {showCreateModal && (
        <div className="cartera-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="cartera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cartera-modal-header">
              <h3>Crear Nueva Cartera</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="cartera-modal-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateCartera} className="cartera-modal-form">
              <div className="cartera-modal-field">
                <label htmlFor="cartera-nombre">Nombre *</label>
                <input
                  id="cartera-nombre"
                  type="text"
                  value={newCarteraNombre}
                  onChange={(e) => setNewCarteraNombre(e.target.value)}
                  placeholder="Ej: Personal, Negocio, Ahorros..."
                  required
                  maxLength={100}
                />
              </div>
              <div className="cartera-modal-field">
                <label htmlFor="cartera-descripcion">Descripción</label>
                <textarea
                  id="cartera-descripcion"
                  value={newCarteraDescripcion}
                  onChange={(e) => setNewCarteraDescripcion(e.target.value)}
                  placeholder="Descripción opcional de la cartera"
                  maxLength={500}
                  rows={3}
                />
              </div>
              <div className="cartera-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating || !newCarteraNombre.trim()}
                >
                  {creating ? 'Creando...' : 'Crear Cartera'}
                </button>
              </div>
            </form>
          </div>
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

