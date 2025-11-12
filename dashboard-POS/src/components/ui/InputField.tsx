import { COLOR_INPUT_BG, ORANGE } from "@/styles/colors";
import React, { useEffect } from "react";

interface InputFieldProps {
  label: string;
  name?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: boolean;
  readOnly?: boolean;
  type?: HTMLInputElement["type"];
  disabled?: boolean;
  max?: string;
  min?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onFocus,
  onChange,
  placeholder = "Ingrese los datos",
  error = false,
  readOnly = false,
  type = "text",
  disabled = false,
  max,
  min,
}) => {
  // Bloquear scroll en input tipo number
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const active = document.activeElement as HTMLInputElement | null;
      if (active && active.type === "number" && !event.shiftKey) {
        event.preventDefault();
        active.blur();
      }
    };
    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // ✅ Unificamos el estilo de "readOnly" y "disabled"
  const isInactive = readOnly || disabled;

  return (
    <div style={{ width: "100%", marginBottom: 15 }}>
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
            color: ORANGE,
            marginLeft: 6,
            visibility: error ? "visible" : "hidden",
          }}
        >
          *
        </span>
      </label>

      <input
        type={type}
        name={name}
        onFocus={onFocus}
        placeholder={isInactive ? "" : placeholder}
        value={value}
        onChange={isInactive ? undefined : onChange}
        readOnly={readOnly}
        disabled={disabled}
        max={max}
        min={min}
        style={{
          width: "100%",
          height: 42,
          padding: "0 16px",
          border: `1px solid ${
            isInactive ? "#A0AEC0" : error ? "#f56565" : ORANGE
          }`,
          borderRadius: 25,
          fontSize: 14,
          fontFamily: "Lato, sans-serif",
          color: isInactive ? "#A0AEC0" : "#2A2A2A",
          backgroundColor: isInactive ? "#EDF2F7" : COLOR_INPUT_BG,
          boxSizing: "border-box",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          cursor: isInactive ? "not-allowed" : "text",
          outline: "none",
        }}
      />

      {error && (
        <p
          style={{
            color: "#f56565",
            fontSize: 12,
            marginTop: 4,
            fontFamily: "Lato, sans-serif",
          }}
        >
          El campo es obligatorio.
        </p>
      )}
    </div>
  );
};

export default InputField;
