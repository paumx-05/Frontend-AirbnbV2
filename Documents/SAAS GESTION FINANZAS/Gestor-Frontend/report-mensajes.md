# Módulo Mensajes: Reporte de Integración

## Resumen

Este documento describe la integración completa del módulo de mensajes con el backend MongoDB, eliminando toda dependencia de datos mock almacenados en localStorage y utilizando únicamente la base de datos real.

**Fecha de integración:** 2025-01-XX  
**Estado:** ✅ Completo  
**Backend:** MongoDB Atlas via API REST  
**Base URL:** `http://localhost:4444`  
**Módulo:** Mensajes (Sistema de notificaciones y mensajería)

---

## Endpoints Utilizados

### 1. GET `/api/mensajes`
- **Método:** GET
- **Autenticación:** Requerida (Bearer token)
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `leido` (opcional): Filtrar por estado de lectura (`true` o `false`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": "507f1f77bcf86cd799439012",
        "remitente": "Sistema",
        "asunto": "Recordatorio de pago",
        "contenido": "Debes pagar 30€ por el gasto compartido...",
        "leido": false,
        "createdAt": "2024-11-15T10:00:00.000Z"
      }
    ]
  }
  ```
- **Códigos de error:** 401 (token inválido), 500 (error servidor)

### 2. GET `/api/mensajes/:id`
- **Método:** GET
- **Autenticación:** Requerida (Bearer token)
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "remitente": "Sistema",
      "asunto": "Recordatorio de pago",
      "contenido": "Debes pagar 30€ por el gasto compartido...",
      "leido": false,
      "createdAt": "2024-11-15T10:00:00.000Z"
    }
  }
  ```
- **Códigos de error:** 401 (token inválido), 404 (mensaje no encontrado), 500 (error servidor)

### 3. POST `/api/mensajes`
- **Método:** POST
- **Autenticación:** Requerida (Bearer token)
- **Headers:** 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "remitente": "Sistema",
    "asunto": "Recordatorio de pago",
    "contenido": "Debes pagar 30€ por el gasto compartido con Juan Pérez",
    "leido": false
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "remitente": "Sistema",
      "asunto": "Recordatorio de pago",
      "contenido": "Debes pagar 30€ por el gasto compartido con Juan Pérez",
      "leido": false,
      "createdAt": "2024-11-15T10:00:00.000Z"
    },
    "message": "Mensaje creado exitosamente"
  }
  ```
- **Códigos de error:** 400 (datos inválidos), 401 (token inválido), 500 (error servidor)

### 4. PUT `/api/mensajes/:id/leido`
- **Método:** PUT
- **Autenticación:** Requerida (Bearer token)
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "remitente": "Sistema",
      "asunto": "Recordatorio de pago",
      "contenido": "Debes pagar 30€ por el gasto compartido...",
      "leido": true,
      "createdAt": "2024-11-15T10:00:00.000Z"
    },
    "message": "Mensaje marcado como leído"
  }
  ```
- **Códigos de error:** 401 (token inválido), 404 (mensaje no encontrado), 500 (error servidor)

### 5. PUT `/api/mensajes/leer-todos`
- **Método:** PUT
- **Autenticación:** Requerida (Bearer token)
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "mensajesActualizados": 5
    },
    "message": "5 mensaje(s) marcado(s) como leído(s)"
  }
  ```
- **Códigos de error:** 401 (token inválido), 500 (error servidor)

### 6. DELETE `/api/mensajes/:id`
- **Método:** DELETE
- **Autenticación:** Requerida (Bearer token)
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Mensaje eliminado exitosamente"
  }
  ```
- **Códigos de error:** 401 (token inválido), 404 (mensaje no encontrado), 500 (error servidor)

### 7. DELETE `/api/mensajes`
- **Método:** DELETE
- **Autenticación:** Requerida (Bearer token)
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "mensajesEliminados": 10
    },
    "message": "10 mensaje(s) eliminado(s) exitosamente"
  }
  ```
- **Códigos de error:** 401 (token inválido), 500 (error servidor)

---

## Cambios en Frontend

### Archivos Creados

1. **`models/mensajes.ts`**
   - Define interfaces TypeScript para mensajes
   - Tipos para requests y responses del backend
   - Tipos de error personalizados

2. **`schemas/mensajes.schema.ts`**
   - Esquemas Zod para validación runtime
   - Validación de requests y responses
   - Tipos TypeScript derivados de schemas

3. **`services/mensajes.service.ts`**
   - Servicio completo para comunicación con backend
   - Funciones para todos los endpoints
   - Manejo de errores y telemetría
   - Validación con Zod antes de enviar requests

### Archivos Modificados

1. **`config/api.ts`**
   - Agregada sección `MENSAJES` en `ENDPOINTS`
   - Configuración de todos los endpoints de mensajes
   - Soporte para query parameters (filtro por `leido`)

2. **`app/dashboard/mensajes/page.tsx`**
   - **Eliminado:** Funciones mock (`getMensajes`, `saveMensajes`) que usaban localStorage
   - **Eliminado:** Dependencia de `getUsuarioActual()` para operaciones
   - **Agregado:** Integración completa con `mensajesService`
   - **Agregado:** Estados de loading y error
   - **Agregado:** Función `adaptarMensaje` para convertir formato backend (`_id`, `createdAt`) a formato UI (`id`, `fecha`)
   - **Agregado:** Manejo de errores con mensajes al usuario
   - **Agregado:** Función para marcar todos los mensajes como leídos
   - **Mejorado:** UI muestra estados de carga y errores apropiadamente

### Archivos Eliminados

- **Funciones mock eliminadas:**
  - `getMensajes(userId?: string)` - Obtenía mensajes de localStorage
  - `saveMensajes(mensajes, userId?)` - Guardaba mensajes en localStorage

---

## Tipos/Validaciones

### Modelos TypeScript (`models/mensajes.ts`)

```typescript
interface Mensaje {
  _id: string
  userId: string
  remitente: string
  asunto: string
  contenido: string
  leido: boolean
  createdAt: string // ISO date string
}

interface CreateMensajeRequest {
  remitente: string
  asunto: string
  contenido: string
  leido?: boolean
}
```

### Schemas Zod (`schemas/mensajes.schema.ts`)

- **`MensajeSchema`**: Valida estructura de mensaje del backend
- **`CreateMensajeRequestSchema`**: Valida request de creación
  - `remitente`: string, mínimo 1 carácter
  - `asunto`: string, mínimo 1 carácter
  - `contenido`: string, mínimo 1 carácter
  - `leido`: boolean opcional, default `false`
- **`MensajesResponseSchema`**: Valida respuesta de lista de mensajes
- **`MensajeResponseSchema`**: Valida respuesta de un mensaje
- **`MarkAllLeidosResponseSchema`**: Valida respuesta de marcar todos como leídos
- **`DeleteMensajeResponseSchema`**: Valida respuesta de eliminación
- **`DeleteAllMensajesResponseSchema`**: Valida respuesta de eliminar todos

### Validación en Servicio

- Todos los requests se validan con Zod antes de enviarse al backend
- Todas las responses se validan con Zod antes de retornarse
- Errores de validación se capturan y se convierten en `MensajeError`

---

## Estados y Errores

### Estados de UI

1. **Loading:** Muestra "Cargando mensajes..." mientras se obtienen datos
2. **Empty:** Muestra mensaje cuando no hay mensajes (filtrados o totales)
3. **Error:** Muestra mensaje de error con botón de reintentar
4. **Success:** Muestra lista de mensajes con funcionalidad completa

### Manejo de Errores

#### Errores de Red
- **Timeout:** Capturado y mostrado como "Error de conexión. Verifica que el servidor esté disponible."
- **Network Error:** Capturado y mostrado con mensaje descriptivo

#### Errores HTTP
- **401 Unauthorized:** 
  - Limpia tokens automáticamente
  - Usuario debe reautenticarse
- **404 Not Found:** 
  - Mensaje específico: "Mensaje no encontrado"
  - Se maneja en operaciones de obtener/actualizar/eliminar por ID
- **400 Bad Request:** 
  - Datos inválidos en request
  - Mensaje del backend se muestra al usuario
- **500 Internal Server Error:** 
  - Error genérico del servidor
  - Mensaje descriptivo al usuario

#### Estrategia de Reintentos
- Botón "Reintentar" disponible en estado de error
- No hay reintentos automáticos (evita loops infinitos)
- Usuario controla cuándo reintentar

### Estados Vacíos

- **Sin mensajes:** Muestra icono y mensaje "No hay mensajes"
- **Sin mensajes no leídos (con filtro):** Muestra "No hay mensajes no leídos"
- **Mensaje seleccionado:** Vista detallada del mensaje con opción de eliminar

---

## Observabilidad

### Telemetría Implementada

1. **Logs de Request (`logRequest`)**
   - Registra: método HTTP, endpoint, duración en ms
   - Formato: `[MENSAJES API] GET /api/mensajes - 245ms`
   - Se ejecuta después de cada request exitoso

2. **Logs de Error (`logError`)**
   - Registra: método HTTP, endpoint, status code, mensaje de error
   - Formato: `[MENSAJES API ERROR] DELETE /api/mensajes/123 - 404: Mensaje no encontrado`
   - Se ejecuta en todos los errores

3. **Logs de Debug (solo desarrollo)**
   - Registra: método, URL completa, headers, body del request
   - Formato: `[MENSAJES API DEBUG] { method, url, headers, body }`
   - Solo activo cuando `NODE_ENV === 'development'`

4. **Logs de Validación**
   - Registra errores de validación Zod
   - Formato: `[MENSAJES VALIDATION ERROR] <zod error details>`
   - Se ejecuta cuando la respuesta del backend no coincide con el schema

### Dónde se Registra

- **Consola del navegador:** Todos los logs
- **No se envía a servicios externos:** Telemetría básica local únicamente
- **No se persiste:** Logs solo en sesión actual

### Métricas Capturadas

- **Latencia:** Tiempo de respuesta de cada request (ms)
- **Status codes:** Códigos HTTP de todas las respuestas
- **Endpoints:** Todos los endpoints llamados
- **Errores:** Tipos y mensajes de todos los errores

---

## Riesgos y Próximos Pasos

### Riesgos Identificados

1. **Paginación:** 
   - **Riesgo:** Si un usuario tiene muchos mensajes, cargar todos puede ser lento
   - **Mitigación actual:** Backend ordena por fecha descendente, se muestran todos
   - **Recomendación:** Implementar paginación si se esperan >100 mensajes por usuario

2. **Rate Limiting:**
   - **Riesgo:** Backend puede tener límites de requests por minuto
   - **Mitigación actual:** No hay reintentos automáticos
   - **Recomendación:** Monitorear errores 429 y ajustar comportamiento

3. **Sincronización:**
   - **Riesgo:** Si el usuario tiene múltiples pestañas, cambios en una no se reflejan en otras
   - **Mitigación actual:** Usuario debe recargar manualmente
   - **Recomendación:** Implementar polling o WebSockets para actualizaciones en tiempo real

4. **Optimistic Updates:**
   - **Riesgo:** UI se actualiza antes de confirmar con backend
   - **Mitigación actual:** No se implementan optimistic updates
   - **Recomendación:** Considerar para mejor UX (marcar como leído, eliminar)

### Próximos Pasos

1. **Mejoras de UX:**
   - [ ] Implementar optimistic updates para operaciones comunes
   - [ ] Agregar animaciones de transición al cargar/eliminar mensajes
   - [ ] Implementar notificaciones toast para acciones exitosas/fallidas

2. **Funcionalidades Adicionales:**
   - [ ] Búsqueda de mensajes por contenido/asunto
   - [ ] Filtros adicionales (por remitente, fecha)
   - [ ] Archivar mensajes (en lugar de eliminar)
   - [ ] Respuestas a mensajes (si se implementa sistema de chat)

3. **Optimizaciones:**
   - [ ] Implementar paginación si se detectan problemas de rendimiento
   - [ ] Cache de mensajes con React Query o SWR
   - [ ] Lazy loading de mensajes antiguos

4. **Testing:**
   - [ ] Tests unitarios para `mensajesService`
   - [ ] Tests de integración para flujos completos
   - [ ] Tests E2E para página de mensajes

5. **Monitoreo:**
   - [ ] Integrar servicio de telemetría externo (Sentry, LogRocket)
   - [ ] Alertas para errores frecuentes
   - [ ] Dashboard de métricas de uso

---

## Checklist de Integración

- [x] Sin usos de mock en código activo (eliminadas funciones de localStorage)
- [x] Contratos tipados y validados (Zod/TS) con opcionalidad correcta
- [x] Estados de UI completos (loading/empty/error/success)
- [x] Errores manejados con mensajes útiles y trazabilidad mínima
- [x] Documentación `report-mensajes.md` generada y clara
- [x] Telemetría mínima habilitada (latencia, status, endpoint)
- [x] Integración completa con backend MongoDB
- [x] Validación de requests y responses con Zod
- [x] Manejo de autenticación (token JWT)
- [x] Adaptadores para convertir formato backend a formato UI
- [x] Funcionalidad de marcar todos como leídos
- [x] Manejo de estados vacíos apropiado

---

## Notas Técnicas

### Adaptación de Datos

El backend usa `_id` y `createdAt`, mientras que la UI original usaba `id` y `fecha`. Se implementó una función `adaptarMensaje` que convierte el formato del backend al formato esperado por la UI, manteniendo compatibilidad con el código existente.

### Autenticación

Todos los endpoints requieren token JWT en el header `Authorization: Bearer <token>`. El servicio obtiene el token automáticamente de `localStorage` usando `getToken()` de `utils/jwt.ts`. Si el token no existe o es inválido (401), se limpian los tokens automáticamente.

### Timeout

Todos los requests tienen un timeout de 10 segundos (configurado en `API_CONFIG.TIMEOUT`). Si se excede, se lanza un error de conexión.

---

**Última actualización:** 2025-01-XX  
**Versión:** 1.0.0

