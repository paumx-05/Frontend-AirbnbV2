/**
 * Esquemas de validación Zod para el módulo de administración
 * Valida las respuestas de la API del backend
 */

import { z } from 'zod';

// Esquema base para respuestas de API
export const AdminResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional()
});

// Esquema para métricas de usuarios
export const UserMetricsSchema = z.object({
  totalUsers: z.number(),
  activeUsers: z.number(),
  inactiveUsers: z.number(),
  verifiedUsers: z.number(),
  unverifiedUsers: z.number(),
  newUsersToday: z.number(),
  newUsersThisWeek: z.number(),
  newUsersThisMonth: z.number(),
  registrationGrowth: z.number(),
  lastUpdated: z.string()
});

// Esquema para usuario individual
export const UserSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  role: z.string().optional().default('user'),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    zipCode: z.string()
  }).optional(),
  preferences: z.object({
    language: z.string(),
    currency: z.string(),
    notifications: z.boolean()
  }).optional(),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLogin: z.string().optional()
});

// Esquema para lista de usuarios con paginación
export const UsersListSchema = z.object({
  users: z.array(UserSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
});

// Esquema para estadísticas detalladas de usuarios
export const UserStatsSchema = z.object({
  totalUsers: z.number(),
  usersByStatus: z.object({
    active: z.number(),
    inactive: z.number()
  }),
  usersByVerification: z.object({
    verified: z.number(),
    unverified: z.number()
  }),
  usersByGender: z.object({
    male: z.number(),
    female: z.number(),
    other: z.number()
  }),
  usersByAgeGroup: z.object({
    '18-25': z.number(),
    '26-35': z.number(),
    '36-45': z.number(),
    '46-55': z.number(),
    '55+': z.number()
  })
});

// Esquema para métricas de actividad
export const ActivityMetricsSchema = z.object({
  totalLogins: z.number(),
  loginsToday: z.number(),
  loginsThisWeek: z.number(),
  loginsThisMonth: z.number(),
  averageSessionDuration: z.number(),
  mostActiveHour: z.number()
});

// Esquema para verificación de rol de admin
export const AdminRoleSchema = z.object({
  isAdmin: z.boolean()
});

// Tipos TypeScript derivados de los esquemas
export type UserMetrics = z.infer<typeof UserMetricsSchema>;
export type User = z.infer<typeof UserSchema>;
export type UsersList = z.infer<typeof UsersListSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type ActivityMetrics = z.infer<typeof ActivityMetricsSchema>;
export type AdminRole = z.infer<typeof AdminRoleSchema>;
export type AdminResponse = z.infer<typeof AdminResponseSchema>;