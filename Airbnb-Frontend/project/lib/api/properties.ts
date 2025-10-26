/**
 * Servicios de API para propiedades - Reemplaza mockData.ts
 * Conecta con el backend real para obtener datos de propiedades
 */

import { apiClient } from './config';

// Interfaces para tipado de propiedades
export interface Property {
  id: string;
  title: string;
  location: string;
  city: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  propertyType: 'entire' | 'private' | 'shared';
  amenities: string[];
  instantBook: boolean;
  maxGuests: number;
  availableDates: {
    start: string;
    end: string;
  }[];
  description: string;
  host: {
    name: string;
    avatar: string;
    isSuperhost: boolean;
  };
}

export interface PropertyResponse {
  success: boolean;
  data?: Property[];
  message?: string;
}

export interface PropertyFilters {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  minRating?: number;
  instantBook?: boolean;
}

/**
 * Servicios de propiedades que se conectan al backend real
 */
export const propertyService = {
  /**
   * Obtener todas las propiedades disponibles
   * GET /api/properties
   */
  async getAllProperties(): Promise<Property[]> {
    try {
      console.log('🔍 [propertyService] Obteniendo todas las propiedades...');
      
      const response = await apiClient.get<PropertyResponse>('/api/properties');
      
      if (response.success && response.data) {
        console.log('✅ [propertyService] Propiedades obtenidas:', response.data.length);
        return response.data;
      } else {
        console.log('❌ [propertyService] Error obteniendo propiedades:', response.message);
        return [];
      }
    } catch (error) {
      console.error('💥 [propertyService] Error obteniendo propiedades:', error);
      return [];
    }
  },

  /**
   * Obtener una propiedad por ID
   * GET /api/properties/:id
   */
  async getPropertyById(id: string): Promise<Property | null> {
    try {
      console.log('🔍 [propertyService] Obteniendo propiedad:', id);
      
      const response = await apiClient.get<{ success: boolean; data?: Property; message?: string }>(`/api/properties/${id}`);
      
      if (response.success && response.data) {
        console.log('✅ [propertyService] Propiedad obtenida:', response.data.title);
        return response.data;
      } else {
        console.log('❌ [propertyService] Propiedad no encontrada:', response.message);
        return null;
      }
    } catch (error) {
      console.error('💥 [propertyService] Error obteniendo propiedad:', error);
      return null;
    }
  },

  /**
   * Buscar propiedades con filtros
   * POST /api/properties/search
   */
  async searchProperties(filters: PropertyFilters): Promise<Property[]> {
    try {
      console.log('🔍 [propertyService] Buscando propiedades con filtros:', filters);
      
      const response = await apiClient.post<PropertyResponse>('/api/properties/search', filters);
      
      if (response.success && response.data) {
        console.log('✅ [propertyService] Propiedades encontradas:', response.data.length);
        return response.data;
      } else {
        console.log('❌ [propertyService] Error en búsqueda:', response.message);
        return [];
      }
    } catch (error) {
      console.error('💥 [propertyService] Error buscando propiedades:', error);
      return [];
    }
  },

  /**
   * Obtener sugerencias de ubicación
   * GET /api/properties/locations/suggestions?q=:query
   */
  async getLocationSuggestions(query: string): Promise<Array<{ name: string; country: string; type: 'city' | 'country' | 'region' }>> {
    try {
      console.log('🔍 [propertyService] Obteniendo sugerencias para:', query);
      
      const response = await apiClient.get<{ 
        success: boolean; 
        data?: Array<{ name: string; country: string; type: 'city' | 'country' | 'region' }>; 
        message?: string 
      }>(`/api/properties/locations/suggestions?q=${encodeURIComponent(query)}`);
      
      if (response.success && response.data) {
        console.log('✅ [propertyService] Sugerencias obtenidas:', response.data.length);
        return response.data;
      } else {
        console.log('❌ [propertyService] Error obteniendo sugerencias:', response.message);
        return [];
      }
    } catch (error) {
      console.error('💥 [propertyService] Error obteniendo sugerencias:', error);
      return [];
    }
  },

  /**
   * Filtrar propiedades localmente (fallback si el backend no soporta filtros avanzados)
   */
  filterProperties(properties: Property[], filters: PropertyFilters): Property[] {
    return properties.filter(property => {
      // Filtro por ubicación (ciudad)
      if (filters.location && !property.city.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Filtro por número de huéspedes
      if (filters.guests && property.maxGuests < filters.guests) {
        return false;
      }

      // Filtro por tipo de propiedad
      if (filters.propertyType && property.propertyType !== filters.propertyType) {
        return false;
      }

      // Filtro por precio
      if (filters.minPrice && property.pricePerNight < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && property.pricePerNight > filters.maxPrice) {
        return false;
      }

      // Filtro por calificación mínima
      if (filters.minRating && property.rating < filters.minRating) {
        return false;
      }

      // Filtro por reserva instantánea
      if (filters.instantBook && !property.instantBook) {
        return false;
      }

      // Filtro por amenidades
      if (filters.amenities && filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity => 
          property.amenities.includes(amenity)
        );
        if (!hasAllAmenities) {
          return false;
        }
      }

      return true;
    });
  }
};

/**
 * Función helper para obtener sugerencias de ubicación (fallback local)
 * Se usa cuando el backend no está disponible
 */
export const getLocationSuggestionsFallback = (searchTerm: string): Array<{ name: string; country: string; type: 'city' | 'country' | 'region' }> => {
  const cities = ['Madrid', 'Barcelona', 'Valencia'];
  const countries = ['España'];
  
  const suggestions: Array<{ name: string; country: string; type: 'city' | 'country' | 'region' }> = [
    ...cities.map(city => ({ name: city, country: 'España', type: 'city' as const })),
    ...countries.map(country => ({ name: country, country: country, type: 'country' as const }))
  ];

  return suggestions.filter(suggestion =>
    suggestion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.country.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);
};
