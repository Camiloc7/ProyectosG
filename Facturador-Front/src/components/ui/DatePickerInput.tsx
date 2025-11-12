import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar } from 'react-feather';

interface DatePickerInputProps {
  label: string;
  name: string;
  value: string;
  error?: boolean;
  onChange: (newValue: string) => void;
}

const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  name,
  value,
  error = false,
  onChange,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      // Convertir la fecha a UTC y formatearla como 'YYYY-MM-DD'
      const utcDate = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      );
      onChange(utcDate.toISOString().split('T')[0]);
    } else {
      onChange('');
    }
    setShowCalendar(false);
  };

  return (
    <div className="flex-1 w-full relative mt-4">
      <label>{label}</label>
      <div className="relative mt-4">
        <input
          type="date"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-10 px-4 pr-10 border ${
            error ? 'border-red-500' : 'border-[#00A7E1]'
          } text-[#C3C3C3] rounded-[25px] text-sm focus:ring-blue-300 focus:outline-none shadow-sm appearance-none [&::-webkit-calendar-picker-indicator]:hidden`}
        />
        <Calendar
          onClick={() => setShowCalendar(true)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#C3C3C3] cursor-pointer"
        />
      </div>

      {showCalendar && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-[201]">
          <div className="bg-white p-4 rounded-lg shadow-lg w-[90%] sm:w-[250px] md:w-[300px] lg:w-[350px] xl:w-[400px]">
            <h2 className="text-center text-lg font-semibold mb-3">
              Seleccionar Fecha
            </h2>
            <div className="justify-center text-center">
              <DatePicker
                selected={value ? new Date(value + 'T00:00:00') : null}
                onChange={handleDateChange}
                inline
                className="border border-gray-300 rounded-lg shadow-sm w-full"
              />
            </div>
            <button
              onClick={() => setShowCalendar(false)}
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
