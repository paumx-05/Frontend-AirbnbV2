'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { propertyService, type Property } from '@/lib/api/properties';

// Interfaz para los datos de búsqueda
interface SearchData {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

// Interfaz para los filtros
interface SearchFilters {
  propertyType: 'entire' | 'private' | 'shared' | '';
  minPrice: number;
  maxPrice: number;
  amenities: string[];
  minRating: number;
  instantBook: boolean;
}

// Interfaz para el contexto
interface SearchContextType {
  // Datos de búsqueda
  searchData: SearchData;
  setSearchData: (data: SearchData) => void;
  
  // Filtros
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  
  // Propiedades filtradas
  filteredProperties: AirbnbProperty[];
  
  // Estados de UI
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  
  // Funciones
  performSearch: () => void;
  clearFilters: () => void;
}

// Crear el contexto
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch debe ser usado dentro de SearchProvider');
  }
  return context;
};

// Provider del contexto
export const SearchProvider = ({ children }: { children: ReactNode }) => {
  // Estados para datos de búsqueda
  const [searchData, setSearchData] = useState<SearchData>({
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 1
  });

  // Estados para filtros
  const [filters, setFilters] = useState<SearchFilters>({
    propertyType: '',
    minPrice: 0,
    maxPrice: 1000,
    amenities: [],
    minRating: 0,
    instantBook: false
  });

  // Estados de propiedades y búsqueda
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar propiedades al inicializar
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setIsLoading(true);
        const properties = await propertyService.getAllProperties();
        setAllProperties(properties);
        console.log('✅ [SearchContext] Propiedades cargadas:', properties.length);
      } catch (error) {
        console.warn('⚠️ [SearchContext] No se pudieron cargar propiedades (endpoint no disponible):', error);
        // No es un error crítico, solo establecer array vacío
        setAllProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, []);

  // Filtrar propiedades basado en los criterios actuales
  const filteredProperties = propertyService.filterProperties(allProperties, {
    location: searchData.location,
    checkIn: searchData.checkIn,
    checkOut: searchData.checkOut,
    guests: searchData.guests,
    ...filters
  });

  // Función para realizar búsqueda
  const performSearch = async () => {
    setIsSearching(true);
    
    try {
      // Intentar búsqueda en el backend primero
      const searchResults = await propertyService.searchProperties({
        location: searchData.location,
        checkIn: searchData.checkIn,
        checkOut: searchData.checkOut,
        guests: searchData.guests,
        ...filters
      });
      
      if (searchResults.length > 0) {
        setAllProperties(searchResults);
        console.log('✅ [SearchContext] Búsqueda backend exitosa:', searchResults.length);
      } else {
        console.log('⚠️ [SearchContext] Sin resultados del backend, usando filtros locales');
      }
    } catch (error) {
      console.error('💥 [SearchContext] Error en búsqueda backend:', error);
      console.log('⚠️ [SearchContext] Usando filtros locales como fallback');
    } finally {
      setIsSearching(false);
    }
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilters({
      propertyType: '',
      minPrice: 0,
      maxPrice: 1000,
      amenities: [],
      minRating: 0,
      instantBook: false
    });
  };

  const value: SearchContextType = {
    searchData,
    setSearchData,
    filters,
    setFilters,
    filteredProperties,
    isSearching,
    setIsSearching,
    performSearch,
    clearFilters,
    allProperties,
    isLoading
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
