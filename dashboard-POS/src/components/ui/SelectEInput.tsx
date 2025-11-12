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

interface SelectEInputProps {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  errorMessage?: string;
  onCreate?: (value: string) => void;
  disabled?: boolean;
}

const SelectEInput: React.FC<SelectEInputProps> = ({
  label,
  options,
  placeholder = "Buscar...",
  value,
  onBlur,
  onChange,
  error = false,
  errorMessage = "Campo requerido",
  onCreate,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [searchBarIsOpen, setSearchBarIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const optionsListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

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
        .includes(searchTerm.toLowerCase()),
    }))
    .filter((item) => item.match)
    .map((item) => item.option);

  const handleSelectOption = (option: SelectOption) => {
    if (disabled) return;
    const selectedValue = renderOptionLabel(option);
    setSearchTerm(selectedValue);
    onChange(selectedValue);
    setSearchBarIsOpen(false);
    setHighlightedIndex(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const inputValue = e.target.value;
    setSearchTerm(inputValue);
    onChange(inputValue);
    setSearchBarIsOpen(true);
    setHighlightedIndex(null);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setSearchBarIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchBarIsOpen || disabled) return;

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    if (!disabled) setSearchBarIsOpen(true);
  };

  return (
    <div className={`${label ? "mt-4" : ""}`}>
      {label && (
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
      )}

      <div ref={ref} className="relative">
        <div className="relative">
          <input
            type="text"
            autoComplete="new-password"
            disabled={disabled}
            style={{
              height: 40,
              padding: "0 16px",
              border: `1px solid ${
                error ? COLOR_ERROR : disabled ? "#A0AEC0" : ORANGE
              }`,
              borderRadius: 25,
              fontSize: 14,
              color: disabled ? "#A0AEC0" : COLOR_TEXTO,
              width: "100%",
              backgroundColor: disabled ? "#EDF2F7" : COLOR_INPUT_BG,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              cursor: disabled ? "not-allowed" : "pointer",
              boxSizing: "border-box",
              fontFamily: "Lato, sans-serif",
            }}
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onClick={() => !disabled && setSearchBarIsOpen(true)}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
          />

          <span
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              color: disabled ? "#A0AEC0" : ORANGE,
              transform: "translateY(-50%)",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            onClick={() => !disabled && setSearchBarIsOpen(true)}
          >
            <ChevronDown size={20} />
          </span>
        </div>

        {searchBarIsOpen && filteredOptions.length > 0 && !disabled && (
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
                const isHighlighted = highlightedIndex === index;
                const isSelected = optionLabel === searchTerm;

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
                    {optionLabel}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
    </div>
  );
};

export default SelectEInput;
