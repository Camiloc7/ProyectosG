'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/feedback/Spinner';
import { BASE_URL_SIN_INDEX } from '@/helpers/ruta';
import { showErrorToast } from '@/components/feedback/toast';
import { fetchWithTimeout } from '@/helpers/timefetch';
import handleGlobalLogOut from '@/helpers/logOutGlobal';

export default function Redireccion() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Avisar al opener que estamos listos
    window.opener?.postMessage({ ready: true }, '*');

    const RUTA_POS = 'https://www.gastro-pos.com'; // POS

    // const RUTA_POS = 'http://localhost:3000'; // POS

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== RUTA_POS) {
        console.error(
          'NO ESTA VINIENDO DE LA RUTA QUE ESPERAMOS: ',
          event.origin
        );
        return;
      }

      const gastroToken = event.data?.gastroToken;
      console.warn(gastroToken);
      if (!gastroToken) {
        showErrorToast('No se pudo capturar el token de Gastro');

        return;
      }

      try {
        const res = await fetchWithTimeout(
          `${BASE_URL_SIN_INDEX}auth/generate`,
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${gastroToken}`,
            },
          }
        );
        if (!res.ok) {
          const data = await res.text();

          throw new Error('Error al obtener respuesta del back');
        }

        const data = await res.json();

        if (!data?.status || !data?.token) {
          showErrorToast('Algo salió mal');
          setError('Algo salió mal');
          setLoading(false);
          return;
        }

        const token = data.token;
        // handleGlobalLogOut(); //Eliminamos cualquier resto de una sesion iniciada anteriormente

        // Guardar cookie
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 120);
        const expires = `expires=${expirationDate.toUTCString()};`;

        if (window.location.hostname === 'localhost') {
          document.cookie = `tokenFacturador=${token}; path=/; ${expires}`;
        } else {
          document.cookie = `tokenFacturador=${token}; path=/; Secure; SameSite=None; ${expires}`;
        }
        router.push('/facturacionMixta/');
      } catch (err) {
        console.error(err);
        showErrorToast('Error de conexión');
        setError('Error de conexión');
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  if (loading) return <Spinner />;
  if (error)
    return <div className="text-red-600 text-center mt-8">{error}</div>;
  return null;
}
