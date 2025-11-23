'use client'

// Context para gestión de cartera activa
// Proporciona estado global para la cartera seleccionada por el usuario

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Cartera } from '@/models/carteras'
import { carterasController } from '@/controllers/carteras.controller'

interface CarteraContextType {
  carteraActiva: Cartera | null
  carteras: Cartera[]
  setCarteraActiva: (cartera: Cartera | null) => void
  carteraActivaId: string | null
  setCarteraActivaId: (id: string | null) => void
  refreshCarteras: () => Promise<void>
  loading: boolean
  error: string | null
}

const CarteraContext = createContext<CarteraContextType | undefined>(undefined)

const CARTERA_ACTIVA_STORAGE_KEY = 'carteraActivaId'

export function CarteraProvider({ children }: { children: ReactNode }) {
  const [carteraActiva, setCarteraActivaState] = useState<Cartera | null>(null)
  const [carteras, setCarteras] = useState<Cartera[]>([])
  const [carteraActivaId, setCarteraActivaIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar cartera activa desde localStorage al iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCarteraId = localStorage.getItem(CARTERA_ACTIVA_STORAGE_KEY)
      if (savedCarteraId) {
        setCarteraActivaIdState(savedCarteraId)
      }
    }
  }, [])

  // Función para cargar todas las carteras
  const refreshCarteras = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await carterasController.getCarteras()
      if (result.success && result.carteras) {
        setCarteras(result.carteras)
        
        // Si hay una cartera activa guardada, buscarla en la lista
        if (carteraActivaId) {
          const carteraEncontrada = result.carteras.find(c => c._id === carteraActivaId)
          if (carteraEncontrada) {
            setCarteraActivaState(carteraEncontrada)
          } else {
            // Si la cartera guardada no existe, usar la primera disponible o null
            if (result.carteras.length > 0) {
              setCarteraActivaState(result.carteras[0])
              setCarteraActivaIdState(result.carteras[0]._id)
              if (typeof window !== 'undefined') {
                localStorage.setItem(CARTERA_ACTIVA_STORAGE_KEY, result.carteras[0]._id)
              }
            } else {
              setCarteraActivaState(null)
              setCarteraActivaIdState(null)
              if (typeof window !== 'undefined') {
                localStorage.removeItem(CARTERA_ACTIVA_STORAGE_KEY)
              }
            }
          }
        } else if (result.carteras.length > 0) {
          // Si no hay cartera activa guardada, usar la primera disponible
          setCarteraActivaState(result.carteras[0])
          setCarteraActivaIdState(result.carteras[0]._id)
          if (typeof window !== 'undefined') {
            localStorage.setItem(CARTERA_ACTIVA_STORAGE_KEY, result.carteras[0]._id)
          }
        }
      } else {
        setCarteras([])
        setCarteraActivaState(null)
        setCarteraActivaIdState(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(CARTERA_ACTIVA_STORAGE_KEY)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar carteras')
      setCarteras([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar carteras al montar el componente
  useEffect(() => {
    refreshCarteras()
  }, [])

  // Sincronizar cartera activa cuando cambia carteraActivaId
  useEffect(() => {
    if (carteraActivaId) {
      const cartera = carteras.find(c => c._id === carteraActivaId)
      if (cartera) {
        setCarteraActivaState(cartera)
      }
    } else {
      setCarteraActivaState(null)
    }
  }, [carteraActivaId, carteras])

  // Función para establecer cartera activa
  const setCarteraActiva = (cartera: Cartera | null) => {
    setCarteraActivaState(cartera)
    if (cartera) {
      setCarteraActivaIdState(cartera._id)
      if (typeof window !== 'undefined') {
        localStorage.setItem(CARTERA_ACTIVA_STORAGE_KEY, cartera._id)
      }
    } else {
      setCarteraActivaIdState(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CARTERA_ACTIVA_STORAGE_KEY)
      }
    }
  }

  // Función para establecer cartera activa por ID
  const setCarteraActivaId = (id: string | null) => {
    setCarteraActivaIdState(id)
    if (id) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(CARTERA_ACTIVA_STORAGE_KEY, id)
      }
      const cartera = carteras.find(c => c._id === id)
      if (cartera) {
        setCarteraActivaState(cartera)
      }
    } else {
      setCarteraActivaState(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CARTERA_ACTIVA_STORAGE_KEY)
      }
    }
  }

  return (
    <CarteraContext.Provider
      value={{
        carteraActiva,
        carteras,
        setCarteraActiva,
        carteraActivaId,
        setCarteraActivaId,
        refreshCarteras,
        loading,
        error,
      }}
    >
      {children}
    </CarteraContext.Provider>
  )
}

export function useCarteraContext() {
  const context = useContext(CarteraContext)
  if (context === undefined) {
    throw new Error('useCarteraContext debe ser usado dentro de un CarteraProvider')
  }
  return context
}

