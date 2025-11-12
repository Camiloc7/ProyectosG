import React, { useEffect } from 'react';

interface VistaPreviaModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

const VistaPreviaModal: React.FC<VistaPreviaModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
}) => {
  // Si el modal está abierto, agregamos un evento para cerrar al hacer clic fuera del contenido del modal
  useEffect(() => {
    if (isOpen) {
      const handleOutsideClick = (event: MouseEvent) => {
        if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
          onClose();
        }
      };

      document.addEventListener('click', handleOutsideClick);

      return () => {
        document.removeEventListener('click', handleOutsideClick);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-100000">
      <div className="modal-content bg-white p-6 rounded-lg relative">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4">
          Vista Previa de la Cédula
        </h2>
        {/* <img
          src={imageUrl}
          alt="Cédula"
          className="max-w-full max-h-96 object-contain"
        /> */}
      </div>
    </div>
  );
};

export default VistaPreviaModal;
