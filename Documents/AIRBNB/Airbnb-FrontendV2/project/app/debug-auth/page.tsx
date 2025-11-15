'use client';

import AuthDebugger from '@/components/auth/AuthDebugger';

// Configuración para evitar pre-renderizado (usa localStorage)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export default function DebugAuthPage() {
  return <AuthDebugger />;
}