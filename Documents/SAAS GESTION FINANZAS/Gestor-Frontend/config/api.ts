// Configuración de la API
// Centraliza la URL base del backend y configuración de endpoints

export const API_CONFIG = {
  // URL base del backend - debe ser configurada via variable de entorno
  // Según documentación: http://localhost:4444
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4444',
  
  // Endpoints de autenticación
  // Formato: /api/auth/<endpoint>
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      ME: '/api/auth/me', // Obtener usuario actual
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
    },
    USERS: {
      PROFILE: '/api/users/profile', // Obtener perfil
      UPDATE_PROFILE: '/api/users/profile', // Actualizar perfil
    },
    GASTOS: {
      GET_BY_MES: (mes: string) => `/api/gastos/${mes}`, // Obtener gastos por mes
      CREATE: '/api/gastos', // Crear gasto
      UPDATE: (id: string) => `/api/gastos/${id}`, // Actualizar gasto
      DELETE: (id: string) => `/api/gastos/${id}`, // Eliminar gasto
      GET_TOTAL: (mes: string) => `/api/gastos/${mes}/total`, // Obtener total de gastos por mes
      GET_BY_CATEGORIA: (mes: string, categoria: string) => `/api/gastos/${mes}/categoria/${encodeURIComponent(categoria)}`, // Obtener gastos por categoría
    },
    AMIGOS: {
      GET_ALL: '/api/amigos', // Obtener todos los amigos (solo activos)
      GET_BY_ID: (id: string) => `/api/amigos/${id}`, // Obtener amigo por ID
      SEARCH: (query: string) => `/api/amigos/search?q=${encodeURIComponent(query)}`, // Buscar entre tus amigos
      SEARCH_USUARIOS: (query: string) => `/api/amigos/usuarios/search?q=${encodeURIComponent(query)}`, // Buscar usuarios del sistema (NUEVO)
      GET_BY_ESTADO: (estado: string) => `/api/amigos/estado/${estado}`, // Obtener amigos por estado
      CREATE: '/api/amigos', // Crear amigo (DEPRECADO - usar ENVIAR_SOLICITUD)
      ENVIAR_SOLICITUD: '/api/amigos/solicitud', // Enviar solicitud de amistad (NUEVO)
      GET_SOLICITUDES: '/api/amigos/solicitudes', // Obtener solicitudes recibidas (NUEVO)
      ACEPTAR_SOLICITUD: (id: string) => `/api/amigos/solicitud/${id}/aceptar`, // Aceptar solicitud (NUEVO)
      RECHAZAR_SOLICITUD: (id: string) => `/api/amigos/solicitud/${id}/rechazar`, // Rechazar solicitud (NUEVO)
      UPDATE: (id: string) => `/api/amigos/${id}`, // Actualizar amigo
      UPDATE_ESTADO: (id: string) => `/api/amigos/${id}/estado`, // Actualizar estado de amigo
      DELETE: (id: string) => `/api/amigos/${id}`, // Eliminar amigo
    },
    MENSAJES: {
      GET_ALL: (leido?: boolean) => leido !== undefined ? `/api/mensajes?leido=${leido}` : '/api/mensajes', // Obtener todos los mensajes (opcionalmente filtrado por leído)
      GET_BY_ID: (id: string) => `/api/mensajes/${id}`, // Obtener mensaje por ID
      CREATE: '/api/mensajes', // Crear mensaje
      MARK_AS_LEIDO: (id: string) => `/api/mensajes/${id}/leido`, // Marcar mensaje como leído
      MARK_ALL_AS_LEIDOS: '/api/mensajes/leer-todos', // Marcar todos los mensajes como leídos
      DELETE: (id: string) => `/api/mensajes/${id}`, // Eliminar mensaje
      DELETE_ALL: '/api/mensajes', // Eliminar todos los mensajes
    },
    CHAT: {
      GET_CHATS: '/api/chat/amigos', // Obtener lista de chats con amigos
      GET_MENSAJES: (amigoId: string) => `/api/chat/${amigoId}/mensajes`, // Obtener mensajes de un chat
      SEND_MENSAJE: (amigoId: string) => `/api/chat/${amigoId}/mensajes`, // Enviar mensaje en un chat
      MARK_AS_LEIDO: (amigoId: string) => `/api/chat/${amigoId}/leer`, // Marcar mensajes de un chat como leídos
    }
  },
  
  // Timeout para requests (ms)
  TIMEOUT: 10000,
}

