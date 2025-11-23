'use client'

// Página de Opciones/Configuración
// Gestiona la configuración de la aplicación: divisa, idioma, apariencia y suscripción

import { useState } from 'react'
import { useConfiguracion, type Divisa, type Idioma, type Tema } from '@/contexts/ConfiguracionContext'

// Datos de divisas
const divisas = [
  { codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: '$', bandera: '🇺🇸' },
  { codigo: 'EUR', nombre: 'Euro', simbolo: '€', bandera: '🇪🇺' },
  { codigo: 'GBP', nombre: 'Libra Esterlina', simbolo: '£', bandera: '🇬🇧' },
  { codigo: 'JPY', nombre: 'Yen Japonés', simbolo: '¥', bandera: '🇯🇵' },
  { codigo: 'CAD', nombre: 'Dólar Canadiense', simbolo: 'C$', bandera: '🇨🇦' },
  { codigo: 'AUD', nombre: 'Dólar Australiano', simbolo: 'A$', bandera: '🇦🇺' },
  { codigo: 'CHF', nombre: 'Franco Suizo', simbolo: 'CHF', bandera: '🇨🇭' },
  { codigo: 'CNY', nombre: 'Yuan Chino', simbolo: '¥', bandera: '🇨🇳' },
  { codigo: 'MXN', nombre: 'Peso Mexicano', simbolo: '$', bandera: '🇲🇽' },
  { codigo: 'ARS', nombre: 'Peso Argentino', simbolo: '$', bandera: '🇦🇷' },
  { codigo: 'COP', nombre: 'Peso Colombiano', simbolo: '$', bandera: '🇨🇴' },
  { codigo: 'CLP', nombre: 'Peso Chileno', simbolo: '$', bandera: '🇨🇱' },
]

// Datos de idiomas
const idiomas = [
  { codigo: 'es', nombre: 'Español', bandera: '🇪🇸' },
  { codigo: 'en', nombre: 'English', bandera: '🇺🇸' },
  { codigo: 'pt', nombre: 'Português', bandera: '🇧🇷' },
  { codigo: 'fr', nombre: 'Français', bandera: '🇫🇷' },
  { codigo: 'de', nombre: 'Deutsch', bandera: '🇩🇪' },
]

// Datos de temas
const temas = [
  { 
    id: 'dark', 
    nombre: 'Oscuro', 
    icono: '🌙',
    descripcion: 'Tema oscuro para mejor visualización nocturna'
  },
  { 
    id: 'light', 
    nombre: 'Claro', 
    icono: '☀️',
    descripcion: 'Tema claro para ambientes luminosos'
  },
  { 
    id: 'auto', 
    nombre: 'Automático', 
    icono: '🌓',
    descripcion: 'Se adapta automáticamente a tu sistema'
  },
]

// Datos de planes de suscripción
const planes = [
  {
    id: 'free',
    nombre: 'Gratuito',
    precio: 0,
    periodo: 'mes',
    caracteristicas: [
      'Hasta 3 carteras',
      'Gastos e ingresos ilimitados',
      'Estadísticas básicas',
      'Soporte por email',
    ],
    limitaciones: [
      'Sin exportación de datos',
      'Sin gráficos avanzados',
    ]
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precio: 9.99,
    periodo: 'mes',
    caracteristicas: [
      'Carteras ilimitadas',
      'Exportación a Excel/PDF',
      'Estadísticas avanzadas',
      'Gráficos personalizados',
      'Soporte prioritario',
      'Sin anuncios',
    ],
    destacado: true,
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    precio: 29.99,
    periodo: 'mes',
    caracteristicas: [
      'Todo de Premium',
      'Múltiples usuarios',
      'API de integración',
      'Backup automático',
      'Soporte 24/7',
      'Asesoría personalizada',
    ],
  },
]

export default function OpcionesPage() {
  // Context de configuración
  const { config, setDivisa, setIdioma, setTema, setSuscripcion } = useConfiguracion()
  
  // Estado local
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Cambiar divisa
  const cambiarDivisa = (divisa: Divisa) => {
    setDivisa(divisa)
    mostrarExito('Divisa actualizada exitosamente')
  }

  // Cambiar idioma
  const cambiarIdioma = (idioma: Idioma) => {
    setIdioma(idioma)
    mostrarExito('Idioma actualizado exitosamente')
  }

  // Cambiar tema
  const cambiarTema = (tema: Tema) => {
    setTema(tema)
    mostrarExito('Tema actualizado exitosamente')
  }

  // Actualizar suscripción
  const actualizarSuscripcion = async (tipoPlan: 'free' | 'premium' | 'enterprise') => {
    setLoading(true)
    setError(null)

    try {
      // Aquí se haría la llamada a la API de pago
      // Por ahora simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 1500))

      setSuscripcion({
        tipo: tipoPlan,
        fechaInicio: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        activa: true,
      })
      
      mostrarExito(`Plan ${tipoPlan} activado exitosamente`)
    } catch (err: any) {
      mostrarError('Error al actualizar la suscripción')
    } finally {
      setLoading(false)
    }
  }

  // Cancelar suscripción
  const cancelarSuscripcion = async () => {
    const confirmacion = window.confirm(
      '¿Estás seguro de que deseas cancelar tu suscripción?\n\n' +
      'Perderás acceso a las funciones premium al finalizar el período actual.'
    )

    if (!confirmacion) return

    setLoading(true)
    try {
      // Aquí se haría la llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuscripcion({
        ...config.suscripcion,
        activa: false,
      })
      
      mostrarExito('Suscripción cancelada. Tendrás acceso hasta el final del período.')
    } catch (err) {
      mostrarError('Error al cancelar la suscripción')
    } finally {
      setLoading(false)
    }
  }

  // Helpers para mensajes
  const mostrarExito = (mensaje: string) => {
    setSuccessMessage(mensaje)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const mostrarError = (mensaje: string) => {
    setError(mensaje)
    setTimeout(() => setError(null), 3000)
  }

  const divisaActual = divisas.find(d => d.codigo === config.divisa)
  const idiomaActual = idiomas.find(i => i.codigo === config.idioma)
  const temaActual = temas.find(t => t.id === config.tema)
  const planActual = planes.find(p => p.id === config.suscripcion.tipo)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⚙️ Opciones y Configuración</h1>
        <p className="page-subtitle">Personaliza tu experiencia en la aplicación</p>
      </div>

      {/* Mensajes de éxito/error */}
      {successMessage && (
        <div className="alert alert-success">
          ✅ {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      <div className="opciones-container">
        {/* Sección: Divisa */}
        <section className="opciones-section">
          <div className="opciones-section-header">
            <h2 className="opciones-section-title">
              💱 Divisa
            </h2>
            <p className="opciones-section-description">
              Selecciona la divisa principal para mostrar tus finanzas
            </p>
          </div>

          <div className="opciones-section-content">
            <div className="divisa-actual-card">
              <div className="divisa-info">
                <span className="divisa-bandera">{divisaActual?.bandera}</span>
                <div>
                  <div className="divisa-nombre">{divisaActual?.nombre}</div>
                  <div className="divisa-codigo">{divisaActual?.codigo} ({divisaActual?.simbolo})</div>
                </div>
              </div>
            </div>

            <div className="divisas-grid">
              {divisas.map((divisa) => (
                <button
                  key={divisa.codigo}
                  className={`divisa-card ${config.divisa === divisa.codigo ? 'selected' : ''}`}
                  onClick={() => cambiarDivisa(divisa.codigo as Divisa)}
                >
                  <span className="divisa-card-bandera">{divisa.bandera}</span>
                  <div className="divisa-card-info">
                    <div className="divisa-card-nombre">{divisa.codigo}</div>
                    <div className="divisa-card-simbolo">{divisa.simbolo}</div>
                  </div>
                  {config.divisa === divisa.codigo && (
                    <div className="divisa-card-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Sección: Idioma */}
        <section className="opciones-section">
          <div className="opciones-section-header">
            <h2 className="opciones-section-title">
              🌐 Idioma
            </h2>
            <p className="opciones-section-description">
              Cambia el idioma de la interfaz de usuario
            </p>
          </div>

          <div className="opciones-section-content">
            <div className="idioma-actual-card">
              <div className="idioma-info">
                <span className="idioma-bandera">{idiomaActual?.bandera}</span>
                <div>
                  <div className="idioma-nombre">{idiomaActual?.nombre}</div>
                  <div className="idioma-codigo">{idiomaActual?.codigo.toUpperCase()}</div>
                </div>
              </div>
            </div>

            <div className="idiomas-list">
              {idiomas.map((idioma) => (
                <button
                  key={idioma.codigo}
                  className={`idioma-item ${config.idioma === idioma.codigo ? 'selected' : ''}`}
                  onClick={() => cambiarIdioma(idioma.codigo as Idioma)}
                >
                  <span className="idioma-item-bandera">{idioma.bandera}</span>
                  <span className="idioma-item-nombre">{idioma.nombre}</span>
                  {config.idioma === idioma.codigo && (
                    <span className="idioma-item-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Sección: Apariencia */}
        <section className="opciones-section">
          <div className="opciones-section-header">
            <h2 className="opciones-section-title">
              🎨 Apariencia
            </h2>
            <p className="opciones-section-description">
              Personaliza el tema visual de la aplicación
            </p>
          </div>

          <div className="opciones-section-content">
            <div className="tema-actual-card">
              <div className="tema-info">
                <span className="tema-icono">{temaActual?.icono}</span>
                <div>
                  <div className="tema-nombre">{temaActual?.nombre}</div>
                  <div className="tema-descripcion">{temaActual?.descripcion}</div>
                </div>
              </div>
            </div>

            <div className="temas-grid">
              {temas.map((tema) => (
                <button
                  key={tema.id}
                  className={`tema-card ${config.tema === tema.id ? 'selected' : ''}`}
                  onClick={() => cambiarTema(tema.id as Tema)}
                >
                  <div className="tema-card-icon">{tema.icono}</div>
                  <div className="tema-card-nombre">{tema.nombre}</div>
                  <div className="tema-card-descripcion">{tema.descripcion}</div>
                  {config.tema === tema.id && (
                    <div className="tema-card-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Sección: Gestionar Suscripción */}
        <section className="opciones-section">
          <div className="opciones-section-header">
            <h2 className="opciones-section-title">
              👑 Gestionar Suscripción
            </h2>
            <p className="opciones-section-description">
              Administra tu plan y accede a funciones premium
            </p>
          </div>

          <div className="opciones-section-content">
            {/* Plan actual */}
            <div className="plan-actual-card">
              <div className="plan-actual-header">
                <div>
                  <h3 className="plan-actual-nombre">
                    {planActual?.nombre}
                    {planActual?.id !== 'free' && <span className="plan-badge">Activo</span>}
                  </h3>
                  {config.suscripcion.fechaVencimiento && (
                    <p className="plan-actual-vencimiento">
                      Vence el {new Date(config.suscripcion.fechaVencimiento).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
                {planActual?.id !== 'free' && (
                  <div className="plan-actual-precio">
                    <span className="precio-valor">${planActual?.precio}</span>
                    <span className="precio-periodo">/{planActual?.periodo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Planes disponibles */}
            <div className="planes-grid">
              {planes.map((plan) => {
                const esActual = plan.id === config.suscripcion.tipo
                
                return (
                  <div
                    key={plan.id}
                    className={`plan-card ${esActual ? 'actual' : ''} ${plan.destacado ? 'destacado' : ''}`}
                  >
                    {plan.destacado && (
                      <div className="plan-destacado-badge">Más Popular</div>
                    )}
                    
                    <div className="plan-card-header">
                      <h3 className="plan-card-nombre">{plan.nombre}</h3>
                      <div className="plan-card-precio">
                        {plan.precio === 0 ? (
                          <span className="precio-gratis">Gratis</span>
                        ) : (
                          <>
                            <span className="precio-valor">${plan.precio}</span>
                            <span className="precio-periodo">/{plan.periodo}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ul className="plan-caracteristicas">
                      {plan.caracteristicas.map((caracteristica, index) => (
                        <li key={index} className="plan-caracteristica">
                          <span className="caracteristica-icon">✓</span>
                          {caracteristica}
                        </li>
                      ))}
                      {plan.limitaciones?.map((limitacion, index) => (
                        <li key={`lim-${index}`} className="plan-limitacion">
                          <span className="limitacion-icon">✕</span>
                          {limitacion}
                        </li>
                      ))}
                    </ul>

                    {esActual ? (
                      <button
                        className="btn btn-plan btn-plan-actual"
                        disabled
                      >
                        Plan Actual
                      </button>
                    ) : (
                      <button
                        className={`btn btn-plan ${plan.destacado ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => actualizarSuscripcion(plan.id as any)}
                        disabled={loading}
                      >
                        {loading ? 'Procesando...' : plan.precio === 0 ? 'Cambiar a Gratis' : 'Actualizar Plan'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Botón de cancelar suscripción */}
            {config.suscripcion.tipo !== 'free' && config.suscripcion.activa && (
              <div className="cancelar-suscripcion-section">
                <button
                  className="btn btn-danger-outline"
                  onClick={cancelarSuscripcion}
                  disabled={loading}
                >
                  Cancelar Suscripción
                </button>
                <p className="cancelar-info">
                  Mantendrás acceso a tu plan actual hasta el final del período de facturación
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

