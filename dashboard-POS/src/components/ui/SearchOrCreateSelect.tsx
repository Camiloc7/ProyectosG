import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type SelectOption =
  | string
  | { id: string; nombre: string }
  | { label: string; value: string };

interface SearchOrCreateSelectProps {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  errorMessage?: string;
}

const SearchOrCreateSelect: React.FC<SearchOrCreateSelectProps> = ({
  label,
  options,
  placeholder = "Buscar...",
  value,
  onChange,
  error = false,
  errorMessage = "Campo requerido",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBarIsOpen, setSearchBarIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const optionsListRef = useRef<HTMLUListElement>(null);

  const renderOptionLabel = (option: SelectOption) =>
    typeof option === "string"
      ? option
      : "nombre" in option
      ? option.nombre
      : option.label;

  const filteredOptions = options
    .map((option) => ({
      option,
      match: renderOptionLabel(option)
        .toLowerCase()
        .includes((value || searchTerm).toLowerCase()),
    }))
    .sort((a, b) => (b.match ? 1 : 0) - (a.match ? 1 : 0))
    .map((item) => item.option);

  const handleSelectOption = (option: SelectOption) => {
    const selectedValue =
      typeof option === "string"
        ? option
        : "id" in option
        ? option.id
        : option.value;
    onChange(selectedValue);
    setSearchBarIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(null);
  };

  const selectedOption = options.find((option) =>
    typeof option === "string"
      ? option === value
      : "id" in option
      ? option.id === value
      : option.value === value
  );

  const displayValue = selectedOption
    ? renderOptionLabel(selectedOption)
    : searchTerm;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearchTerm(inputValue);
    onChange("");
    setSearchBarIsOpen(true);
    setHighlightedIndex(null);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setSearchBarIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchBarIsOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prevIndex) =>
        prevIndex === null || prevIndex === filteredOptions.length - 1
          ? 0
          : prevIndex + 1
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prevIndex) =>
        prevIndex === null || prevIndex === 0
          ? filteredOptions.length - 1
          : prevIndex - 1
      );
    } else if (e.key === "Enter" && highlightedIndex !== null) {
      handleSelectOption(filteredOptions[highlightedIndex]);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (highlightedIndex !== null && optionsListRef.current) {
      const optionElement = optionsListRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      optionElement?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  useEffect(() => {
    const handleGlobalFocus = (event: FocusEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setSearchBarIsOpen(false);
      }
    };

    document.addEventListener("focusin", handleGlobalFocus);

    return () => {
      document.removeEventListener("focusin", handleGlobalFocus);
    };
  }, []);

  const handleInputFocus = () => {
    if (!searchBarIsOpen) {
      setSearchBarIsOpen(true); // Open the select when the input gets focused
    }

    if (searchBarIsOpen) {
      const currentIndex = options.findIndex((option) =>
        typeof option === "string"
          ? option === value
          : "id" in option
          ? option.id === value
          : option.value === value
      );
      setHighlightedIndex(currentIndex === -1 ? 0 : currentIndex);
    }
  };

  return (
    <div className="mt-4">
      {label ? (
        <label className="block text font-montserrat font-normal text-sm text-[#6F6F6F]">
          {label}
          {error && <span className="text-red-500 ml-1">*</span>}
        </label>
      ) : (
        ""
      )}

      <div ref={ref} className="">
        <div className="relative">
          <input
            type="text"
            autoComplete="new-password"
            className={`h-10 px-4 border ${label ? "mt-4" : ""} ${
              error ? "border-red-500" : "border-[#00A7E1]"
            } rounded-[25px] text-[#00A7E1] w-full text-sm focus:ring-blue-300 focus:outline-none 
           shadow-sm placeholder-[#00A7E1]`}
            placeholder={placeholder}
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onClick={() => setSearchBarIsOpen(true)}
            onKeyDown={handleKeyDown}
          />

          {/* Usando flexbox para asegurar que el ícono esté centrado verticalmente */}
          <span className="absolute right-4 top-1/2 transform -translate-y-1/4 flex items-center text-[#00A7E1]">
            <ChevronDown size={20} />
          </span>
        </div>

        {searchBarIsOpen && filteredOptions.length > 0 && (
          <div className="absolute z-10 w-full bg-white border rounded-md max-h-[200px] overflow-y-auto shadow-md">
            <ul ref={optionsListRef}>
              {filteredOptions.map((option, index) => {
                const optionLabel = renderOptionLabel(option);
                const startIndex = optionLabel
                  .toLowerCase()
                  .indexOf((value || searchTerm).toLowerCase());
                const endIndex = startIndex + (value || searchTerm).length;

                return (
                  <li
                    key={index}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-200 ${
                      highlightedIndex === index ? "bg-blue-100" : ""
                    }`}
                    onClick={() => handleSelectOption(option)}
                  >
                    {startIndex !== -1 ? (
                      <span>
                        {optionLabel.slice(0, startIndex)}
                        <strong className="text-blue-500">
                          {optionLabel.slice(startIndex, endIndex)}
                        </strong>
                        {optionLabel.slice(endIndex)}
                      </span>
                    ) : (
                      <span>{optionLabel}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {searchTerm && filteredOptions.length === 0 && (
          <div className="absolute z-10 w-full bg-white border rounded-md shadow-md p-2 text-gray-500 text-sm">
            <p className="mb-2">No se encontraron resultados</p>
            <button
              onClick={() => {}}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              <span className="text-xl leading-none">＋</span> Crear "
              {searchTerm}"
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
    </div>
  );
};

export default SearchOrCreateSelect;
