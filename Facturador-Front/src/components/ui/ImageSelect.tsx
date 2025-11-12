import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Ajustar el tipo para aceptar ambas opciones
type ImageSelectOption = {
  label: string;
  value: string;
};

interface ImageSelectProps {
  options: ImageSelectOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  errorMessage?: string;
}

const ImageSelect: React.FC<ImageSelectProps> = ({
  options,
  placeholder = 'Selecciona o ingresa una URL...',
  value,
  onChange,
  error = false,
  errorMessage = 'El campo es obligatorio',
}) => {
  const [searchBarIsOpen, setSearchBarIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const optionsListRef = useRef<HTMLUListElement>(null);

  // Estado local para la entrada de texto del usuario
  const [inputValue, setInputValue] = useState<string>(value);

  // Sincroniza el estado local con el valor de la prop `value`
  useEffect(() => {
    // Si el valor externo cambia, actualiza el valor del input
    setInputValue(value);
  }, [value]);

  const handleSelectOption = (option: ImageSelectOption) => {
    // Cuando se selecciona una opción, actualiza el input local y el estado externo
    setInputValue(option.value);
    onChange(option.value);
    setSearchBarIsOpen(false);
    setHighlightedIndex(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Actualiza el estado local del input y el estado externo al mismo tiempo
    setInputValue(newValue);
    onChange(newValue);
    setSearchBarIsOpen(true);
    setHighlightedIndex(null);
  };

  const handleInputFocus = () => {
    if (!searchBarIsOpen) {
      setSearchBarIsOpen(true);
    }
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
          prevIndex === null || prevIndex === filteredOptions.length - 1
            ? 0
            : prevIndex + 1
        );
      } else if (e.key === 'ArrowUp') {
        setHighlightedIndex((prevIndex) =>
          prevIndex === null || prevIndex === 0
            ? filteredOptions.length - 1
            : prevIndex - 1
        );
      } else if (e.key === 'Enter' && highlightedIndex !== null) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      }
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  // Filtra las opciones para la lista desplegable
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );
  
  // Renderiza el label de la opción actual
  const currentLabel = options.find(opt => opt.value === value)?.label || '';

  return (
    <div className="w-full">
      <div ref={ref} className="relative">
        <input
          type="text"
          autoComplete="off"
          className={`h-10 px-4 border ${
            error ? 'border-red-500' : 'border-[#00A7E1]'
          } rounded-[25px] text-[#00A7E1] w-full text-sm focus:ring-blue-300 focus:outline-none shadow-sm placeholder-[#00A7E1]`}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
        />

        <span
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#00A7E1] cursor-pointer"
          onClick={() => setSearchBarIsOpen(!searchBarIsOpen)}
        >
          <ChevronDown size={20} />
        </span>

        {searchBarIsOpen && filteredOptions.length > 0 && (
          <div className="absolute z-10 min-w-40 w-full bg-white border rounded-md max-h-[200px] overflow-y-auto shadow-md mt-1">
            <ul ref={optionsListRef}>
              {filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-200 
                      ${highlightedIndex === index ? 'bg-blue-100' : ''} 
                      ${isSelected ? 'bg-gray-200 font-semibold' : ''}`}
                    onClick={() => handleSelectOption(option)}
                  >
                    {option.label}
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

export default ImageSelect;