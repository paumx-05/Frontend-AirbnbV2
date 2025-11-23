'use client'

// Context para gestionar la configuración global de la aplicación
// Incluye divisa, idioma, tema y suscripción

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Tipos
export type Divisa = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'MXN' | 'ARS' | 'COP' | 'CLP'
export type Idioma = 'es' | 'en' | 'pt' | 'fr' | 'de'
export type Tema = 'dark' | 'light' | 'auto'

export interface Suscripcion {
  tipo: 'free' | 'premium' | 'enterprise'
  fechaInicio?: string
  fechaVencimiento?: string
  activa: boolean
}

export interface ConfiguracionUsuario {
  divisa: Divisa
  idioma: Idioma
  tema: Tema
  suscripcion: Suscripcion
}

// Configuración por defecto
const configuracionPorDefecto: ConfiguracionUsuario = {
  divisa: 'USD',
  idioma: 'es',
  tema: 'dark',
  suscripcion: {
    tipo: 'free',
    activa: true,
  },
}

// Símbolos de divisas
export const simbolosDivisa: Record<Divisa, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  MXN: '$',
  ARS: '$',
  COP: '$',
  CLP: '$',
}

// Context
interface ConfiguracionContextType {
  config: ConfiguracionUsuario
  setDivisa: (divisa: Divisa) => void
  setIdioma: (idioma: Idioma) => void
  setTema: (tema: Tema) => void
  setSuscripcion: (suscripcion: Suscripcion) => void
  actualizarConfiguracion: (config: Partial<ConfiguracionUsuario>) => void
  getSimboloDivisa: () => string
}

const ConfiguracionContext = createContext<ConfiguracionContextType | undefined>(undefined)

const STORAGE_KEY = 'configuracionUsuario'

export function ConfiguracionProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfiguracionUsuario>(configuracionPorDefecto)
  const [inicializado, setInicializado] = useState(false)

  // Cargar configuración al montar
  useEffect(() => {
    cargarConfiguracion()
  }, [])

  // Aplicar tema cuando cambia
  useEffect(() => {
    if (inicializado) {
      aplicarTema(config.tema)
    }
  }, [config.tema, inicializado])

  // Cargar configuración desde localStorage
  const cargarConfiguracion = () => {
    try {
      if (typeof window !== 'undefined') {
        const configGuardada = localStorage.getItem(STORAGE_KEY)
        if (configGuardada) {
          const configParseada = JSON.parse(configGuardada)
          setConfig({ ...configuracionPorDefecto, ...configParseada })
        }
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err)
    } finally {
      setInicializado(true)
    }
  }

  // Guardar configuración en localStorage
  const guardarConfiguracion = (nuevaConfig: ConfiguracionUsuario) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaConfig))
        setConfig(nuevaConfig)
      }
    } catch (err) {
      console.error('Error al guardar configuración:', err)
    }
  }

  // Aplicar tema
  const aplicarTema = (tema: Tema) => {
    if (typeof window === 'undefined') return

    if (tema === 'auto') {
      const preferenciaSistema = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', preferenciaSistema ? 'dark' : 'light')
    } else {
      document.documentElement.setAttribute('data-theme', tema)
    }
  }

  // Setters
  const setDivisa = (divisa: Divisa) => {
    const nuevaConfig = { ...config, divisa }
    guardarConfiguracion(nuevaConfig)
  }

  const setIdioma = (idioma: Idioma) => {
    const nuevaConfig = { ...config, idioma }
    guardarConfiguracion(nuevaConfig)
  }

  const setTema = (tema: Tema) => {
    const nuevaConfig = { ...config, tema }
    guardarConfiguracion(nuevaConfig)
  }

  const setSuscripcion = (suscripcion: Suscripcion) => {
    const nuevaConfig = { ...config, suscripcion }
    guardarConfiguracion(nuevaConfig)
  }

  const actualizarConfiguracion = (configParcial: Partial<ConfiguracionUsuario>) => {
    const nuevaConfig = { ...config, ...configParcial }
    guardarConfiguracion(nuevaConfig)
  }

  const getSimboloDivisa = () => {
    return simbolosDivisa[config.divisa] || '$'
  }

  return (
    <ConfiguracionContext.Provider
      value={{
        config,
        setDivisa,
        setIdioma,
        setTema,
        setSuscripcion,
        actualizarConfiguracion,
        getSimboloDivisa,
      }}
    >
      {children}
    </ConfiguracionContext.Provider>
  )
}

// Hook para usar el contexto
export function useConfiguracion() {
  const context = useContext(ConfiguracionContext)
  if (context === undefined) {
    throw new Error('useConfiguracion debe usarse dentro de ConfiguracionProvider')
  }
  return context
}

