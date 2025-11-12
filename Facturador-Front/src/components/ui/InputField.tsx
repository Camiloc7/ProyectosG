import React from 'react';
import { useEffect } from 'react';

interface InputFieldProps {
  label: string;
  name?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: boolean;
  readOnly?: boolean;
  type?: HTMLInputElement['type'];
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder = 'Ingrese los datos',
  error,
  readOnly = false,
  type = 'text',
}) => {
  //Este evita que se pongan numeros al mover la rueda del mouse:
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const activeElement = document.activeElement as HTMLInputElement | null;

      // Bloquear solo si el usuario está en un input de tipo number
      if (activeElement && activeElement.type === 'number' && !event.shiftKey) {
        event.preventDefault();
        activeElement.blur(); // Elimina el foco del input para evitar que siga cambiando
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);
  return (
    <div className="w-full mt-4">
      <label className="font-montserrat font-normal text-[#6F6F6F] text-sm">
        {label}
        <span className={`text-red-500 ml-1 ${error ? '' : 'invisible'}`}>
          *
        </span>
      </label>
      <input
        type={type}
        name={name}
        placeholder={readOnly ? '' : placeholder}
        value={value}
        onChange={readOnly ? undefined : onChange}
        readOnly={readOnly}
        className={`w-full mt-4 h-10 px-4 border rounded-[25px] text-sm focus:ring-blue-300 focus:outline-none shadow-sm 
          ${
            readOnly
              ? 'bg-gray-200 border-gray-400 text-gray-500 cursor-not-allowed'
              : 'border-[#00A7E1] text-[#6F6F6F]'
          } ${error ? 'border-red-500' : 'border-[#00A7E1]'}`}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">El campo es obligatorio.</p>
      )}
    </div>
  );
};

export default InputField;
