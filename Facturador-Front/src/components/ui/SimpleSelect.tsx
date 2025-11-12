import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Ajustar el tipo para aceptar ambas opciones
type SimpleSelectOption =
  | string
  | number
  | { id: string; nombre: string }
  | { id: number; nombre: string }
  | { label: string; value: string };

interface SimpleSelectProps {
  options: SimpleSelectOption[];
  placeholder?: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: boolean;
  errorMessage?: string;
  width?: string;
  height?: string;
}

const SimpleSelect: React.FC<SimpleSelectProps> = ({
  options,
  placeholder = 'Buscar...',
  value,
  onChange,
  error = false,
  width = '100%',
  height = '10',
  errorMessage = 'El campo es obligatorio',
}) => {
  const [searchBarIsOpen, setSearchBarIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const optionsListRef = useRef<HTMLUListElement>(null);

  const handleSelectOption = (option: SimpleSelectOption) => {
    const selectedValue =
      typeof option === 'string'
        ? option
        : typeof option === 'number'
        ? option.toString()
        : 'id' in option
        ? option.id
        : option.value;
    onChange(String(selectedValue));
    setSearchBarIsOpen(false);
    setHighlightedIndex(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('');
    setSearchBarIsOpen(true);
    setHighlightedIndex(null);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setSearchBarIsOpen(false);
      setHighlightedIndex(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchBarIsOpen) {
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        e.preventDefault();
      }
      if (e.key === 'ArrowDown') {
        setHighlightedIndex((prevIndex) =>
          prevIndex === null || prevIndex === options.length - 1
            ? 0
            : prevIndex + 1
        );
      } else if (e.key === 'ArrowUp') {
        setHighlightedIndex((prevIndex) =>
          prevIndex === null || prevIndex === 0
            ? options.length - 1
            : prevIndex - 1
        );
      } else if (e.key === 'Enter' && highlightedIndex !== null) {
        handleSelectOption(options[highlightedIndex]);
      }
    }
  };

  const handleInputFocus = () => {
    if (!searchBarIsOpen) {
      setSearchBarIsOpen(true);
    }
    if (searchBarIsOpen) {
      const currentIndex = options.findIndex((option) =>
        typeof option === 'string'
          ? option === value
          : typeof option === 'number'
          ? option.toString() === value
          : 'id' in option
          ? option.id === value
          : option.value === value
      );
      setHighlightedIndex(currentIndex === -1 ? 0 : currentIndex);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleGlobalFocus = (event: FocusEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setSearchBarIsOpen(false);
      }
    };
    document.addEventListener('focusin', handleGlobalFocus);
    return () => {
      document.removeEventListener('focusin', handleGlobalFocus);
    };
  }, []);

  useEffect(() => {
    if (highlightedIndex !== null && optionsListRef.current) {
      const optionElement = optionsListRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      optionElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const renderOptionLabel = (option: SimpleSelectOption) =>
    typeof option === 'string'
      ? option
      : typeof option === 'number'
      ? option.toString()
      : 'nombre' in option
      ? option.nombre
      : option.label;

  const stringValue = value.toString();
  const currentOption = options.find((option) => {
    if (typeof option === 'string' || typeof option === 'number') {
      return option === value;
    } else if ('id' in option) {
      return Number(option.id) === Number(value);
    } else {
      return option.value === value;
    }
  });

  return (
    <div style={{ width }}>
      <div ref={ref} className="relative">
        <input
          type="text"
          autoComplete="off"
          className={`h-10 px-4 border ${
            error ? 'border-red-500' : 'border-[#00A7E1]'
          } rounded-[25px] text-[#00A7E1] w-full text-sm focus:ring-blue-300 focus:outline-none shadow-sm placeholder-[#00A7E1] cursor-pointer`}
          placeholder={placeholder}
          value={currentOption ? renderOptionLabel(currentOption) : ''}
          onClick={() => setSearchBarIsOpen(true)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          readOnly
        />

        <span
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#00A7E1]"
          onClick={() => setSearchBarIsOpen(true)}
        >
          <ChevronDown size={20} />
        </span>

        {searchBarIsOpen && (
          <div className="absolute z-10 min-w-40 w-full bg-white border rounded-md max-h-[240px] overflow-y-auto shadow-md">
            <ul ref={optionsListRef}>
              {options.map((option, index) => {
                const isSelected =
                  typeof option === 'string'
                    ? option === value
                    : typeof option === 'number'
                    ? option.toString() === value
                    : 'id' in option
                    ? option.id === value
                    : option.value === value;

                return (
                  <li
                    key={index}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-200 
                      ${highlightedIndex === index ? 'bg-blue-100' : ''} 
                      ${isSelected ? 'bg-gray-200' : ''}`}
                    onClick={() => handleSelectOption(option)}
                  >
                    {renderOptionLabel(option)}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleSelect;
