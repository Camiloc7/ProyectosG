import { FaStar } from 'react-icons/fa';

// Definir los tipos de las props para el componente ReviewCard
interface ReviewCardProps {
  calificacion: number;
  comentario: string;
  idUsuario: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  calificacion,
  comentario,
  idUsuario,
}) => {
  // Crear un arreglo con estrellas llenas o vacías dependiendo de la calificación
  const estrellas = Array.from(
    { length: 5 },
    (_, index) => index < calificacion
  );

  return (
    <div className="mx-auto px-[6rem] py-8">
      <div className="px-4 sm:px-12 pb-14 pt-8 mx-auto bg-white rounded-[20px] shadow-lg">
        <h1 className="w-full h-10 text-3xl font-bold font-montserrat text-[#6F6F6F] mb-[20px]">
          {idUsuario ?? 'id del administrador'}
        </h1>

        {/* Mostrar estrellas según la calificación */}
        <div className="flex space-x-1 mb-[10px]">
          {estrellas.map((estrella, index) => (
            <FaStar
              key={index}
              size={20}
              color={estrella ? '#FFD700' : '#E0E0E0'}
            />
          ))}
        </div>

        {/* Comentario de la reseña */}
        <p className="text-[16px] font-montserrat text-[#6F6F6F] mt-[10px]">
          {comentario ?? 'Comentario no disponible'}
        </p>
      </div>
    </div>
  );
};
