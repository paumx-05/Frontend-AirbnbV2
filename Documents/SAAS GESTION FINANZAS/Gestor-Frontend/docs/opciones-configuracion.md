# Página de Opciones y Configuración

## Descripción
La página de **Opciones** permite a los usuarios personalizar su experiencia en la aplicación de gestión financiera. Incluye cuatro secciones principales:

1. **Divisa** 💱
2. **Idioma** 🌐
3. **Apariencia** 🎨
4. **Gestionar Suscripción** 👑

---

## Características Implementadas

### 1. Sección de Divisa
**Ruta**: `/dashboard/opciones`

**Funcionalidad**:
- Permite seleccionar la divisa principal para mostrar las finanzas
- **12 divisas disponibles**:
  - USD (Dólar Estadounidense) $
  - EUR (Euro) €
  - GBP (Libra Esterlina) £
  - JPY (Yen Japonés) ¥
  - CAD (Dólar Canadiense) C$
  - AUD (Dólar Australiano) A$
  - CHF (Franco Suizo) CHF
  - CNY (Yuan Chino) ¥
  - MXN (Peso Mexicano) $
  - ARS (Peso Argentino) $
  - COP (Peso Colombiano) $
  - CLP (Peso Chileno) $

**Interfaz**:
- Tarjeta destacada mostrando la divisa actual
- Grid de botones con banderas y símbolos de cada divisa
- Indicador visual de selección
- Diseño responsive

---

### 2. Sección de Idioma
**Funcionalidad**:
- Cambia el idioma de la interfaz de usuario
- **5 idiomas disponibles**:
  - Español 🇪🇸
  - English 🇺🇸
  - Português 🇧🇷
  - Français 🇫🇷
  - Deutsch 🇩🇪

**Interfaz**:
- Tarjeta destacada mostrando el idioma actual
- Lista vertical de opciones de idioma
- Banderas para identificación visual rápida
- Indicador de selección

**Nota**: La implementación actual guarda la preferencia de idioma. Para implementar traducciones completas, se recomienda integrar con una librería como `next-intl` o `react-i18next`.

---

### 3. Sección de Apariencia (Tema)
**Funcionalidad**:
- Personaliza el tema visual de la aplicación
- **3 opciones de tema**:
  1. **Oscuro** 🌙 - Tema oscuro para mejor visualización nocturna
  2. **Claro** ☀️ - Tema claro para ambientes luminosos
  3. **Automático** 🌓 - Se adapta automáticamente a la preferencia del sistema

**Interfaz**:
- Tarjeta destacada mostrando el tema actual
- Grid de tarjetas para cada opción de tema
- Iconos descriptivos
- Descripciones detalladas
- Aplicación inmediata del tema al seleccionar

**Implementación Técnica**:
- Usa el atributo `data-theme` en el elemento HTML root
- Detecta la preferencia del sistema para el modo automático
- Persiste la selección en localStorage

---

### 4. Sección de Gestionar Suscripción
**Funcionalidad**:
- Administra el plan de suscripción del usuario
- **3 planes disponibles**:

#### Plan Gratuito (Free)
- Precio: **Gratis**
- Características:
  - ✓ Hasta 3 carteras
  - ✓ Gastos e ingresos ilimitados
  - ✓ Estadísticas básicas
  - ✓ Soporte por email
- Limitaciones:
  - ✕ Sin exportación de datos
  - ✕ Sin gráficos avanzados

#### Plan Premium ⭐ (Más Popular)
- Precio: **$9.99/mes**
- Características:
  - ✓ Carteras ilimitadas
  - ✓ Exportación a Excel/PDF
  - ✓ Estadísticas avanzadas
  - ✓ Gráficos personalizados
  - ✓ Soporte prioritario
  - ✓ Sin anuncios

#### Plan Enterprise
- Precio: **$29.99/mes**
- Características:
  - ✓ Todo de Premium
  - ✓ Múltiples usuarios
  - ✓ API de integración
  - ✓ Backup automático
  - ✓ Soporte 24/7
  - ✓ Asesoría personalizada

**Interfaz**:
- Tarjeta destacada mostrando el plan actual y fecha de vencimiento
- Grid de tarjetas para cada plan disponible
- Badges especiales (Más Popular, Plan Actual)
- Botones de acción para actualizar o cancelar
- Confirmación antes de cancelar suscripción

**Nota**: La integración con sistema de pagos (Stripe, PayPal, etc.) debe implementarse en producción.

---

## Arquitectura Técnica

### Context API - ConfiguracionContext
**Archivo**: `contexts/ConfiguracionContext.tsx`

**Propósito**: Gestionar el estado global de la configuración del usuario

**Funciones Principales**:
```typescript
- setDivisa(divisa: Divisa)
- setIdioma(idioma: Idioma)
- setTema(tema: Tema)
- setSuscripcion(suscripcion: Suscripcion)
- actualizarConfiguracion(config: Partial<ConfiguracionUsuario>)
- getSimboloDivisa(): string
```

**Persistencia**:
- Los datos se guardan en `localStorage`
- Clave de almacenamiento: `configuracionUsuario`
- Carga automática al iniciar la aplicación

**Integración**:
- Envuelto en el `DashboardLayout`
- Accesible desde cualquier componente del dashboard mediante el hook `useConfiguracion()`

---

## Archivos Creados/Modificados

### Nuevos Archivos
1. `app/dashboard/opciones/page.tsx` - Página principal de opciones
2. `contexts/ConfiguracionContext.tsx` - Context para gestionar configuración global
3. `docs/opciones-configuracion.md` - Esta documentación

### Archivos Modificados
1. `app/globals.css` - Estilos para la página de opciones (~700 líneas de CSS)
2. `components/Sidebar.tsx` - Añadido enlace a Opciones en el menú
3. `app/dashboard/layout.tsx` - Envuelto con ConfiguracionProvider

---

## Estilos CSS
**Ubicación**: `app/globals.css` (líneas 8113+)

**Clases Principales**:
- `.opciones-container` - Contenedor principal
- `.opciones-section` - Cada sección de configuración
- `.divisas-grid`, `.idiomas-list`, `.temas-grid`, `.planes-grid` - Layouts para opciones
- `.divisa-card`, `.idioma-item`, `.tema-card`, `.plan-card` - Tarjetas individuales
- Estados: `.selected`, `.actual`, `.destacado`

**Responsive**:
- Breakpoint: 768px
- Grid adaptativos que cambian a columnas únicas en móviles
- Padding reducido en pantallas pequeñas

---

## Cómo Usar

### Para Usuarios
1. Navega a **Opciones** desde el sidebar (icono ⚙️)
2. Selecciona tu divisa preferida
3. Cambia el idioma de la interfaz
4. Personaliza el tema visual
5. Administra tu plan de suscripción

### Para Desarrolladores

#### Usar la configuración en otros componentes
```tsx
import { useConfiguracion } from '@/contexts/ConfiguracionContext'

function MiComponente() {
  const { config, getSimboloDivisa } = useConfiguracion()
  
  return (
    <div>
      <p>Divisa actual: {config.divisa}</p>
      <p>Símbolo: {getSimboloDivisa()}</p>
      <p>Tema: {config.tema}</p>
    </div>
  )
}
```

#### Cambiar configuración programáticamente
```tsx
import { useConfiguracion } from '@/contexts/ConfiguracionContext'

function MiComponente() {
  const { setDivisa, setTema } = useConfiguracion()
  
  const cambiarAEuros = () => {
    setDivisa('EUR')
  }
  
  const activarModoOscuro = () => {
    setTema('dark')
  }
  
  return (
    <>
      <button onClick={cambiarAEuros}>Cambiar a Euros</button>
      <button onClick={activarModoOscuro}>Modo Oscuro</button>
    </>
  )
}
```

---

## Próximas Mejoras

### Corto Plazo
- [ ] Integrar sistema de traducciones (i18n)
- [ ] Implementar conversión de divisas en tiempo real
- [ ] Añadir más temas personalizables
- [ ] Implementar modo claro completo

### Mediano Plazo
- [ ] Integrar pasarela de pago (Stripe/PayPal)
- [ ] Sistema de facturación
- [ ] Gestión de múltiples usuarios (plan Enterprise)
- [ ] Exportación de configuración

### Largo Plazo
- [ ] Personalización avanzada de colores
- [ ] Temas personalizados por el usuario
- [ ] Sincronización en la nube
- [ ] Configuración por cartera

---

## Consideraciones de UX

1. **Feedback Inmediato**: Los cambios se aplican instantáneamente con mensajes de confirmación
2. **Indicadores Visuales**: Checkmarks y badges para mostrar selección actual
3. **Confirmaciones**: Operaciones críticas (como cancelar suscripción) requieren confirmación
4. **Responsive**: Totalmente adaptado a dispositivos móviles
5. **Accesibilidad**: Títulos descriptivos en botones y elementos interactivos

---

## Testing

### Casos de Prueba Recomendados
1. ✓ Cambiar divisa y verificar que se persiste en localStorage
2. ✓ Cambiar tema y verificar aplicación en DOM
3. ✓ Modo automático detecta preferencia del sistema
4. ✓ Actualizar plan de suscripción
5. ✓ Cancelar suscripción con confirmación
6. ✓ Responsive en diferentes tamaños de pantalla
7. ✓ Mensajes de éxito/error se muestran y ocultan

---

## Notas Técnicas

- **TypeScript**: Tipado completo en todo el código
- **Client Components**: Usa 'use client' por interactividad
- **localStorage**: Persistencia en el navegador (considerar API en producción)
- **Context API**: Patrón de estado global nativo de React
- **CSS Modular**: Estilos con nomenclatura clara y consistente

---

## Soporte

Para preguntas o problemas relacionados con la página de Opciones:
1. Revisar esta documentación
2. Verificar la consola del navegador para errores
3. Revisar el estado de localStorage: `configuracionUsuario`
4. Consultar el código fuente en `app/dashboard/opciones/page.tsx`

