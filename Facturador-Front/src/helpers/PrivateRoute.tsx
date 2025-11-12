import { useEffect, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUser';
import Spinner from '@/components/feedback/Spinner';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { showErrorToast } from '@/components/feedback/toast';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // Estado para controlar el loading
  const [showLimitWarning, setShowLimitWarning] = useState(false); // Estado para el aviso de límite de facturacion
  const [showSuscripcionCaducada, setShowSuscripcionCaducada] = useState(false); // Estado para el aviso de límite de tiempo en suscripcion

  const { infoDelUsuario, traerInfoDeUsuarios } = useUserStore(); // Acceder a infoDelUsuario y autenticación

  useEffect(() => {
    const token = getTokenFromCookies();

    if (!token) {
      router.push('/login');
      return;
    }

    if (!infoDelUsuario) {
      traerInfoDeUsuarios();
      return;
    }

    if (infoDelUsuario) {
      const fechaVencimiento = new Date(infoDelUsuario.fechaDeVencimiento);
      const fechaActual = new Date();

      // console.log(infoDelUsuario);
      // Verificamos que la fecha sea válida
      if (isNaN(fechaVencimiento.getTime())) {
        console.error(
          'Fecha de vencimiento no válida:',
          infoDelUsuario.fechaDeVencimiento
        );

        showErrorToast(
          `Fecha de vencimiento no valida: ${infoDelUsuario.fechaDeVencimiento}`
        );
        router.push('/login');
        return;
      }

      const diferenciaTiempo =
        fechaVencimiento.getTime() - fechaActual.getTime(); // Convertir a número
      const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
      // console.log(`Días restantes del usuario: ${diasRestantes}`);
      // console.log(`Limite restante: ${infoDelUsuario.limiteDisponible}`);

      if (diasRestantes <= 0) {
        setShowSuscripcionCaducada(true);
      }

      if (Number(infoDelUsuario.limiteDisponible) <= 0) {
        setShowLimitWarning(true);
      }

      setLoading(false);
    }
  }, [router, infoDelUsuario]);

  // Mientras se determina si hay token o no, muestra un loading
  if (loading) {
    return <Spinner />;
  }

  // Mensaje de aviso antes de redirigir a la pasarela de pagos
  if (showLimitWarning) {
    return (
      <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-lg font-bold">
            ¡Tu límite de facturación se ha agotado!
          </p>
          <p>Por favor, comunícate con nosotros para renovar tu suscripción.</p>
        </div>
      </div>
    );
  }

  if (showSuscripcionCaducada) {
    return (
      <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-lg font-bold">¡Tu suscripción ha caducado!</p>
          <p>Por favor, comunícate con nosotros para renovarla.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PrivateRoute;
