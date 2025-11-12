import React from 'react';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const TerminosYCondiciones: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
}) => {
  const handleBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick}
    >
      <div className="fixed inset-0 flex justify-center items-center z-51 bg-black bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4">Terminos y condiciones</h2>
        </div>
      </div>
    </div>
  );
};

export default TerminosYCondiciones;
