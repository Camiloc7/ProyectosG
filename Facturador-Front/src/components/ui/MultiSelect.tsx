import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

type MultiSelectOption =
  | string
  | number
  | { id: string | number; nombre: string }
  | { label: string; value: string };

interface MultiSelectProps {
  options: MultiSelectOption[];
  placeholder?: string;
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  maxSelection?: number;
  error?: boolean;
  errorMessage?: string;
  width?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  placeholder = 'Seleccionar...',
  value,
  onChange,
  maxSelection,
  error = false,
  errorMessage,
  width = '100%',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleOption = (option: MultiSelectOption) => {
    const optionValue =
      typeof option === 'string' || typeof option === 'number'
        ? option
        : 'id' in option
        ? option.id
        : option.value;

    const alreadySelected = value.includes(optionValue);

    if (alreadySelected) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      if (!maxSelection || value.length < maxSelection) {
        onChange([...value, optionValue]);
      }
    }
  };

  const removeOption = (optionValue: string | number) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const getDropdownLabel = (option: MultiSelectOption) =>
    typeof option === 'object' && 'nombre' in option && 'clave' in option
      ? `${option.nombre} ( ${option.clave} )`
      : renderOptionLabel(option);

  const getSelectedLabel = (option: MultiSelectOption) =>
    typeof option === 'object' && 'nombre' in option && 'clave' in option
      ? `${option.clave}`
      : renderOptionLabel(option);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderOptionLabel = (option: MultiSelectOption) =>
    typeof option === 'string'
      ? option
      : typeof option === 'number'
      ? option.toString()
      : 'nombre' in option
      ? option.nombre
      : option.label;

  const getOptionValue = (option: MultiSelectOption) =>
    typeof option === 'string' || typeof option === 'number'
      ? option
      : 'id' in option
      ? option.id
      : option.value;

  const selectedOptions = options.filter((option) =>
    value.includes(getOptionValue(option))
  );

  return (
    <div style={{ width }}>
      <div className="relative" ref={containerRef}>
        <div
          className={`flex flex-wrap min-h-10 text-sm gap-1 px-4 items-center py-1 border ${
            error ? 'border-red-500' : 'border-[#00A7E1]'
          } rounded-[25px] cursor-pointer text-[#00A7E1]`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedOptions.length === 0 && (
            <span className="text-sm text-[#00A7E1] opacity-50">
              {placeholder}
            </span>
          )}
          {selectedOptions.map((option, index) => {
            const optionValue = getOptionValue(option);
            return (
              <span
                key={index}
                className="bg-[#00A7E1] text-white rounded-full px-3 py-0.5 flex items-center text-sm"
              >
                {getSelectedLabel(option)}
                <X
                  size={14}
                  className="ml-1 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(optionValue);
                  }}
                />
              </span>
            );
          })}
          <span className="ml-auto self-center text-[#00A7E1]">
            <ChevronDown size={20} />
          </span>
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-[200px] overflow-y-auto shadow-md">
            <ul>
              {options.map((option, index) => {
                // const optionLabel = renderOptionLabel(option);
                const optionValue = getOptionValue(option);
                const isChecked = value.includes(optionValue);

                return (
                  <li
                    key={index}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={() => toggleOption(option)}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="accent-[#00A7E1]"
                    />
                    <span>{getDropdownLabel(option)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {error && errorMessage && (
          <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;
