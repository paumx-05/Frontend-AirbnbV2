'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import { favoritesService } from '@/lib/api/favorites';
import type { Favorite } from '@/schemas/favorites';

// Interfaz del contexto de favoritos
interface FavoritesContextType {
  favorites: Favorite[];
  isLoading: boolean;
  error: string | null;
  addToFavorites: (propertyId: string) => Promise<void>;
  removeFromFavorites: (propertyId: string) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
  refreshFavorites: () => Promise<void>;
  getTotalFavorites: () => number;
}

// Crear el contexto
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites debe usarse dentro de FavoritesProvider');
  }
  return context;
};

// Props del provider
interface FavoritesProviderProps {
  children: ReactNode;
}

/**
 * Provider del contexto de favoritos
 * Usa la API real del backend cuando el usuario está autenticado
 * Fallback a localStorage solo si el endpoint no está disponible o el usuario no está autenticado
 */
export const FavoritesProvider = ({ children }: FavoritesProviderProps) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  
  // Referencias estables para evitar bucles infinitos
  const loadFavoritesRef = useRef<() => Promise<void>>();
  const syncLocalStorageToAPIRef = useRef<() => Promise<void>>();

  /**
   * Cargar favoritos desde la API o localStorage
   */
  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isAuthenticated) {
        // Usuario autenticado: intentar cargar desde API PRIMERO (MongoDB)
        try {
          const favoritesData = await favoritesService.getFavorites();

          if (favoritesData && favoritesData.length > 0) {
            // Si hay favoritos en la API, usarlos (son la fuente de verdad)
            setFavorites(favoritesData);
            console.log('✅ [Favorites] Favoritos cargados desde API (MongoDB):', favoritesData.length, 'favoritos');
          } else {
            // Si la API está vacía, intentar cargar desde localStorage como fallback
            const savedFavorites = localStorage.getItem('favorites');
            if (savedFavorites) {
              try {
                const parsedFavorites = JSON.parse(savedFavorites);
                if (Array.isArray(parsedFavorites) && parsedFavorites.length > 0) {
                  setFavorites(parsedFavorites);
                  console.log('⚠️ [Favorites] API vacía, usando favoritos de localStorage:', parsedFavorites.length);
                  // Intentar sincronizar estos favoritos a la API
                  console.log('🔄 [Favorites] Programando sincronización localStorage → API...');
                } else {
                  setFavorites([]);
                }
              } catch (parseError) {
                console.error('❌ [Favorites] Error parseando localStorage:', parseError);
                setFavorites([]);
              }
            } else {
              setFavorites([]);
              console.log('✅ [Favorites] API vacía y localStorage vacío');
            }
          }
        } catch (apiError) {
          console.warn('⚠️ [Favorites] Error cargando desde API, intentando localStorage:', apiError);

          // Si falla la API, intentar localStorage como fallback
          const savedFavorites = localStorage.getItem('favorites');
          if (savedFavorites) {
            try {
              const parsedFavorites = JSON.parse(savedFavorites);
              setFavorites(Array.isArray(parsedFavorites) ? parsedFavorites : []);
              console.log('✅ [Favorites] Favoritos cargados desde localStorage (fallback)');
            } catch (parseError) {
              console.error('❌ [Favorites] Error parseando localStorage:', parseError);
              setFavorites([]);
            }
          } else {
            setFavorites([]);
          }

          // Solo mostrar error si NO es un 404 (endpoint no implementado es esperado)
          const is404Error =
            apiError instanceof Error &&
            (apiError.message.includes('404') ||
              apiError.message.includes('Endpoint no encontrado') ||
              apiError.message.includes('not found'));

          if (!is404Error) {
            setError('No se pudo cargar los favoritos desde el servidor');
          }
        }
      } else {
        // Usuario no autenticado: usar localStorage
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
          try {
            const parsedFavorites = JSON.parse(savedFavorites);
            setFavorites(Array.isArray(parsedFavorites) ? parsedFavorites : []);
            console.log('✅ [Favorites] Favoritos cargados desde localStorage (no autenticado):', parsedFavorites.length, 'favoritos');
          } catch (parseError) {
            console.error('❌ [Favorites] Error parseando localStorage:', parseError);
            setFavorites([]);
          }
        } else {
          setFavorites([]);
          console.log('✅ [Favorites] No hay favoritos en localStorage');
        }
      }
    } catch (error) {
      console.error('💥 [Favorites] Error cargando favoritos:', error);
      setError('Error al cargar los favoritos');
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);
  
  // Actualizar referencia cuando loadFavorites cambie
  useEffect(() => {
    loadFavoritesRef.current = loadFavorites;
  }, [loadFavorites]);

  // Cargar favoritos al inicializar o cuando cambie la autenticación
  useEffect(() => {
    console.log('🔄 [Favorites] Efecto loadFavorites ejecutado, isAuthenticated:', isAuthenticated);

    // Si está autenticado, esperar un poco para asegurar que el token esté disponible
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        loadFavoritesRef.current?.();
      }, 500); // 500ms para asegurar que el token esté completamente disponible
      return () => clearTimeout(timer);
    } else {
      // Si no está autenticado, cargar inmediatamente desde localStorage
      loadFavoritesRef.current?.();
    }
  }, [isAuthenticated]); // Solo isAuthenticated como dependencia para evitar bucles infinitos

  /**
   * Sincronizar favoritos de localStorage con la API cuando el usuario se autentica
   * Hace merge inteligente: si hay favoritos en localStorage que no están en la API, los agrega
   */
  const syncLocalStorageToAPI = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // Obtener favoritos de localStorage
      const savedFavorites = localStorage.getItem('favorites');
      if (!savedFavorites) {
        console.log('🔄 [Favorites] No hay favoritos en localStorage para sincronizar');
        return;
      }

      const localFavorites = JSON.parse(savedFavorites);
      if (!Array.isArray(localFavorites) || localFavorites.length === 0) {
        console.log('🔄 [Favorites] localStorage está vacío o inválido');
        return;
      }

      console.log('🔄 [Favorites] Favoritos en localStorage:', localFavorites.length);

      // Obtener favoritos actuales de la API
      let apiFavorites: Favorite[] = [];
      try {
        apiFavorites = await favoritesService.getFavorites();
        console.log('🔄 [Favorites] Favoritos en API:', apiFavorites.length);
      } catch (error) {
        console.warn('⚠️ [Favorites] Error obteniendo favoritos de API, solo usando localStorage:', error);
        return;
      }

      // Crear un Set de propertyIds que ya están en la API
      const apiPropertyIds = new Set(apiFavorites.map(fav => fav.propertyId));

      // Encontrar favoritos en localStorage que NO están en la API
      const favoritesToMigrate = localFavorites.filter(
        (fav: Favorite) => fav.propertyId && !apiPropertyIds.has(fav.propertyId)
      );

      if (favoritesToMigrate.length > 0) {
        console.log('🔄 [Favorites] Migrando', favoritesToMigrate.length, 'favoritos de localStorage a API...');

        for (const favorite of favoritesToMigrate) {
          try {
            if (favorite.propertyId) {
              await favoritesService.addToFavorites(favorite.propertyId);
              console.log('✅ [Favorites] Favorito migrado:', favorite.propertyId);
              // Pequeño delay para evitar sobrecarga
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            console.error('❌ [Favorites] Error migrando favorito:', favorite.propertyId, error);
          }
        }

        // Recargar favoritos desde la API después de migrar
        const updatedFavorites = await favoritesService.getFavorites();
        setFavorites(updatedFavorites);
        console.log('✅ [Favorites] Migración completada:', updatedFavorites.length, 'favoritos en total');
      } else {
        console.log('✅ [Favorites] Todos los favoritos de localStorage ya están en la API');
        // Actualizar el estado con los favoritos de la API
        setFavorites(apiFavorites);
      }

      // NO limpiar localStorage inmediatamente, mantenerlo como backup
      // Se limpiará solo cuando se confirme que la sincronización fue exitosa
    } catch (error) {
      console.error('💥 [Favorites] Error sincronizando localStorage:', error);
    }
  }, [isAuthenticated]);
  
  // Actualizar referencia cuando syncLocalStorageToAPI cambie
  useEffect(() => {
    syncLocalStorageToAPIRef.current = syncLocalStorageToAPI;
  }, [syncLocalStorageToAPI]);

  // Sincronizar cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated) {
      // Esperar más tiempo para asegurar que el token está completamente disponible
      // y que loadFavorites ya se ejecutó
      const timer = setTimeout(() => {
        console.log('🔄 [Favorites] Iniciando sincronización localStorage → API');
        syncLocalStorageToAPIRef.current?.();
      }, 1000); // 1 segundo para asegurar que todo esté listo
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]); // Solo isAuthenticated como dependencia para evitar bucles infinitos

  /**
   * Guardar en localStorage como backup (SIEMPRE, para persistencia después de logout)
   * Esto asegura que los favoritos persistan incluso después de cerrar sesión
   */
  useEffect(() => {
    // Guardar SIEMPRE en localStorage como backup, incluso cuando estamos autenticados
    // Esto permite que los favoritos persistan después de logout
    try {
      if (favorites.length > 0) {
        localStorage.setItem('favorites', JSON.stringify(favorites));
        console.log('💾 [Favorites] Favoritos guardados en localStorage (backup):', favorites.length);
      }
    } catch (error) {
      console.error('❌ [Favorites] Error guardando en localStorage:', error);
    }
  }, [favorites]);

  /**
   * Agregar propiedad a favoritos
   */
  const addToFavorites = useCallback(
    async (propertyId: string): Promise<void> => {
      setError(null);

      try {
        if (isAuthenticated) {
          // Usuario autenticado: usar API
          try {
            const newFavorite = await favoritesService.addToFavorites(propertyId);

            setFavorites((prevFavorites) => {
              // Verificar si ya existe
              const existingIndex = prevFavorites.findIndex(
                (fav) => fav.propertyId === propertyId
              );

              if (existingIndex >= 0) {
                // Si existe, actualizar el favorito existente
                const updatedFavorites = [...prevFavorites];
                updatedFavorites[existingIndex] = newFavorite;
                return updatedFavorites;
              } else {
                // Si no existe, agregar nuevo favorito
                return [...prevFavorites, newFavorite];
              }
            });

            console.log('✅ [Favorites] Favorito agregado (API)');
            
            // Recargar favoritos desde la API para asegurar sincronización
            // Esto confirma que se guardó en MongoDB
            try {
              await new Promise(resolve => setTimeout(resolve, 300)); // Pequeño delay para que MongoDB procese
              const refreshedFavorites = await favoritesService.getFavorites();
              setFavorites(refreshedFavorites);
              console.log('✅ [Favorites] Favoritos refrescados desde API (confirmado en MongoDB):', refreshedFavorites.length, 'favoritos');
            } catch (refreshError) {
              console.warn('⚠️ [Favorites] Error refrescando favoritos:', refreshError);
              console.warn('⚠️ [Favorites] Esto puede indicar que no se guardó en MongoDB');
            }
          } catch (apiError) {
            // Si falla la API, guardar en localStorage como fallback temporal
            console.warn('⚠️ [Favorites] Error en API, usando localStorage como fallback:', apiError);
            console.warn('⚠️ [Favorites] Error details:', apiError instanceof Error ? apiError.message : String(apiError));

            const fallbackFavorite: Favorite = {
              id: `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              propertyId,
              userId: 'local-user',
              createdAt: new Date().toISOString(),
            };

            setFavorites((prevFavorites) => {
              const existingIndex = prevFavorites.findIndex((fav) => fav.propertyId === propertyId);

              if (existingIndex >= 0) {
                return prevFavorites;
              } else {
                return [...prevFavorites, fallbackFavorite];
              }
            });

            // Intentar guardar en la API de nuevo en segundo plano
            setTimeout(async () => {
              try {
                await favoritesService.addToFavorites(propertyId);
                await loadFavorites();
                console.log('✅ [Favorites] Favorito sincronizado con API después del fallback');
              } catch (retryError) {
                console.warn('⚠️ [Favorites] Reintento falló, favorito permanece en localStorage');
              }
            }, 2000);

            // Solo mostrar error si NO es un 404 (endpoint no implementado es esperado)
            const is404Error =
              apiError instanceof Error &&
              (apiError.message.includes('404') ||
                apiError.message.includes('Endpoint no encontrado') ||
                apiError.message.includes('not found'));

            if (!is404Error) {
              setError('No se pudo agregar a favoritos en el servidor, se guardó localmente. Se intentará sincronizar automáticamente.');
              // Limpiar error después de 5 segundos
              setTimeout(() => setError(null), 5000);
            }
          }
        } else {
          // Usuario no autenticado: usar localStorage
          const fallbackFavorite: Favorite = {
            id: `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            propertyId,
            userId: 'local-user',
            createdAt: new Date().toISOString(),
          };

          setFavorites((prevFavorites) => {
            const existingIndex = prevFavorites.findIndex((fav) => fav.propertyId === propertyId);

            if (existingIndex >= 0) {
              return prevFavorites;
            } else {
              return [...prevFavorites, fallbackFavorite];
            }
          });

          console.log('✅ [Favorites] Favorito agregado (localStorage)');
        }
      } catch (error) {
        console.error('💥 [Favorites] Error agregando favorito:', error);
        setError('Error al agregar a favoritos');
        throw error;
      }
    },
    [isAuthenticated, loadFavorites]
  );

  /**
   * Eliminar propiedad de favoritos
   */
  const removeFromFavorites = useCallback(
    async (propertyId: string): Promise<void> => {
      setError(null);

      try {
        if (isAuthenticated) {
          // Usuario autenticado: usar API
          try {
            await favoritesService.removeFromFavorites(propertyId);
            setFavorites((prevFavorites) =>
              prevFavorites.filter((fav) => fav.propertyId !== propertyId)
            );
            console.log('✅ [Favorites] Favorito eliminado (API)');
          } catch (apiError) {
            // Si falla la API, eliminar de localStorage como fallback
            console.warn('⚠️ [Favorites] Error en API, usando localStorage:', apiError);
            setFavorites((prevFavorites) =>
              prevFavorites.filter((fav) => fav.propertyId !== propertyId)
            );

            // Solo mostrar error si NO es un 404 (endpoint no implementado es esperado)
            const is404Error =
              apiError instanceof Error &&
              (apiError.message.includes('404') ||
                apiError.message.includes('Endpoint no encontrado') ||
                apiError.message.includes('not found'));

            if (!is404Error) {
              setError('No se pudo eliminar de favoritos en el servidor');
            }
          }
        } else {
          // Usuario no autenticado: usar localStorage
          setFavorites((prevFavorites) =>
            prevFavorites.filter((fav) => fav.propertyId !== propertyId)
          );
          console.log('✅ [Favorites] Favorito eliminado (localStorage)');
        }
      } catch (error) {
        console.error('💥 [Favorites] Error eliminando favorito:', error);
        setError('Error al eliminar de favoritos');
        throw error;
      }
    },
    [isAuthenticated]
  );

  /**
   * Verificar si una propiedad está en favoritos
   */
  const isFavorite = useCallback(
    (propertyId: string): boolean => {
      return favorites.some((fav) => fav.propertyId === propertyId);
    },
    [favorites]
  );

  /**
   * Recargar favoritos desde la API
   */
  const refreshFavorites = useCallback(async () => {
    if (isAuthenticated) {
      await loadFavorites();
    }
  }, [loadFavorites, isAuthenticated]);

  /**
   * Obtener número total de favoritos
   */
  const getTotalFavorites = (): number => {
    return favorites.length;
  };

  // Valor del contexto
  const value: FavoritesContextType = {
    favorites,
    isLoading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    refreshFavorites,
    getTotalFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

