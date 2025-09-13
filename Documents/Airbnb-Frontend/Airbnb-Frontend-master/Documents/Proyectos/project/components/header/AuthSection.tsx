import { User, DoorOpen } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import UserMenu from '../auth/UserMenu';
import NotificationBell from '../notifications/NotificationBell';

/**
 * AuthSection Component - Sección de autenticación del header
 * Implementa navegación del icono de usuario y logout según memorias
 */
interface AuthSectionProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export default function AuthSection({ isMobile = false, onLinkClick }: AuthSectionProps) {
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      if (onLinkClick) onLinkClick();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (isMobile) {
    if (!isAuthenticated) {
      return (
        <>
          <Link href="/login">
            <Button
              variant="ghost"
              className="w-full text-left justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
              onClick={onLinkClick}
            >
              Iniciar Sesión
            </Button>
          </Link>
          <Link href="/register">
            <Button
              className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white"
              onClick={onLinkClick}
            >
              Registrarse
            </Button>
          </Link>
        </>
      );
    }

    return (
      <div className="space-y-2">
        <Link href="/account">
          <Button
            variant="ghost"
            className="w-full text-left justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
            onClick={onLinkClick}
          >
            <User className="h-4 w-4 mr-2" />
            Cuenta
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full text-left justify-start text-slate-300 hover:text-white hover:bg-slate-700/50 text-red-400 hover:text-red-300"
          onClick={handleLogout}
        >
          <DoorOpen className="h-4 w-4 mr-2" />
          Salir
        </Button>
      </div>
    );
  }

  // Desktop version
  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-2">
        <Link href="/login">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            Iniciar Sesión
          </Button>
        </Link>
        <Link href="/register">
          <Button
            size="sm"
            className="bg-[#FF385C] hover:bg-[#E31C5F] text-white"
          >
            Registrarse
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Icono de usuario que navega a /account */}
      <Link href="/account">
        <Button
          variant="ghost"
          className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-700/50 transition-all duration-200"
        >
          <User className="h-5 w-5" />
        </Button>
      </Link>
      
      <NotificationBell />
      <UserMenu />
      
      {/* Icono de logout (DoorOpen) en la parte derecha */}
      <Button
        variant="ghost"
        className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-700/50 transition-all duration-200"
        onClick={handleLogout}
        title="Cerrar sesión"
      >
        <DoorOpen className="h-5 w-5" />
      </Button>
    </div>
  );
}
