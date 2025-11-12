import React from 'react';
import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  /** Controla si el checkbox está marcado */
  checked: boolean;

  /** Función que se ejecuta al cambiar el estado */
  onChange: (checked: boolean) => void;

  /** Color de fondo cuando está marcado (Tailwind compatible o código HEX) */
  checkedColor?: string;

  /** Clases adicionales para el contenedor
   * Por defecto: tamaño y forma
   */
  className?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  checkedColor = '#00A7E1',
  className = '',
}) => {
  const handleChange = () => onChange(!checked);

  return (
    <button
      type="button"
      onClick={handleChange}
      className={`
        relative flex-shrink-0
        h-4 w-4
        border border-gray-300
        rounded-sm
        focus:outline-none focus:ring-2 focus:ring-offset-1
        ${className}
      `}
      style={
        checked
          ? { backgroundColor: checkedColor, borderColor: 'transparent' }
          : undefined
      }
      aria-pressed={checked}
      role="checkbox"
      aria-checked={checked}
    >
      {checked && (
        <Check size={16} className="text-white absolute inset-0 m-auto" />
      )}
    </button>
  );
};

export default CustomCheckbox;

// Ejemplo de uso:
// <CustomCheckbox
//   checked={cal === 2}
//   onChange={(val) => handleCheckboxChange(item.id, 2, pesoValue, cumplimiento)}
//   checkedColor="#00A7E1"
// />
