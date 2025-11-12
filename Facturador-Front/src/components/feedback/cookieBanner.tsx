import PoliticaDePrivacidad from '@/components/feedback/politicaDePrivacidad';
import { useState, useEffect, useRef } from 'react';

const CookieBanner = () => {
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // Estado para asegurarse de que el componente se monta en el cliente
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const privacyRef = useRef<HTMLDivElement | null>(null); // Tipo adecuado para el ref

  useEffect(() => {
    setIsMounted(true);

    if (!localStorage.getItem('cookiesAceptadas')) {
      setIsBannerVisible(true);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookiesAceptadas', 'true');
    setIsBannerVisible(false);
  };

  const handleRejectCookies = () => {
    // Eliminar cookies si el usuario no acepta
    document.cookie.split(';').forEach((c) => {
      document.cookie =
        c.trim().split('=')[0] +
        '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    });

    // Redirigir al usuario a la URL externa
    if (isMounted) {
      window.location.href = 'https://quality-bill.netlify.app/';
    }
  };

  const handlePrivacyOpen = () => setIsPrivacyOpen(true);

  const handleClickOutside = (e: MouseEvent) => {
    // Verificar si el clic ocurrió fuera del componente de la política
    if (privacyRef.current && !privacyRef.current.contains(e.target as Node)) {
      setIsPrivacyOpen(false); // Cerrar la política si se hizo clic fuera de ella
    }
  };

  useEffect(() => {
    // Agregar el evento de clic cuando se abre la política
    if (isPrivacyOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Limpiar el evento al desmontar el componente
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPrivacyOpen]);

  if (!isMounted || !isBannerVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black bg-opacity-80 text-white py-4 px-6 z-50">
      <div className="max-w-4xl mx-auto text-center">
        <p className="mb-4">
          Este sitio usa cookies para guardar la información de inicio de
          sesión. Si necesitas más información, por favor revisa nuestra{' '}
          <a
            onClick={handlePrivacyOpen}
            className="text-blue-400 hover:underline cursor-pointer"
          >
            Política de Privacidad
          </a>
          .
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleAcceptCookies}
            className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Aceptar
          </button>
          <button
            onClick={handleRejectCookies}
            className="bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Rechazar
          </button>
        </div>
      </div>

      {/* Modal de Política de Privacidad */}
      <PoliticaDePrivacidad
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
};

export default CookieBanner;
