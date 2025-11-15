/**
 * Utilidad para construir URLs de avatar usando el proxy
 * Esto evita problemas de CORS al cargar imágenes desde el backend
 */

/**
 * Convierte una URL de avatar del backend a URL del proxy de Next.js
 * @param avatarUrl - URL del avatar (relativa, localhost:5000, o externa)
 * @param options - Opciones para cache busting
 * @returns URL del proxy o URL original si es externa
 */
export function getAvatarUrl(
  avatarUrl: string | null | undefined,
  options?: {
    bustCache?: boolean;
    timestamp?: number;
  }
): string | undefined {
  if (!avatarUrl) {
    return undefined;
  }
  
  // Construir URL base
  let url: string;
  
  // Si ya es una URL del proxy, devolverla tal cual (pero agregar cache busting si se requiere)
  if (avatarUrl.includes('/api/proxy/avatar')) {
    url = avatarUrl;
  } else if (avatarUrl.startsWith('/')) {
    // Si es una URL relativa (empieza con /), usar el proxy
    url = `/api/proxy/avatar?path=${encodeURIComponent(avatarUrl)}`;
  } else if (avatarUrl.startsWith('http://localhost:5000/') || avatarUrl.startsWith('http://127.0.0.1:5000/')) {
    // Si es URL del backend local, convertir a proxy
    const path = avatarUrl.replace(/^https?:\/\/[^/]+/, '');
    url = `/api/proxy/avatar?path=${encodeURIComponent(path)}`;
  } else if (!avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
    // Si no tiene protocolo, usar proxy
    const path = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
    url = `/api/proxy/avatar?path=${encodeURIComponent(path)}`;
  } else {
    // Si es una URL externa completa (https://...), usar directamente
    url = avatarUrl;
  }
  
  // Agregar cache busting si se requiere
  if (options?.bustCache && url.includes('/api/proxy/avatar')) {
    const separator = url.includes('?') ? '&' : '?';
    const timestamp = options.timestamp || Date.now();
    url = `${url}${separator}_t=${timestamp}`;
  }
  
  return url;
}

