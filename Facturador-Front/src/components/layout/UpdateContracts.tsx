import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const UpdateContractsWarning: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const alreadySeen = localStorage.getItem('contractsWarningSeen');
    if (!alreadySeen) {
      setIsOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    // Marca como visto y redirige
    localStorage.setItem('contractsWarningSeen', 'true');
    router.push(`/contratos/`);
    setIsOpen(false);
  };

  const handleDismiss = () => {
    // Solo cerrar, pero marcar como visto igual
    localStorage.setItem('contractsWarningSeen', 'true');
    setIsOpen(false);
  };

  // Deshabilitar scroll cuando el formulario esté abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Deshabilitar scroll
    } else {
      document.body.style.overflow = 'auto'; // Restaurar el scroll de manera explícita
    }

    // Cleanup: Restaurar el scroll al desmontar o cambiar el estado
    return () => {
      document.body.style.overflow = 'auto'; // Asegurarse de que siempre se restaure
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-[201] transition-all">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 space-y-5 border border-yellow-400">
        {/* Encabezado con icono */}
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertTriangle className="w-7 h-7" />
          <h2 className="text-2xl font-bold">¡Atención!</h2>
        </div>

        {/* Mensaje */}
        <p className="text-gray-700 text-xl leading-relaxed">
          Hemos realizado{' '}
          <span className="font-semibold">cambios en los contratos</span>.
          <br />
          Ahora incluyen nuevos campos para mejorar la gestión de datos. Es
          necesario que actualices esta información en los contratos que vayas a
          utilizar.
        </p>
        <img
          src="../../../WARNING.png"
          alt="Quality Logo"
          className="w-[1000px] h-auto"
        />

        {/* Botones */}
        <div className="flex justify-center gap-3 pt-2">
          <button
            className="bg-yellow-500 text-white font-medium px-6 py-2 rounded-full hover:bg-yellow-600 transition text-xl"
            onClick={handleConfirm}
          >
            Ir a contratos
          </button>
          <button
            className="bg-gray-200 text-gray-800 font-medium px-6 py-2 rounded-full hover:bg-gray-300 transition text-sm"
            onClick={handleDismiss}
          >
            Ya lo hice
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateContractsWarning;
