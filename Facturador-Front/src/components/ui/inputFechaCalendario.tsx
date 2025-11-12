import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker'; // Instala `react-datepicker` si aún no lo tienes
import 'react-datepicker/dist/react-datepicker.css'; // Importar los estilos de react-datepicker

interface DatePickerInputProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  error?: boolean;
}

const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  error = false,
}) => {
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [manualDate, setManualDate] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleIconClick = () => {
    setShowCalendarModal(true);
  };

  useEffect(() => {
    setManualDate(value);
  }, [value]);

  // Cambiar la función para aceptar `Date | null` como tipo de entrada
  const handleDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0]; // Formatear la fecha como YYYY-MM-DD
      setManualDate(formattedDate);
      onChange(formattedDate);
    } else {
      setManualDate(''); // Si la fecha es null, limpiar el valor
      onChange(''); // También puedes pasar un valor vacío si prefieres
    }
    setShowCalendarModal(false);
  };

  return (
    <div className="relative mt-4">
      <label
        htmlFor="vencimiento"
        className="block text font-montserrat font-normal text-sm text-[#6F6F6F]"
      >
        {label}
      </label>

      <div className="relative mt-4">
        <input
          ref={inputRef}
          type="text"
          name="vencimiento"
          value={manualDate}
          onChange={(e) => setManualDate(e.target.value)}
          onBlur={() => onChange(manualDate)}
          className={`w-full h-10 px-4 pr-10 border border-[#00A7E1] text-[#C3C3C3] rounded-[25px] 
        text-sm focus:ring-blue-300 focus:outline-none shadow-sm appearance-none ${
          error
            ? 'border-red-500 text-red-600'
            : 'border-[#00A7E1] text-[#C3C3C3] focus:ring-blue-300'
        }`}
          placeholder="YYYY-MM-DD"
        />

        <Calendar
          onClick={handleIconClick}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#C3C3C3] cursor-pointer"
        />
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1">El campo es obligatorio</p>
      )}

      {/* Modal de selección de fecha */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-[201]">
          <div className="bg-white p-4 rounded-lg shadow-lg w-[90%] sm:w-[250px] md:w-[300px] lg:w-[350px] xl:w-[400px] justify-center">
            <h2 className="text-center text-lg font-semibold mb-3">
              Seleccionar Fecha
            </h2>
            <div className="justify-center text-center">
              <DatePicker
                selected={manualDate ? new Date(manualDate) : null}
                onChange={handleDateChange}
                inline
                className="border border-gray-300 rounded-lg shadow-sm w-full"
              />
            </div>
            <button
              onClick={() => setShowCalendarModal(false)}
              className="mt-3 w-full bg-[#00A7E1] text-white py-2 rounded-xl hover:bg-[#0077c2]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePickerInput;
