import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { COLOR_INPUT_BG, ORANGE, COLOR_ERROR } from "@/styles/colors";

type SimpleSelectOption =
  | string
  | number
  | { id: string; nombre: string }
  | { id: number; nombre: string }
  | { label: string; value: string };

interface SimpleSelectProps {
  options: SimpleSelectOption[];
  label: string;
  placeholder?: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: boolean;
  errorMessage?: string;
  width?: string | number;
  height?: number | string;
  disabled?: boolean;
}

const SimpleSelect: React.FC<SimpleSelectProps> = ({
  options,
  placeholder = "Buscar...",
  value,
  label,
  onChange,
  error = false,
  width = "100%",
  height = 40,
  errorMessage = "El campo es obligatorio",
  disabled = false,
}) => {
  const [searchBarIsOpen, setSearchBarIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const optionsListRef = useRef<HTMLUListElement>(null);

  const handleSelectOption = (option: SimpleSelectOption) => {
    if (disabled) return; 
    const selectedValue =
      typeof option === "string"
        ? option
        : typeof option === "number"
        ? option.toString()
        : "id" in option
        ? option.id
        : option.value;

    onChange(String(selectedValue));
    setSearchBarIsOpen(false);
    setHighlightedIndex(null);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setSearchBarIsOpen(false);
      setHighlightedIndex(null);
    }
  };

  const handleGlobalFocus = (event: FocusEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setSearchBarIsOpen(false);
      setHighlightedIndex(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || !searchBarIsOpen) return;
    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) =>
        prev === null || prev === options.length - 1 ? 0 : prev + 1
      );
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) =>
        prev === null || prev === 0 ? options.length - 1 : prev - 1
      );
    } else if (e.key === "Enter" && highlightedIndex !== null) {
      handleSelectOption(options[highlightedIndex]);
    }
  };

  const handleInputClick = () => {
    if (!disabled) { 
      setSearchBarIsOpen(true);
    }
  };
  
  const handleInputFocus = () => {
    if (!disabled) { 
      if (!searchBarIsOpen) setSearchBarIsOpen(true);
      const currentIndex = options.findIndex((option) => {
        const val = value.toString();
        if (typeof option === "string" || typeof option === "number") {
          return option.toString() === val;
        } else if ("id" in option) {
          return option.id.toString() === val;
        }
        return option.value === val;
      });
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.addEventListener("focusin", handleGlobalFocus);
    return () => document.removeEventListener("focusin", handleGlobalFocus);
  }, []);

  useEffect(() => {
    if (highlightedIndex !== null && optionsListRef.current) {
      const optionEl = optionsListRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      optionEl?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const renderOptionLabel = (option: SimpleSelectOption) =>
    typeof option === "string"
      ? option
      : typeof option === "number"
      ? option.toString()
      : "nombre" in option
      ? option.nombre
      : option.label;

  const currentOption = options.find((option) => {
    const val = value.toString();
    if (typeof option === "string" || typeof option === "number") {
      return option.toString() === val;
    } else if ("id" in option) {
      return option.id.toString() === val;
    }
    return option.value === val;
  });
  const COLOR_TEXTO = "#2A2A2A";

  return (
    <div style={{ width: width, marginBottom: 15 }}>
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
      <div ref={ref} style={{ position: "relative", marginTop: 12 }}>
        <input
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={currentOption ? renderOptionLabel(currentOption) : ""}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          readOnly
          disabled={disabled}
          style={{
            height,
            padding: "0 16px",
            border: `1px solid ${disabled ? "#A0AEC0" : error ? COLOR_ERROR : ORANGE}`,
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
        />
        <span
          onClick={handleInputClick}
          style={{
            position: "absolute",
            color: disabled ? "#A0AEC0" : ORANGE,
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <ChevronDown size={20} />
        </span>

        {searchBarIsOpen && !disabled && (
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
            <ul
              ref={optionsListRef}
              style={{ listStyle: "none", margin: 0, padding: 0 }}
            >
              {options.map((option, idx) => {
                const isSelected = currentOption === option;
                const isHighlighted = highlightedIndex === idx;
                return (
                  <li
                    key={idx}
                    onClick={() => handleSelectOption(option)}
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
                  >
                    {renderOptionLabel(option)}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      {error && (
        <span
          style={{
            color: "#f56565",
            fontSize: 12,
            marginTop: 4,
            display: "block",
          }}
        >
          {errorMessage}
        </span>
      )}
    </div>
  );
};

export default SimpleSelect;

// import React, { useState, useRef, useEffect } from "react";
// import { ChevronDown } from "lucide-react";
// import { COLOR_INPUT_BG, ORANGE, COLOR_ERROR } from "@/styles/colors";

// type SimpleSelectOption =
//   | string
//   | number
//   | { id: string; nombre: string }
//   | { id: number; nombre: string }
//   | { label: string; value: string };

// interface SimpleSelectProps {
//   options: SimpleSelectOption[];
//   label: string;
//   placeholder?: string;
//   value: string | number;
//   onChange: (value: string) => void;
//   error?: boolean;
//   errorMessage?: string;
//   width?: string | number;
//   height?: number | string;
//   disabled?: boolean;
// }

// const SimpleSelect: React.FC<SimpleSelectProps> = ({
//   options,
//   placeholder = "Buscar...",
//   value,
//   label,
//   onChange,
//   error = false,
//   width = "100%",
//   height = 40,
//   errorMessage = "El campo es obligatorio",
//   disabled = false, 
// }) => {
//   const [searchBarIsOpen, setSearchBarIsOpen] = useState(false);
//   const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
//   const ref = useRef<HTMLDivElement>(null);
//   const optionsListRef = useRef<HTMLUListElement>(null);

//   const handleSelectOption = (option: SimpleSelectOption) => {
//     const selectedValue =
//       typeof option === "string"
//         ? option
//         : typeof option === "number"
//         ? option.toString()
//         : "id" in option
//         ? option.id
//         : option.value;

//     onChange(String(selectedValue));
//     setSearchBarIsOpen(false);
//     setHighlightedIndex(null);
//   };

//   const handleClickOutside = (event: MouseEvent) => {
//     if (ref.current && !ref.current.contains(event.target as Node)) {
//       setSearchBarIsOpen(false);
//       setHighlightedIndex(null);
//     }
//   };

//   const handleGlobalFocus = (event: FocusEvent) => {
//     if (ref.current && !ref.current.contains(event.target as Node)) {
//       setSearchBarIsOpen(false);
//       setHighlightedIndex(null);
//     }
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (!searchBarIsOpen) return;
//     if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
//       e.preventDefault();
//     }
//     if (e.key === "ArrowDown") {
//       setHighlightedIndex((prev) =>
//         prev === null || prev === options.length - 1 ? 0 : prev + 1
//       );
//     } else if (e.key === "ArrowUp") {
//       setHighlightedIndex((prev) =>
//         prev === null || prev === 0 ? options.length - 1 : prev - 1
//       );
//     } else if (e.key === "Enter" && highlightedIndex !== null) {
//       handleSelectOption(options[highlightedIndex]);
//     }
//   };

//   const handleInputFocus = () => {
//     if (!searchBarIsOpen) setSearchBarIsOpen(true);
//     const currentIndex = options.findIndex((option) => {
//       const val = value.toString();
//       if (typeof option === "string" || typeof option === "number") {
//         return option.toString() === val;
//       } else if ("id" in option) {
//         return option.id.toString() === val;
//       }
//       return option.value === val;
//     });
//     setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
//   };

//   useEffect(() => {
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     document.addEventListener("focusin", handleGlobalFocus);
//     return () => document.removeEventListener("focusin", handleGlobalFocus);
//   }, []);

//   useEffect(() => {
//     if (highlightedIndex !== null && optionsListRef.current) {
//       const optionEl = optionsListRef.current.children[
//         highlightedIndex
//       ] as HTMLElement;
//       optionEl?.scrollIntoView({ block: "nearest" });
//     }
//   }, [highlightedIndex]);

//   const renderOptionLabel = (option: SimpleSelectOption) =>
//     typeof option === "string"
//       ? option
//       : typeof option === "number"
//       ? option.toString()
//       : "nombre" in option
//       ? option.nombre
//       : option.label;

//   const currentOption = options.find((option) => {
//     const val = value.toString();
//     if (typeof option === "string" || typeof option === "number") {
//       return option.toString() === val;
//     } else if ("id" in option) {
//       return option.id.toString() === val;
//     }
//     return option.value === val;
//   });
//   const COLOR_TEXTO = "#2A2A2A";

//   return (
//     <div style={{ width: width, marginBottom: 15 }}>
//       <label
//         style={{
//           display: "block",
//           fontSize: 16,
//           fontWeight: 500,
//           fontFamily: "Lato, sans-serif",
//           color: "#555",
//           marginBottom: 8,
//         }}
//       >
//         {label}
//         <span
//           style={{
//             color: "#f56565",
//             marginLeft: 4,
//             visibility: error ? "visible" : "hidden",
//           }}
//         >
//           *
//         </span>
//       </label>
//       <div ref={ref} style={{ position: "relative", marginTop: 12 }}>
//         <input
//           type="text"
//           autoComplete="off"
//           placeholder={placeholder}
//           value={currentOption ? renderOptionLabel(currentOption) : ""}
//           onClick={() => setSearchBarIsOpen(true)}
//           onFocus={handleInputFocus}
//           onKeyDown={handleKeyDown}
//           readOnly
//           disabled={disabled} 
//           style={{
//             height,
//             padding: "0 16px",
//             border: `1px solid ${error ? COLOR_ERROR : ORANGE}`,
//             borderRadius: 25,
//             fontSize: 14,
//             color: COLOR_TEXTO,
//             width: "100%",
//             backgroundColor: COLOR_INPUT_BG,
//             boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
//             cursor: "pointer",
//             boxSizing: "border-box",
//             fontFamily: "Lato, sans-serif",
//           }}
//         />
//         <span
//           onClick={() => setSearchBarIsOpen(true)}
//           style={{
//             position: "absolute",
//             color: `${ORANGE}`,
//             right: 16,
//             top: "50%",
//             transform: "translateY(-50%)",
//             cursor: "pointer",
//           }}
//         >
//           <ChevronDown size={20} />
//         </span>

//         {searchBarIsOpen && (
//           <div
//             style={{
//               position: "absolute",
//               zIndex: 10,
//               minWidth: 160,
//               width: "100%",
//               background: "#fff",
//               border: `1px solid ${ORANGE}`,
//               borderRadius: 16,
//               maxHeight: 200,
//               overflowY: "auto",
//               boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//               marginTop: 4,
//             }}
//           >
//             <ul
//               ref={optionsListRef}
//               style={{ listStyle: "none", margin: 0, padding: 0 }}
//             >
//               {options.map((option, idx) => {
//                 const isSelected = currentOption === option;
//                 const isHighlighted = highlightedIndex === idx;
//                 return (
//                   <li
//                     key={idx}
//                     onClick={() => handleSelectOption(option)}
//                     style={{
//                       padding: "10px 16px",
//                       cursor: "pointer",
//                       fontSize: 14,
//                       color: COLOR_TEXTO,
//                       background: isHighlighted
//                         ? "#fffaef"
//                         : isSelected
//                         ? "#f6f6f6"
//                         : "transparent",
//                       fontFamily: "Lato, sans-serif",
//                     }}
//                   >
//                     {renderOptionLabel(option)}
//                   </li>
//                 );
//               })}
//             </ul>
//           </div>
//         )}
//       </div>
//       {error && (
//         <span
//           style={{
//             color: "#f56565",
//             fontSize: 12,
//             marginTop: 4,
//             display: "block",
//           }}
//         >
//           {errorMessage}
//         </span>
//       )}
//     </div>
//   );
// };

// export default SimpleSelect;
