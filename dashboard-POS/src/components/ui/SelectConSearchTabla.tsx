import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  COLOR_ERROR,
  COLOR_TEXTO,
  ORANGE,
} from "@/styles/colors";

type SelectOption =
  | string
  | { id: string; nombre: string }
  | { label: string; value: string };

interface SelectConSearchTablaProps {
  options: SelectOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

const SelectConSearchTabla: React.FC<SelectConSearchTablaProps> = ({
  options,
  placeholder = "Buscar...",
  value,
  onChange,
  error = false,
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
    .filter((option) =>
      renderOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      renderOptionLabel(a).toLowerCase().indexOf(searchTerm.toLowerCase()) -
      renderOptionLabel(b).toLowerCase().indexOf(searchTerm.toLowerCase())
    );

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
      // Restaurar el valor del input si no se seleccionó nada
      if (!value) {
        setSearchTerm("");
      }
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
  }, [value]);

  useEffect(() => {
    if (highlightedIndex !== null && optionsListRef.current) {
      const optionElement = optionsListRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      optionElement?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  useEffect(() => {
    if (value && !selectedOption) {
      setSearchTerm(value);
    }
  }, [value, selectedOption]);

  const handleInputFocus = () => {
    if (!searchBarIsOpen) {
      setSearchBarIsOpen(true);
      setSearchTerm("");
    }
  };

  return (
    <div ref={ref} className="relative w-full h-full">
      <div className="relative h-full">
        <input
          type="text"
          autoComplete="off"
          style={{
            height: "100%",
            padding: "0 12px",
            border: "none",
            borderRadius: 0,
            fontSize: 14,
            color: COLOR_TEXTO,
            width: "100%",
            boxSizing: "border-box",
            cursor: "pointer",
            fontFamily: "Lato, sans-serif",
            background: "transparent",
            outline: "none",
          }}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
        />
        <span
          onClick={() => setSearchBarIsOpen(!searchBarIsOpen)}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            color: `${ORANGE}`,
            transform: "translateY(-50%)",
            cursor: "pointer",
          }}
        >
          <ChevronDown size={18} />
        </span>
      </div>

      {searchBarIsOpen && filteredOptions.length > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 999,
            width: "100%",
            background: "#fff",
            border: `1px solid ${ORANGE}`,
            borderRadius: 8,
            maxHeight: 200,
            overflowY: "auto",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            marginTop: 4,
          }}
        >
          <ul ref={optionsListRef}>
            {filteredOptions.map((option, index) => {
              const optionLabel = renderOptionLabel(option);
              const isHighlighted = highlightedIndex === index;
              const isSelected =
                typeof option === "string"
                  ? option === value
                  : "id" in option
                  ? option.id === value
                  : option.value === value;

              return (
                <li
                  key={index}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontSize: 14,
                    color: COLOR_TEXTO,
                    background: isHighlighted ? "#fffaef" : "transparent",
                    fontFamily: "Lato, sans-serif",
                    fontWeight: isSelected ? 700 : 400,
                  }}
                  onClick={() => handleSelectOption(option)}
                >
                  <span>{optionLabel}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}


      {searchBarIsOpen && filteredOptions.length === 0 && (
        <div className="absolute **z-[999]** w-full bg-white border rounded-md shadow-md p-2 text-gray-500 text-sm">
          No se encontraron resultados
        </div>
      )}
    </div>
  );
};

export default SelectConSearchTabla;