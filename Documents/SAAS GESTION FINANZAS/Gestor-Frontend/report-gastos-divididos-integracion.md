# Gastos Divididos: Reporte de Integración

## Resumen

Este reporte documenta la corrección de la integración de gastos divididos con el sistema de mensajes automáticos del backend. El problema principal era que se estaba usando el ID incorrecto (`id` del registro Amigo en lugar de `amigoUserId` del usuario amigo) al crear gastos divididos, lo que impedía que el backend creara correctamente los mensajes automáticos de recordatorio de pago.

**Alcance:** Corrección del uso de `amigoId` vs `amigoUserId` en la creación de gastos divididos, eliminación de código mock/localStorage, y validación de que solo amigos activos puedan recibir mensajes.

---

## Problema Identificado

### Error Original

Al crear un gasto dividido, se estaba enviando:
```typescript
{
  amigoId: amigoData.id  // ❌ INCORRECTO: ID del registro Amigo
}
```

Cuando debería ser:
```typescript
{
  amigoId: amigoData.amigoUserId  // ✅ CORRECTO: ID del usuario amigo
}
```

### Consecuencias

- El gasto se guardaba correctamente en la base de datos
- Pero el backend no podía crear los mensajes automáticos porque no encontraba al usuario destinatario
- Los mensajes de recordatorio de pago no aparecían en el chat del amigo

---

## Endpoints

### Base URL
`http://localhost:4444`

### Autenticación
Todos los endpoints requieren token JWT en el header:
```
Authorization: Bearer <token>
```

### Endpoint Utilizado

#### POST `/api/gastos`

**Propósito:** Crear un nuevo gasto, opcionalmente dividido entre amigos

**Request Body:**
```json
{
  "descripcion": "Alquiler",
  "monto": 300.00,
  "fecha": "2024-01-15",
  "categoria": "Vivienda",
  "mes": "enero",
  "dividido": [
    {
      "amigoId": "507f1f77bcf86cd799439013",  // ⚠️ IMPORTANTE: amigoUserId, NO _id del registro
      "amigoNombre": "Juan Pérez",
      "montoDividido": 300.00,
      "pagado": false
    }
  ]
}
```

**⚠️ IMPORTANTE - Campo `amigoId`:**
- El `amigoId` en el array `dividido` debe ser el **`amigoUserId`** (ID del usuario amigo)
- **NO** debe ser el `_id` del registro de Amigo
- Se obtiene del campo `amigoUserId` del objeto Amigo

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "descripcion": "Alquiler",
    "monto": 300.00,
    "fecha": "2024-01-15T00:00:00.000Z",
    "categoria": "Vivienda",
    "mes": "enero",
    "dividido": [
      {
        "amigoId": "507f1f77bcf86cd799439013",
        "amigoNombre": "Juan Pérez",
        "montoDividido": 300.00,
        "pagado": false
      }
    ],
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "message": "Gasto creado exitosamente"
}
```

**Códigos de error:**
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: Token inválido o faltante
- `404 Not Found`: Usuario amigo no encontrado
- `500 Internal Server Error`: Error del servidor

---

## Mensajes Automáticos del Sistema

### ¿Cuándo se crean?

Los mensajes automáticos se crean cuando:
1. Se crea un gasto con división (`POST /api/gastos`)
2. Se actualiza un gasto con división (`PUT /api/gastos/:id`)
3. El amigo tiene `pagado: false`
4. El amigo tiene estado `'activo'` en la relación de amistad

### Estructura del Mensaje

```typescript
interface MensajeSistema {
  _id: string
  remitenteId: string // ID del usuario que creó el gasto
  destinatarioId: string // ID del usuario amigo que debe pagar (amigoUserId)
  amigoId: string // ID del registro Amigo del remitente
  contenido: string // "Recordatorio de pago: Debes pagar 300.00€ por el gasto \"Alquiler\""
  esSistema: true // Siempre true para estos mensajes
  leido: false // Siempre false al crearse
  createdAt: string // ISO date string
}
```

### Contenido del Mensaje

El contenido del mensaje sigue este formato:
```
Recordatorio de pago: Debes pagar {montoDividido}€ por el gasto "{descripcion}"
```

**Ejemplo:**
```
Recordatorio de pago: Debes pagar 300.00€ por el gasto "Alquiler"
```

---

## Cambios en Frontend

### Archivos Modificados

1. **`app/dashboard/gastos/[mes]/page.tsx`**
   - **Línea 51**: Actualizado tipo de estado `amigos` para incluir `amigoUserId` y `estado`
   - **Líneas 83-104**: Actualizado `loadAmigos()` para incluir `amigoUserId` y `estado` en el mapeo
   - **Líneas 98-100**: Eliminada función `crearMensajeDeuda()` (el backend maneja esto automáticamente)
   - **Líneas 281-307**: Corregido uso de `amigoData.id` → `amigoData.amigoUserId` en modo división iguales
   - **Líneas 314-342**: Corregido uso de `amigoData.id` → `amigoData.amigoUserId` en modo división personalizada
   - **Líneas 288-292, 321-325**: Agregada validación para omitir amigos no activos
   - **Líneas 336-360**: Corregido mapeo al editar gasto (de `amigoUserId` a `id` del registro Amigo para la UI)

### Cambios Específicos

#### 1. Corrección del uso de `amigoId`

**Antes (INCORRECTO):**
```typescript
return {
  amigoId: amigoData.id,  // ❌ ID del registro Amigo
  amigoNombre: amigoData.nombre,
  montoDividido: montoAmigo,
  pagado: pagado
}
```

**Después (CORRECTO):**
```typescript
return {
  amigoId: amigoData.amigoUserId,  // ✅ ID del usuario amigo
  amigoNombre: amigoData.nombre,
  montoDividido: montoAmigo,
  pagado: pagado
}
```

#### 2. Eliminación de función mock

**Eliminado:**
- Función `crearMensajeDeuda()` que usaba `localStorage` para crear mensajes mock
- Todas las llamadas a `crearMensajeDeuda()` en el código

**Razón:**
- El backend ahora crea automáticamente los mensajes cuando se crea/actualiza un gasto dividido
- No es necesario crear mensajes manualmente desde el frontend

#### 3. Validación de amigos activos

**Agregado:**
```typescript
// Validar que el amigo esté activo (solo amigos activos pueden recibir mensajes)
if (amigoData.estado !== 'activo') {
  console.warn(`⚠️ Amigo ${amigoData.nombre} no está activo (estado: ${amigoData.estado}). Se omitirá de la división.`)
  return null
}
```

**Razón:**
- Solo amigos con estado `'activo'` pueden recibir mensajes automáticos
- Se valida antes de incluir al amigo en la división

#### 4. Corrección del mapeo al editar

**Antes (INCORRECTO):**
```typescript
const amigosIds = gasto.dividido.map(item => item.amigoId)  // ❌ Usa amigoUserId directamente
```

**Después (CORRECTO):**
```typescript
gasto.dividido.forEach(item => {
  // Buscar el amigo por amigoUserId para obtener su id (del registro Amigo)
  const amigo = amigos.find(a => a.amigoUserId === item.amigoId)
  if (amigo) {
    amigosIds.push(amigo.id)  // ✅ Usar id del registro Amigo para la UI
    pagados[amigo.id] = item.pagado
    montos[amigo.id] = item.montoDividido.toString()
  }
})
```

**Razón:**
- El backend devuelve `amigoId` como `amigoUserId` en el array `dividido`
- La UI necesita el `id` del registro Amigo para seleccionar amigos
- Se mapea de `amigoUserId` a `id` del registro Amigo

---

## Tipos/Validaciones

### Tipos TypeScript

**CreateGastoRequest:**
```typescript
{
  descripcion: string
  monto: number
  fecha: string
  categoria: string
  mes?: string
  dividido?: Array<{
    amigoId: string  // ⚠️ Debe ser amigoUserId (ID del usuario amigo)
    amigoNombre: string
    montoDividido: number
    pagado?: boolean  // Default: false
  }>
}
```

### Validaciones Zod

- `CreateGastoRequestSchema`: Valida estructura del request
- `DivididoSchema`: Valida array de división con `amigoId` como string requerido

### Validaciones de Negocio

1. **Solo amigos activos:**
   - Se valida que `amigo.estado === 'activo'` antes de incluir en división
   - Se omite automáticamente si no está activo

2. **Monto válido:**
   - `montoDividido >= 0`
   - En modo personalizado, la suma no puede exceder el monto total

3. **Amigo existe:**
   - Se valida que el amigo exista antes de incluirlo
   - Se omite si no se encuentra

---

## Estados y Errores

### Estados de UI

1. **Loading States:**
   - `loading`: Creando/actualizando gasto
   - `loadingGastos`: Cargando lista de gastos
   - `loadingAmigos`: Cargando lista de amigos

2. **Empty States:**
   - Sin amigos activos para dividir
   - Sin gastos en el mes

3. **Error States:**
   - Error al crear gasto
   - Error al cargar amigos
   - Amigo no activo (se omite con warning)

### Manejo de Errores

- **400 Bad Request**: Validación de datos (mostrar mensaje específico)
- **404 Not Found**: Usuario amigo no encontrado (mostrar mensaje)
- **401 Unauthorized**: Token inválido (limpiar tokens y redirigir a login)
- **500 Internal Server Error**: Error del servidor (mostrar mensaje genérico)

### Validaciones de Negocio

1. **Amigo no activo:**
   - Se omite automáticamente de la división
   - Se muestra warning en consola
   - No se crea mensaje automático

2. **Monto excedido:**
   - En modo personalizado, si la suma excede el monto total, se muestra alerta
   - Se previene el envío del formulario

---

## Observabilidad

### Logs de Desarrollo

- `✅ Cargados X amigos activos para división de gastos`: Al cargar amigos
- `⚠️ Amigo X no está activo (estado: Y). Se omitirá de la división.`: Al omitir amigo no activo
- `⚠️ No se encontró amigo con amigoUserId: X al editar gasto`: Al editar gasto con amigo no encontrado

### Telemetría

- **Validaciones**: Se registran warnings cuando se omiten amigos no activos
- **Mapeo**: Se registran warnings cuando no se encuentra un amigo al editar

---

## Flujo Completo Corregido

### 1. Usuario Crea Gasto Dividido

```
Usuario (admin@example.com)
  ↓
Crea gasto: "Alquiler" - 600€
  ↓
Divide con: juan.perez@example.com (300€ cada uno)
  ↓
pagado: false
  ↓
amigoId: amigo.amigoUserId  // ✅ CORRECTO
```

### 2. Frontend Envía al Backend

```
POST /api/gastos
{
  "descripcion": "Alquiler",
  "monto": 300.00,
  "dividido": [{
    "amigoId": "507f1f77bcf86cd799439013",  // ✅ amigoUserId
    "amigoNombre": "Juan Pérez",
    "montoDividido": 300.00,
    "pagado": false
  }]
}
```

### 3. Backend Procesa

```
Backend recibe POST /api/gastos
  ↓
Guarda gasto con dividido[]
  ↓
Para cada item en dividido:
  - Si pagado === false
  - Si amigo.estado === 'activo'
  - Busca usuario por amigoUserId (amigoId)
  - Crea MensajeChat con:
    * remitenteId: admin@example.com
    * destinatarioId: juan.perez@example.com (amigoUserId)
    * contenido: "Recordatorio de pago: Debes pagar 300.00€ por el gasto \"Alquiler\""
    * esSistema: true
```

### 4. Frontend Muestra

```
juan.perez@example.com abre chat
  ↓
GET /api/chat/:amigoId/mensajes
  ↓
Recibe mensajes incluyendo el del sistema
  ↓
Muestra mensaje con estilo especial (esSistema: true)
```

---

## Riesgos y Next Steps

### Riesgos Identificados

1. **Amigos no encontrados al editar:**
   - Si un amigo fue eliminado después de crear el gasto, no se encontrará al editar
   - **Mitigación**: Se omite con warning, el gasto se puede editar sin ese amigo

2. **Sincronización de estado:**
   - Si un amigo cambia de estado después de cargar la lista, puede intentar dividir con él
   - **Mitigación**: Validación en tiempo de creación

3. **Mensajes duplicados:**
   - Si se actualiza un gasto múltiples veces, pueden crearse mensajes duplicados
   - **Mitigación**: El backend maneja esto actualizando mensajes existentes

### Próximos Pasos

1. **Optimizaciones:**
   - Cachear lista de amigos para evitar recargas innecesarias
   - Validar estado de amigos antes de mostrar en selector

2. **Mejoras de UX:**
   - Mostrar indicador visual cuando se crea un mensaje automático
   - Notificación cuando el amigo recibe el mensaje
   - Botón para marcar como pagado directamente desde el mensaje

3. **Funcionalidades Adicionales:**
   - Ver historial de pagos divididos
   - Estadísticas de gastos divididos
   - Recordatorios automáticos periódicos

4. **Testing:**
   - Tests unitarios para validación de `amigoUserId`
   - Tests de integración para creación de gastos divididos
   - Tests E2E para flujo completo

---

## Checklist de Integración

- [x] Corregido uso de `amigoId` vs `amigoUserId` en creación de gastos
- [x] Eliminada función mock `crearMensajeDeuda()`
- [x] Validación de amigos activos antes de incluir en división
- [x] Corrección del mapeo al editar gastos divididos
- [x] Actualizado tipo de estado `amigos` para incluir `amigoUserId`
- [x] Comentarios explicativos agregados
- [x] Logs de depuración agregados
- [x] Documentación `report-gastos-divididos-integracion.md` generada

---

## Notas Importantes

1. **`amigoId` vs `amigoUserId`**:
   - `amigo._id` o `amigo.id`: ID del registro Amigo (usar para obtener mensajes del chat)
   - `amigo.amigoUserId`: ID del usuario amigo (usar en el array `dividido`)

2. **Solo amigos activos**:
   - Los mensajes solo se crean para amigos con estado `'activo'`
   - Se valida antes de permitir división

3. **Mensajes del sistema**:
   - Siempre tienen `esSistema: true`
   - Siempre tienen `leido: false` al crearse
   - El contenido sigue un formato específico

4. **Backend automático**:
   - El backend crea los mensajes automáticamente
   - No es necesario crear mensajes manualmente desde el frontend
   - Se crean cuando `pagado === false` y `estado === 'activo'`

---

**Última actualización**: Corrección de integración de gastos divididos con mensajes automáticos

