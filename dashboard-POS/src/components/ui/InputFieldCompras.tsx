import { COLOR_INPUT_BG, ORANGE } from "@/styles/colors";
import React, { useEffect } from "react";

interface InputFieldComprasProps {
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
}

const InputFieldCompras: React.FC<InputFieldComprasProps> = ({
  label,
  name,
  value,
  onFocus,
  onChange,
  placeholder = "Ingrese...", // Placeholder más corto
  error = false,
  readOnly = false,
  type = "text",
  disabled = false,
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

  return (
    <div style={{ width: "100%" }}> {/* Eliminado el margin-bottom */}
      {/* Eliminada la etiqueta <label> para que la tabla se vea limpia */}
      <input
        type={type}
        name={name}
        onFocus={onFocus}
        placeholder={readOnly ? "" : placeholder}
        value={value}
        onChange={readOnly ? undefined : onChange}
        readOnly={readOnly}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "14px 18px",
          border: "none", // Eliminado el borde para que el input se "funda" con la celda
          borderRadius: 0, // Eliminado el radio para que sea cuadrado
          fontSize: 15,
          fontFamily: "Lato, sans-serif",
          color: readOnly ? "#A0AEC0" : "#2A2A2A",
          backgroundColor: readOnly ? "#EDF2F7" : "white", // Fondo blanco para que se fusione con la celda de la tabla
          boxSizing: "border-box",
          boxShadow: "none", // Eliminado el sombreado
          cursor: readOnly ? "not-allowed" : "text",
          outline: "none",
        }}
      />
      {/* Puedes mantener el mensaje de error si lo consideras necesario */}
      {error && (
        <p
          style={{
            color: "#f56565",
            fontSize: 13,
            marginTop: 6,
            fontFamily: "Lato, sans-serif",
          }}
        >
          El campo es obligatorio.
        </p>
      )}
    </div>
  );
};

export default InputFieldCompras;