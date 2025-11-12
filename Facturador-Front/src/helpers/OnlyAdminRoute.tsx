import { useEffect, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUser';
import Spinner from '@/components/feedback/Spinner';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { infoDelUsuario, traerInfoDeUsuarios } = useUserStore();

  useEffect(() => {
    const token = getTokenFromCookies();
    if (!token) {
      router.push('/login');
      return;
    }

    // Si aún no se ha cargado infoDelUsuario, solicitarla
    if (!infoDelUsuario) {
      traerInfoDeUsuarios();
      return;
    }

    // Verificar si el rol es 2 o 3, si no, redirigir
    /* 
    !SUPER ADMIN = 2 
    !PARCIAL ADMIN = 3
    
    */
    if (infoDelUsuario.rol !== '2' && infoDelUsuario.rol !== '3') {
      console.log('No es Admin');
      router.push('/gestionDeFacturasElectronicas');
      return;
    }

    setLoading(false);
  }, [router, infoDelUsuario]);

  if (loading || !infoDelUsuario) {
    return <Spinner />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
