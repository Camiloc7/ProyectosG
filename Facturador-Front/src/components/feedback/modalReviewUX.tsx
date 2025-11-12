import { useReviewStore } from '@/store/useReviewStore';
import React, { useState, useEffect } from 'react';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalReviewUX: React.FC<ModalFormProps> = ({ isOpen, onClose }) => {
  const [ratingUX, setRatingUX] = useState(0);
  const [message, setMessage] = useState('');
  const { sendReviewUX, fetchReviews } = useReviewStore();

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClose();
  };

  const handleRatingClick =
    (setRating: React.Dispatch<React.SetStateAction<number>>) =>
    (rating: number) => {
      setRating(rating);
    };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = () => {
    sendReviewUX(message, ratingUX);
    setMessage('');
    setRatingUX(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick} // Detecta clic en el fondo
    >
      <div className="fixed inset-0 flex justify-center items-center z-51 bg-black bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
          onClick={(e) => {
            e.stopPropagation(); // Evita que el clic dentro del formulario cierre el modal
          }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">¡Queremos saber tu opinión!</span>
            <span className="text-3xl">😊</span>
          </h2>

          <div className="mb-4">
            <h3 className="text-lg">
              ¿Cómo fue tu experiencia utilizando el facturador?
            </h3>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`cursor-pointer text-3xl ${
                    star <= ratingUX ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  onClick={() => handleRatingClick(setRatingUX)(star)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">
              Dejanos un comentario
            </label>
            <textarea
              className="mt-2 w-full p-2 border rounded-md"
              rows={4}
              value={message}
              onChange={handleMessageChange}
              placeholder="Deja tu mensaje aquí..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="bg-[#333332] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="bg-[#00A7E1] text-white w-24 h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1]"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalReviewUX;
