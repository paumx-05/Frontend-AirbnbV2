'use client'

// Página de Gestión de Categorías
// Permite crear, editar y eliminar categorías personalizadas

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuth, getUsuarioActual } from '@/lib/auth'
import {
  getCategorias,
  addCategoria,
  updateCategoria,
  deleteCategoria,
  type Categoria
} from '@/lib/categorias'

// Función para obtener el mes actual en formato para URL
function getMesActual(): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]
  const mesActual = new Date().getMonth()
  return meses[mesActual]
}

// Función para obtener el nombre del mes actual en español
function getNombreMesActual(): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const mesActual = new Date().getMonth()
  return meses[mesActual]
}

export default function CategoriasPage() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true) // Iniciar en true para mostrar loading inicial
  const [error, setError] = useState('')
  
  // Estados para el formulario
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<'gasto' | 'ingreso' | 'ambos'>('gasto')
  
  // Estados para expandir/colapsar subcategorías en la lista (toggle inline)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  // Estado para inputs de nueva subcategoría por categoría
  const [nuevaSubInput, setNuevaSubInput] = useState<Record<string, string>>({})

  // Verificar autenticación al cargar
  useEffect(() => {
    const isAuthenticated = getAuth()
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [router])

  // Cargar categorías al montar
  useEffect(() => {
    loadCategorias()
  }, [])

  // Función para cargar categorías desde el backend
  const loadCategorias = async () => {
    const usuarioActual = getUsuarioActual()
    if (usuarioActual) {
      try {
        setLoading(true)
        setError('')
        const categoriasData = await getCategorias(usuarioActual.id)
        setCategorias(categoriasData)
      } catch (err: any) {
        console.error('Error al cargar categorías:', err)
        setError(err.message || 'Error al cargar las categorías')
      } finally {
        setLoading(false)
      }
    }
  }

  // Función para manejar el submit del formulario (solo categoría principal, sin subcategorías)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (editingId) {
        // Actualizar categoría existente (solo nombre y tipo, no subcategorías)
        await updateCategoria(editingId, { 
          nombre: nombre.trim(), 
          tipo
        })
      } else {
        // Crear nueva categoría (sin subcategorías inicialmente)
        await addCategoria({ 
          nombre: nombre.trim(), 
          tipo
        })
      }
      
      await loadCategorias()
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Error al guardar la categoría')
    } finally {
      setLoading(false)
    }
  }

  // Función para resetear el formulario
  const resetForm = () => {
    setNombre('')
    setTipo('gasto')
    setEditingId(null)
    setError('')
  }

  // Función para editar una categoría (solo nombre y tipo)
  const handleEdit = (categoria: Categoria) => {
    setNombre(categoria.nombre)
    setTipo(categoria.tipo)
    setEditingId(categoria.id)
    setError('')
  }
  
  // Función para toggle expandir/colapsar subcategorías inline
  const toggleSubcategorias = (categoriaId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoriaId)) {
      newExpanded.delete(categoriaId)
      // Limpiar input al colapsar
      setNuevaSubInput({ ...nuevaSubInput, [categoriaId]: '' })
    } else {
      newExpanded.add(categoriaId)
    }
    setExpandedCategories(newExpanded)
  }
  
  // Función para añadir subcategoría inline a una categoría específica
  const handleAddSubcategoriaInline = async (categoriaId: string) => {
    const nuevaSub = nuevaSubInput[categoriaId]?.trim()
    if (!nuevaSub) return

    const categoria = categorias.find(c => c.id === categoriaId)
    if (!categoria) return

    const subcategoriasActuales = categoria.subcategorias || []
    
    // Validaciones
    if (subcategoriasActuales.includes(nuevaSub)) {
      setError('Esta subcategoría ya existe')
      return
    }

    if (subcategoriasActuales.length >= 20) {
      setError('Máximo 20 subcategorías por categoría')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      // Añadir la nueva subcategoría al array
      const nuevasSubcategorias = [...subcategoriasActuales, nuevaSub]
      
      // Actualizar en el backend
      await updateCategoria(categoriaId, {
        subcategorias: nuevasSubcategorias
      })
      
      // Limpiar input
      setNuevaSubInput({ ...nuevaSubInput, [categoriaId]: '' })
      
      // Recargar categorías
      await loadCategorias()
    } catch (err: any) {
      setError(err.message || 'Error al añadir subcategoría')
    } finally {
      setLoading(false)
    }
  }
  
  // Función para eliminar subcategoría inline de una categoría específica
  const handleRemoveSubcategoriaInline = async (categoriaId: string, index: number) => {
    const categoria = categorias.find(c => c.id === categoriaId)
    if (!categoria || !categoria.subcategorias) return

    try {
      setLoading(true)
      setError('')
      
      // Eliminar la subcategoría del array
      const nuevasSubcategorias = categoria.subcategorias.filter((_, i) => i !== index)
      
      // Actualizar en el backend
      await updateCategoria(categoriaId, {
        subcategorias: nuevasSubcategorias.length > 0 ? nuevasSubcategorias : []
      })
      
      // Recargar categorías
      await loadCategorias()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar subcategoría')
    } finally {
      setLoading(false)
    }
  }

  // Función para eliminar una categoría
  const handleDelete = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar la categoría "${nombre}"?`)) {
      const usuarioActual = getUsuarioActual()
      if (usuarioActual) {
        try {
          setLoading(true)
          setError('')
          await deleteCategoria(id, usuarioActual.id)
          await loadCategorias()
          if (editingId === id) {
            resetForm()
          }
        } catch (err: any) {
          setError(err.message || 'Error al eliminar la categoría')
        } finally {
          setLoading(false)
        }
      }
    }
  }

  // Agrupar categorías por tipo
  const categoriasGastos = categorias.filter(c => c.tipo === 'gasto' || c.tipo === 'ambos')
  const categoriasIngresos = categorias.filter(c => c.tipo === 'ingreso' || c.tipo === 'ambos')

  if (loading && categorias.length === 0) {
    return (
      <div className="categorias-page">
        <div className="categorias-container">
          <div className="categorias-header">
            <h1 className="categorias-title">Tus Categorías</h1>
            <p className="categorias-subtitle">Cargando categorías...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="categorias-page">
      <div className="categorias-container">
        <div className="categorias-header">
          <h1 className="categorias-title">Tus Categorías</h1>
          <p className="categorias-subtitle">
            Crea y gestiona tus categorías personalizadas para gastos e ingresos
          </p>
        </div>

        {/* Formulario para agregar/editar categorías */}
        <div className="categorias-form-card">
          <h2 className="categorias-form-title">
            {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="categoria-form">
            <div className="form-group">
              <label htmlFor="nombre" className="form-label">Nombre de la categoría:</label>
              <input
                type="text"
                id="nombre"
                className="form-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ej: Supermercado, Freelance, etc."
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tipo" className="form-label">Tipo:</label>
              <select
                id="tipo"
                className="form-input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as 'gasto' | 'ingreso' | 'ambos')}
                required
                disabled={loading}
              >
                <option value="gasto">Solo Gastos</option>
                <option value="ingreso">Solo Ingresos</option>
                <option value="ambos">Gastos e Ingresos</option>
              </select>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'} Categoría
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de categorías */}
        <div className="categorias-list-container">
          {/* Categorías de Gastos */}
          <div className="categorias-section">
            <h2 className="categorias-section-title">
              Categorías de Gastos ({categoriasGastos.length})
            </h2>
            {categoriasGastos.length > 0 ? (
              <div className="categorias-grid">
                {categoriasGastos.map((categoria) => {
                  const mesActual = getMesActual()
                  const nombreMes = getNombreMesActual()
                  const urlGastos = `/dashboard/gastos/${mesActual}?categoria=${encodeURIComponent(categoria.nombre)}`
                  
                  const subcategoriasCount = categoria.subcategorias?.length || 0
                  const isExpanded = expandedCategories.has(categoria.id)
                  
                  return (
                    <div key={categoria.id} className="categoria-card-v3">
                      {/* Header de la categoría */}
                      <div className="categoria-header">
                        <div className="categoria-info-left">
                          <Link 
                            href={urlGastos}
                            className="categoria-nombre-link"
                            title={`Ver gastos de ${categoria.nombre} en ${nombreMes}`}
                          >
                            <h3 className="categoria-nombre">{categoria.nombre}</h3>
                          </Link>
                          <span className="categoria-tipo-badge">
                            {categoria.tipo === 'ambos' ? 'Gastos e Ingresos' : 'Solo Gastos'}
                          </span>
                        </div>
                        <div className="categoria-actions">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleEdit(categoria)
                            }}
                            className="btn-icon"
                            title="Editar categoría"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleDelete(categoria.id, categoria.nombre)
                            }}
                            className="btn-icon"
                            title="Eliminar categoría"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Toggle de Subcategorías */}
                      <div className="subcategorias-toggle-section">
                        <button
                          className="subcategorias-toggle-btn"
                          onClick={() => toggleSubcategorias(categoria.id)}
                          type="button"
                        >
                          <span className="toggle-icon">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                          <span className="toggle-text">
                            {subcategoriasCount} subcategoría{subcategoriasCount !== 1 ? 's' : ''}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="subcategorias-expanded-content">
                            {/* Input para nueva subcategoría */}
                            <div className="nueva-subcategoria-row">
                              <input
                                type="text"
                                value={nuevaSubInput[categoria.id] || ''}
                                onChange={(e) => setNuevaSubInput({
                                  ...nuevaSubInput,
                                  [categoria.id]: e.target.value
                                })}
                                placeholder="Ej: Supermercado"
                                className="subcategoria-input-simple"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddSubcategoriaInline(categoria.id)
                                  }
                                }}
                                disabled={loading || subcategoriasCount >= 20}
                                maxLength={50}
                              />
                              <button
                                onClick={() => handleAddSubcategoriaInline(categoria.id)}
                                className="btn-add-sub-inline"
                                disabled={loading || !nuevaSubInput[categoria.id]?.trim() || subcategoriasCount >= 20}
                                type="button"
                                title="Añadir subcategoría"
                              >
                                + Añadir
                              </button>
                            </div>

                            {/* Lista de subcategorías */}
                            {categoria.subcategorias && categoria.subcategorias.length > 0 ? (
                              <ul className="subcategorias-list-simple">
                                {categoria.subcategorias.map((sub, idx) => (
                                  <li key={idx} className="subcategoria-item-simple">
                                    <span className="subcategoria-bullet">•</span>
                                    <span className="subcategoria-text">{sub}</span>
                                    <button
                                      onClick={() => handleRemoveSubcategoriaInline(categoria.id, idx)}
                                      className="btn-remove-sub-inline"
                                      disabled={loading}
                                      type="button"
                                      title="Eliminar subcategoría"
                                    >
                                      ✕
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="subcategorias-empty">
                                Sin subcategorías. Añade una arriba ↑
                              </p>
                            )}

                            {subcategoriasCount >= 20 && (
                              <p className="subcategorias-limit-warning">
                                ⚠️ Límite máximo alcanzado (20 subcategorías)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="categorias-empty">No hay categorías de gastos creadas</p>
            )}
          </div>

          {/* Categorías de Ingresos */}
          <div className="categorias-section">
            <h2 className="categorias-section-title">
              Categorías de Ingresos ({categoriasIngresos.length})
            </h2>
            {categoriasIngresos.length > 0 ? (
              <div className="categorias-grid">
                {categoriasIngresos.map((categoria) => {
                  const mesActual = getMesActual()
                  const nombreMes = getNombreMesActual()
                  const urlIngresos = `/dashboard/ingresos/${mesActual}?categoria=${encodeURIComponent(categoria.nombre)}`
                  
                  const subcategoriasCount = categoria.subcategorias?.length || 0
                  const isExpanded = expandedCategories.has(categoria.id)
                  
                  return (
                    <div key={categoria.id} className="categoria-card-v3">
                      {/* Header de la categoría */}
                      <div className="categoria-header">
                        <div className="categoria-info-left">
                          <Link 
                            href={urlIngresos}
                            className="categoria-nombre-link"
                            title={`Ver ingresos de ${categoria.nombre} en ${nombreMes}`}
                          >
                            <h3 className="categoria-nombre">{categoria.nombre}</h3>
                          </Link>
                          <span className="categoria-tipo-badge">
                            {categoria.tipo === 'ambos' ? 'Gastos e Ingresos' : 'Solo Ingresos'}
                          </span>
                        </div>
                        <div className="categoria-actions">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleEdit(categoria)
                            }}
                            className="btn-icon"
                            title="Editar categoría"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleDelete(categoria.id, categoria.nombre)
                            }}
                            className="btn-icon"
                            title="Eliminar categoría"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Toggle de Subcategorías */}
                      <div className="subcategorias-toggle-section">
                        <button
                          className="subcategorias-toggle-btn"
                          onClick={() => toggleSubcategorias(categoria.id)}
                          type="button"
                        >
                          <span className="toggle-icon">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                          <span className="toggle-text">
                            {subcategoriasCount} subcategoría{subcategoriasCount !== 1 ? 's' : ''}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="subcategorias-expanded-content">
                            {/* Input para nueva subcategoría */}
                            <div className="nueva-subcategoria-row">
                              <input
                                type="text"
                                value={nuevaSubInput[categoria.id] || ''}
                                onChange={(e) => setNuevaSubInput({
                                  ...nuevaSubInput,
                                  [categoria.id]: e.target.value
                                })}
                                placeholder="Ej: Freelance"
                                className="subcategoria-input-simple"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddSubcategoriaInline(categoria.id)
                                  }
                                }}
                                disabled={loading || subcategoriasCount >= 20}
                                maxLength={50}
                              />
                              <button
                                onClick={() => handleAddSubcategoriaInline(categoria.id)}
                                className="btn-add-sub-inline"
                                disabled={loading || !nuevaSubInput[categoria.id]?.trim() || subcategoriasCount >= 20}
                                type="button"
                                title="Añadir subcategoría"
                              >
                                + Añadir
                              </button>
                            </div>

                            {/* Lista de subcategorías */}
                            {categoria.subcategorias && categoria.subcategorias.length > 0 ? (
                              <ul className="subcategorias-list-simple">
                                {categoria.subcategorias.map((sub, idx) => (
                                  <li key={idx} className="subcategoria-item-simple">
                                    <span className="subcategoria-bullet">•</span>
                                    <span className="subcategoria-text">{sub}</span>
                                    <button
                                      onClick={() => handleRemoveSubcategoriaInline(categoria.id, idx)}
                                      className="btn-remove-sub-inline"
                                      disabled={loading}
                                      type="button"
                                      title="Eliminar subcategoría"
                                    >
                                      ✕
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="subcategorias-empty">
                                Sin subcategorías. Añade una arriba ↑
                              </p>
                            )}

                            {subcategoriasCount >= 20 && (
                              <p className="subcategorias-limit-warning">
                                ⚠️ Límite máximo alcanzado (20 subcategorías)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="categorias-empty">No hay categorías de ingresos creadas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

