# Amigos: Reporte de Integración

## Resumen

Este reporte documenta la integración completa del módulo de amigos con el nuevo sistema de solicitudes de amistad del backend. El sistema ahora implementa un flujo completo: buscar usuarios → enviar solicitud → aceptar/rechazar → chatear (solo amigos activos mutuos).

**Alcance:** Integración completa del sistema de solicitudes de amistad, incluyendo:
- Búsqueda de usuarios del sistema
- Envío de solicitudes de amistad
- Visualización y gestión de solicitudes recibidas
- Aceptar/rechazar solicitudes
- Validación de amistad mutua para chat
- Lista de amigos activos

---

## Endpoints

### Base URL
`http://localhost:4444`

### Autenticación
Todos los endpoints requieren token JWT en el header:
```
Authorization: Bearer <token>
```

### Endpoints Utilizados

#### 1. GET `/api/amigos`
**Propósito:** Obtener lista de amigos activos (solo amistades mutuas)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "amigoUserId": "507f1f77bcf86cd799439013",
      "nombre": "Juan Pérez",
      "email": "juan.perez@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "estado": "activo",
      "fechaAmistad": "2024-11-15T10:00:00.000Z",
      "createdAt": "2024-11-15T10:00:00.000Z"
    }
  ]
}
```

**Nota:** Este endpoint solo devuelve amigos con estado 'activo'. Los amigos pendientes o rechazados no aparecen aquí.

**Códigos de error:**
- `401 Unauthorized`: Token inválido o faltante
- `500 Internal Server Error`: Error del servidor

---

#### 2. GET `/api/amigos/usuarios/search?q=<query>` (NUEVO)
**Propósito:** Buscar usuarios del sistema (no solo amigos). Muestra el estado de amistad con cada usuario.

**Query Parameters:**
- `q` (string, requerido): Término de búsqueda (nombre o email)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "nombre": "Juan Pérez",
      "email": "juan.perez@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "estadoAmistad": "activo",
      "esAmigo": true
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "nombre": "María García",
      "email": "maria.garcia@example.com",
      "avatar": null,
      "estadoAmistad": "pendiente",
      "esAmigo": false
    },
    {
      "_id": "507f1f77bcf86cd799439015",
      "nombre": "Carlos López",
      "email": "carlos.lopez@example.com",
      "avatar": null,
      "estadoAmistad": null,
      "esAmigo": false
    }
  ]
}
```

**Códigos de error:**
- `400 Bad Request`: Query vacío o inválido
- `401 Unauthorized`: Token inválido o faltante
- `500 Internal Server Error`: Error del servidor

---

#### 3. POST `/api/amigos/solicitud` (NUEVO)
**Propósito:** Enviar una solicitud de amistad a otro usuario

**Request Body:**
```json
{
  "amigoUserId": "507f1f77bcf86cd799439013"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "amigoUserId": "507f1f77bcf86cd799439013",
    "nombre": "Juan Pérez",
    "email": "juan.perez@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "estado": "pendiente",
    "solicitadoPor": "507f1f77bcf86cd799439012",
    "createdAt": "2024-11-15T10:00:00.000Z"
  },
  "message": "Solicitud de amistad enviada exitosamente"
}
```

**Códigos de error:**
- `400 Bad Request`: ID inválido o intentando enviar solicitud a uno mismo
- `404 Not Found`: Usuario no encontrado
- `409 Conflict`: Ya existe una relación con este usuario
- `401 Unauthorized`: Token inválido o faltante

---

#### 4. GET `/api/amigos/solicitudes` (NUEVO)
**Propósito:** Obtener todas las solicitudes de amistad recibidas que están pendientes

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "solicitante": {
        "_id": "507f1f77bcf86cd799439012",
        "nombre": "Juan Pérez",
        "email": "juan.perez@example.com",
        "avatar": "https://example.com/avatar.jpg"
      },
      "estado": "pendiente",
      "createdAt": "2024-11-15T10:00:00.000Z"
    }
  ]
}
```

**Códigos de error:**
- `401 Unauthorized`: Token inválido o faltante
- `500 Internal Server Error`: Error del servidor

---

#### 5. PUT `/api/amigos/solicitud/:id/aceptar` (NUEVO)
**Propósito:** Aceptar una solicitud de amistad. Actualiza la solicitud a estado 'activo' y crea automáticamente la relación inversa (ambos usuarios se tienen mutuamente como amigos).

**Path Parameters:**
- `id` (string, requerido): ID de la solicitud a aceptar

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "estado": "activo",
    "fechaAmistad": "2024-11-15T10:00:00.000Z"
  },
  "message": "Solicitud de amistad aceptada exitosamente"
}
```

**Códigos de error:**
- `404 Not Found`: Solicitud no encontrada o ya procesada
- `401 Unauthorized`: Token inválido o faltante

---

#### 6. PUT `/api/amigos/solicitud/:id/rechazar` (NUEVO)
**Propósito:** Rechazar una solicitud de amistad. Actualiza la solicitud a estado 'rechazada'.

**Path Parameters:**
- `id` (string, requerido): ID de la solicitud a rechazar

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Solicitud de amistad rechazada"
}
```

**Códigos de error:**
- `404 Not Found`: Solicitud no encontrada o ya procesada
- `401 Unauthorized`: Token inválido o faltante

---

## Cambios en Frontend

### Archivos Modificados

1. **`models/amigos.ts`**
   - Agregado campo `amigoUserId` a interfaz `Amigo`
   - Agregado campo `solicitadoPor` a interfaz `Amigo`
   - Agregado estado `'rechazada'` a tipo `estado`
   - `fechaAmistad` ahora es opcional (solo para amigos activos)
   - Creadas nuevas interfaces: `UsuarioConEstado`, `SolicitudAmistad`
   - Creadas nuevas interfaces de respuesta: `BackendUsuariosConEstadoResponse`, `BackendEnviarSolicitudResponse`, `BackendSolicitudesResponse`, `BackendAceptarSolicitudResponse`, `BackendRechazarSolicitudResponse`

2. **`schemas/amigos.schema.ts`**
   - Actualizado `AmigoSchema` para incluir `amigoUserId` y `solicitadoPor`
   - Agregado estado `'rechazada'` al enum de estados
   - Creados nuevos schemas: `UsuarioConEstadoSchema`, `SolicitudAmistadSchema`, `EnviarSolicitudRequestSchema`
   - Creados nuevos schemas de respuesta: `UsuariosConEstadoResponseSchema`, `EnviarSolicitudResponseSchema`, `SolicitudesResponseSchema`, `AceptarSolicitudResponseSchema`, `RechazarSolicitudResponseSchema`

3. **`config/api.ts`**
   - Agregados nuevos endpoints:
     - `SEARCH_USUARIOS`: Búsqueda de usuarios del sistema
     - `ENVIAR_SOLICITUD`: Enviar solicitud de amistad
     - `GET_SOLICITUDES`: Obtener solicitudes recibidas
     - `ACEPTAR_SOLICITUD`: Aceptar solicitud
     - `RECHAZAR_SOLICITUD`: Rechazar solicitud

4. **`services/amigos.service.ts`**
   - Agregados nuevos métodos:
     - `searchUsuarios()`: Buscar usuarios del sistema
     - `enviarSolicitud()`: Enviar solicitud de amistad
     - `getSolicitudesRecibidas()`: Obtener solicitudes recibidas
     - `aceptarSolicitud()`: Aceptar solicitud
     - `rechazarSolicitud()`: Rechazar solicitud
   - Actualizado `getAmigosByEstado()` para incluir estado `'rechazada'`
   - Actualizado `updateEstadoAmigo()` para incluir estado `'rechazada'`

5. **`lib/amigos.ts`**
   - Actualizada interfaz `Amigo` local para incluir `amigoUserId` y `solicitadoPor`
   - Agregadas nuevas interfaces: `UsuarioConEstado`, `SolicitudAmistad`
   - Agregadas nuevas funciones:
     - `searchUsuarios()`: Buscar usuarios del sistema
     - `enviarSolicitud()`: Enviar solicitud de amistad
     - `getSolicitudesRecibidas()`: Obtener solicitudes recibidas
     - `aceptarSolicitud()`: Aceptar solicitud
     - `rechazarSolicitud()`: Rechazar solicitud
   - Actualizado `getAmigosByEstado()` y `updateEstadoAmigo()` para incluir estado `'rechazada'`

6. **`app/dashboard/amigos/page.tsx`** (REESCRITO COMPLETAMENTE)
   - Implementado sistema de tabs: 'amigos', 'buscar', 'solicitudes'
   - Tab 'amigos': Muestra solo amigos activos con opción de chatear
   - Tab 'buscar': Búsqueda de usuarios del sistema con debounce (500ms)
   - Tab 'solicitudes': Visualización de solicitudes recibidas con opciones de aceptar/rechazar
   - Eliminado formulario de agregar amigo directo (ahora se usa sistema de solicitudes)
   - Validación: Solo amigos activos pueden chatear

7. **`components/AmigoListItem.tsx`**
   - Agregada validación: Solo muestra link de chat si `amigo.estado === 'activo'`
   - Si no puede chatear, muestra contenido sin link (estilo deshabilitado)

8. **`app/dashboard/chat/[amigoId]/page.tsx`**
   - Agregada validación al cargar amigo: Si el estado no es 'activo', redirige a mensajes con alerta
   - Actualizada interfaz `Amigo` para incluir nuevos campos

9. **`app/globals.css`**
   - Agregados estilos para:
     - `.amigos-tabs`: Tabs de navegación
     - `.amigos-tab`: Estilos de tab individual
     - `.amigos-search-container`: Contenedor de búsqueda
     - `.amigo-estado-badge`: Badge de estado de amistad
     - `.estado-activo`, `.estado-pendiente`, `.estado-rechazada`, `.estado-bloqueado`, `.estado-sin-relacion`: Colores de estado
     - `.amigo-list-item-disabled`: Estilo para items deshabilitados
     - `.amigos-error-banner`: Banner de errores
     - `.btn-close`: Botón de cerrar errores

---

## Tipos/Validaciones

### Tipos TypeScript

**Amigo (Backend):**
```typescript
{
  _id: string
  userId: string
  amigoUserId: string
  nombre: string
  email: string
  avatar?: string | null
  estado: 'activo' | 'pendiente' | 'rechazada' | 'bloqueado'
  solicitadoPor?: string
  fechaAmistad?: string
  createdAt?: string
}
```

**UsuarioConEstado:**
```typescript
{
  _id: string
  nombre: string
  email: string
  avatar?: string | null
  estadoAmistad: 'pendiente' | 'activo' | 'rechazada' | 'bloqueado' | null
  esAmigo: boolean
}
```

**SolicitudAmistad:**
```typescript
{
  _id: string
  solicitante: {
    _id: string
    nombre: string
    email: string
    avatar?: string | null
  }
  estado: 'pendiente'
  createdAt: string
}
```

### Validaciones Zod

- `AmigoSchema`: Valida estructura completa del amigo con nuevos campos
- `UsuarioConEstadoSchema`: Valida usuario con estado de amistad
- `SolicitudAmistadSchema`: Valida solicitud de amistad
- `EnviarSolicitudRequestSchema`: Valida request de enviar solicitud (requiere `amigoUserId`)

---

## Estados y Errores

### Estados de UI

1. **Loading States:**
   - `loadingAmigos`: Cargando lista de amigos
   - `loadingBusqueda`: Buscando usuarios
   - `loadingSolicitudes`: Cargando solicitudes recibidas

2. **Empty States:**
   - Sin amigos activos
   - Sin resultados de búsqueda
   - Sin solicitudes recibidas
   - Búsqueda vacía

3. **Error States:**
   - Error al cargar amigos
   - Error al buscar usuarios
   - Error al cargar solicitudes
   - Error al enviar solicitud
   - Error al aceptar/rechazar solicitud

### Manejo de Errores

- **400 Bad Request**: Validación de datos (mostrar mensaje específico)
- **404 Not Found**: Recurso no encontrado (redirigir o mostrar mensaje)
- **409 Conflict**: Ya existe relación (mostrar mensaje informativo)
- **401 Unauthorized**: Token inválido (limpiar tokens y redirigir a login)
- **500 Internal Server Error**: Error del servidor (mostrar mensaje genérico)

### Validaciones de Negocio

1. **Solo amigos activos pueden chatear:**
   - Validación en `AmigoListItem`: Solo muestra link si `estado === 'activo'`
   - Validación en `app/dashboard/chat/[amigoId]/page.tsx`: Redirige si estado no es 'activo'

2. **No se puede enviar solicitud a uno mismo:**
   - Validado por el backend (retorna 400)

3. **No se puede enviar solicitud duplicada:**
   - Validado por el backend (retorna 409)

---

## Observabilidad

### Logs de Desarrollo

- `[AMIGOS API]`: Logs de requests exitosos con duración
- `[AMIGOS API ERROR]`: Logs de errores con status code
- `[AMIGOS API DEBUG]`: Logs detallados de requests (solo en desarrollo)
- `[AMIGOS VALIDATION ERROR]`: Logs de errores de validación Zod

### Telemetría

- **Latencia**: Se registra la duración de cada request
- **Status Codes**: Se registran todos los códigos de estado HTTP
- **Endpoints**: Se registran todos los endpoints llamados
- **Errores**: Se registran todos los errores con detalles

### Logs Específicos

- Búsqueda de usuarios: Se registra query y resultados
- Envío de solicitudes: Se registra `amigoUserId` y resultado
- Aceptar/rechazar: Se registra `solicitudId` y resultado
- Validación de chat: Se registra intento de chatear con amigo no activo

---

## Riesgos y Next Steps

### Riesgos Identificados

1. **Rendimiento de búsqueda:**
   - La búsqueda de usuarios puede ser lenta con muchos usuarios
   - **Mitigación**: Debounce de 500ms implementado

2. **Sincronización de estado:**
   - Al aceptar una solicitud, se deben recargar tanto solicitudes como amigos
   - **Mitigación**: Se recargan ambos después de aceptar

3. **Validación de amistad mutua:**
   - El frontend valida que el estado sea 'activo', pero el backend también debe validar
   - **Mitigación**: Validación en múltiples capas (frontend y backend)

4. **Estados inconsistentes:**
   - Si un usuario elimina un amigo mientras el otro está en el chat
   - **Mitigación**: Validación al cargar el chat

### Próximos Pasos

1. **Optimizaciones:**
   - Implementar paginación en búsqueda de usuarios
   - Implementar cache de solicitudes
   - Optimizar recarga de datos después de acciones

2. **Mejoras de UX:**
   - Notificaciones en tiempo real para nuevas solicitudes
   - Indicador visual de solicitudes pendientes en el header
   - Confirmación antes de rechazar solicitud

3. **Funcionalidades Adicionales:**
   - Ver solicitudes enviadas (no solo recibidas)
   - Cancelar solicitud enviada
   - Bloquear/desbloquear usuarios
   - Historial de solicitudes

4. **Testing:**
   - Tests unitarios para funciones de amigos
   - Tests de integración para flujo completo
   - Tests E2E para solicitudes de amistad

---

## Checklist de Integración

- [x] Sin usos de mock en código activo (solo backend MongoDB)
- [x] Contratos tipados y validados (Zod/TS) con opcionalidad correcta
- [x] Estados de UI completos (loading/empty/error/success)
- [x] Errores manejados con mensajes útiles y trazabilidad mínima
- [x] Documentación `report-amigos-integracion.md` generada y clara
- [x] Telemetría mínima habilitada (latencia, status, endpoint)
- [x] Validación de amistad mutua para chat
- [x] Sistema de solicitudes completamente implementado
- [x] Búsqueda de usuarios del sistema implementada
- [x] Gestión de solicitudes (aceptar/rechazar) implementada

---

**Última actualización**: Sistema completo de solicitudes de amistad implementado según documentación del backend

