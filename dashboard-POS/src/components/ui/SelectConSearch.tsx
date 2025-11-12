import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  COLOR_ERROR,
  COLOR_INPUT_BG,
  COLOR_TEXTO,
  ORANGE,
} from "@/styles/colors";

type SelectOption =
  | string
  | { id: string; nombre: string }
  | { label: string; value: string };

interface SelectConSearchProps {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  errorMessage?: string;
}

const SelectConSearch: React.FC<SelectConSearchProps> = ({
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
      <label
        style={{
          display: "block",
          fontSize: 16,
          fontWeight: 500,
          fontFamily: "Lato, sans-serif",
          color: "#555",
          marginBottom: 8,
        }}
      >
        {label}
        <span
          style={{
            color: "#f56565",
            marginLeft: 4,
            visibility: error ? "visible" : "hidden",
          }}
        >
          *
        </span>
      </label>

      <div ref={ref} className="relative">
        <div className="relative">
          <input
            type="text"
            autoComplete="new-password"
            style={{
              height: 40,
              padding: "0 16px",
              border: `1px solid ${error ? COLOR_ERROR : ORANGE}`,
              borderRadius: 25,
              fontSize: 14,
              color: COLOR_TEXTO,
              width: "100%",
              backgroundColor: COLOR_INPUT_BG,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              cursor: "pointer",
              boxSizing: "border-box",
              fontFamily: "Lato, sans-serif",
            }}
            placeholder={placeholder}
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onClick={() => setSearchBarIsOpen(true)}
            onKeyDown={handleKeyDown}
          />

          <span
            onClick={() => setSearchBarIsOpen(true)}
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              color: `${ORANGE}`,

              transform: "translateY(-50%)",
              cursor: "pointer",
            }}
          >
            <ChevronDown size={20} />
          </span>
        </div>

        {searchBarIsOpen && filteredOptions.length > 0 && (
          <div
            style={{
              position: "absolute",
              zIndex: 10,
              minWidth: 160,
              width: "100%",
              background: "#fff",
              border: `1px solid ${ORANGE}`,
              borderRadius: 16,
              maxHeight: 200,
              overflowY: "auto",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              marginTop: 4,
            }}
          >
            <ul ref={optionsListRef}>
              {filteredOptions.map((option, index) => {
                const optionLabel = renderOptionLabel(option);
                const startIndex = optionLabel
                  .toLowerCase()
                  .indexOf((value || searchTerm).toLowerCase());
                const endIndex = startIndex + (value || searchTerm).length;

                // ✅ Agrega estas dos líneas
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
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: 14,
                      color: COLOR_TEXTO,
                      background: isHighlighted
                        ? "#fffaef"
                        : isSelected
                        ? "#f6f6f6"
                        : "transparent",
                      fontFamily: "Lato, sans-serif",
                    }}
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
            No se encontraron resultados
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
    </div>
  );
};

export default SelectConSearch;
