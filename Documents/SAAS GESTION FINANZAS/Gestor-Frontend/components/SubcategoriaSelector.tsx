'use client'

// Componente reutilizable para seleccionar subcategoría
// Muestra un select dinámico basado en la categoría seleccionada

import { useEffect, useState, useCallback } from 'react'
import { getCategorias, type Categoria } from '@/lib/categorias'
import { getUsuarioActual } from '@/lib/auth'

interface SubcategoriaSelectorProps {
  categoriaSeleccionada: string
  subcategoriaSeleccionada?: string
  onChange: (subcategoria: string) => void
  disabled?: boolean
  className?: string
}

export default function SubcategoriaSelector({
  categoriaSeleccionada,
  subcategoriaSeleccionada,
  onChange,
  disabled = false,
  className = ''
}: SubcategoriaSelectorProps) {
  const [subcategorias, setSubcategorias] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar subcategorías cuando cambia la categoría
  useEffect(() => {
    let cancelled = false

    const loadSubcategorias = async () => {
      if (!categoriaSeleccionada || categoriaSeleccionada.trim() === '') {
        if (!cancelled) {
          setSubcategorias([])
          setLoading(false)
          setError(null)
        }
        return
      }

      const usuarioActual = getUsuarioActual()
      if (!usuarioActual) {
        console.warn('[SubcategoriaSelector] No hay usuario actual')
        if (!cancelled) {
          setSubcategorias([])
          setLoading(false)
          setError(null)
        }
        return
      }

      try {
        if (!cancelled) {
          setLoading(true)
          setError(null)
        }
        
        console.log('[SubcategoriaSelector] 🔍 Cargando subcategorías para categoría:', categoriaSeleccionada)
        
        const categorias = await getCategorias(usuarioActual.id)
        
        if (cancelled) return
        
        console.log('[SubcategoriaSelector] 📦 Categorías cargadas:', categorias.length)
        console.log('[SubcategoriaSelector] 📋 Lista de categorías:', categorias.map(c => ({
          nombre: c.nombre,
          subCount: c.subcategorias?.length || 0,
          subcategorias: c.subcategorias
        })))
        
        // Buscar categoría por nombre (case-insensitive y trim)
        const categoriaEncontrada = categorias.find(c => {
          const nombreCategoria = c.nombre.trim().toLowerCase()
          const nombreSeleccionado = categoriaSeleccionada.trim().toLowerCase()
          const match = nombreCategoria === nombreSeleccionado
          if (match) {
            console.log('[SubcategoriaSelector] ✅ Match encontrado:', {
              buscando: categoriaSeleccionada,
              encontrado: c.nombre,
              subcategorias: c.subcategorias
            })
          }
          return match
        })
        
        if (cancelled) return
        
        if (categoriaEncontrada) {
          console.log('[SubcategoriaSelector] ✅ Categoría encontrada:', {
            nombre: categoriaEncontrada.nombre,
            subcategorias: categoriaEncontrada.subcategorias?.length || 0,
            subcategoriasList: categoriaEncontrada.subcategorias
          })
          
          if (categoriaEncontrada.subcategorias && categoriaEncontrada.subcategorias.length > 0) {
            setSubcategorias(categoriaEncontrada.subcategorias)
            setError(null)
            console.log('[SubcategoriaSelector] ✅ Subcategorías cargadas:', categoriaEncontrada.subcategorias)
          } else {
            console.log('[SubcategoriaSelector] ℹ️ Categoría no tiene subcategorías')
            setSubcategorias([])
            setError(null)
          }
        } else {
          console.warn('[SubcategoriaSelector] ❌ Categoría NO encontrada:', categoriaSeleccionada)
          console.log('[SubcategoriaSelector] 📋 Categorías disponibles:', categorias.map(c => `"${c.nombre}"`))
          setSubcategorias([])
          setError(null) // No mostrar error, simplemente no hay subcategorías
        }
      } catch (error: any) {
        if (cancelled) return
        console.error('[SubcategoriaSelector] ❌ Error al cargar subcategorías:', error)
        setSubcategorias([])
        setError(error.message || 'Error al cargar subcategorías')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSubcategorias()

    return () => {
      cancelled = true
    }
  }, [categoriaSeleccionada])

  // Mostrar el selector solo si hay categoría seleccionada
  if (!categoriaSeleccionada || categoriaSeleccionada.trim() === '') {
    return null
  }

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <div className={`form-group ${className}`}>
        <label className="form-label">Subcategoría (opcional):</label>
        <div className="form-input" style={{ opacity: 0.6, cursor: 'wait' }}>
          Cargando subcategorías...
        </div>
      </div>
    )
  }

  // Si hay error, mostrar mensaje (pero no bloquear)
  if (error) {
    console.warn('[SubcategoriaSelector] Error:', error)
    // Continuar mostrando el selector si hay subcategorías cargadas previamente
  }

  // Si no hay subcategorías después de cargar, no mostrar nada
  if (subcategorias.length === 0) {
    return null
  }

  return (
    <div className={`form-group ${className}`}>
      <label htmlFor="subcategoria" className="form-label">
        Subcategoría (opcional):
      </label>
      <select
        id="subcategoria"
        name="subcategoria"
        className="form-input"
        value={subcategoriaSeleccionada || ''}
        onChange={(e) => {
          const value = e.target.value
          console.log('[SubcategoriaSelector] Subcategoría seleccionada:', value)
          onChange(value)
        }}
        disabled={disabled}
      >
        <option value="">Sin subcategoría</option>
        {subcategorias.map((sub) => (
          <option key={sub} value={sub}>
            {sub}
          </option>
        ))}
      </select>
      {error && (
        <p className="form-hint" style={{ color: '#ef4444', fontSize: '0.8rem' }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  )
}

