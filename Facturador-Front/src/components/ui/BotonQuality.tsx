import React from 'react';

interface BotonQualityProps {
  onClick: () => void;
  label: string;
  /**
   * Variant for styling: "blue" | "black" | "white" | "grey".
   * "blue" is the default quality style.
   */
  variant?: 'blue' | 'black' | 'white' | 'grey';
}

const variantClasses: Record<string, string> = {
  blue: 'bg-[#00A7E1] text-white hover:bg-[#008ec1]',
  black: 'bg-black text-white hover:bg-gray-800',
  white: 'bg-white text-[#6F6F6F] border border-gray-300 hover:bg-gray-100',
  grey: 'bg-gray-200 text-gray-600 border border-gray-400 hover:bg-gray-300',
};

const BotonQuality: React.FC<BotonQualityProps> = ({
  onClick,
  label,
  variant = 'blue',
}) => {
  const classes = [
    'h-8',
    'px-4',
    'py-2',
    'flex',
    'items-center',
    'justify-center',
    'font-bold',
    'font-montserrat',
    'rounded-3xl',
    'leading-[14.63px]',
    'text-[12px]',
    'min-w-32', // ancho mínimo
    'w-fit', // se ajusta al contenido
    'max-w-full', // pero no se pasa del contenedor
    variantClasses[variant],
  ].join(' ');

  return (
    <button type="button" onClick={onClick} className={classes}>
      {label}
    </button>
  );
};

export default BotonQuality;
