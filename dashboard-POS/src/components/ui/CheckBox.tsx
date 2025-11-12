// Checkbox.tsx
import React from "react";

interface CheckboxProps {
  label?: string;
  disabled?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
  borderColor?: string; // Nuevo: Color del borde del checkbox
  checkedBgColor?: string; // Nuevo: Color de fondo cuando está marcado
  dotColor?: string; // Nuevo: Color del punto interior
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  disabled,
  onChange,
  borderColor = "#ed4e05",
  dotColor = "#ed4e05",
}) => {
  const labelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "16px",
    color: "#333",
  };

  const hiddenInputStyle: React.CSSProperties = {
    position: "absolute",
    opacity: 0,
    width: 0,
    height: 0,
    overflow: "hidden",
    pointerEvents: "none",
  };

  const customCheckboxOuterStyle: React.CSSProperties = {
    width: "20px",
    height: "20px",
    border: `2px solid ${borderColor}`,
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    transition: "border-color 0.2s ease-in-out",
  };

  const customCheckboxInnerDotStyle: React.CSSProperties = {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: dotColor,
    transform: checked ? "scale(1)" : "scale(0)",
    transition: "transform 0.2s ease-in-out",
  };

  const textLabelStyle: React.CSSProperties = {
    fontSize: 14,
    marginLeft: "10px",
    color: "#555",
    fontFamily: "Lato, sans-serif",
  };

  return (
    <label style={labelStyle}>
      <input
        type="checkbox"
        disabled={disabled ? true : false}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={hiddenInputStyle}
      />
      <span style={customCheckboxOuterStyle}>
        <span style={customCheckboxInnerDotStyle}></span>
      </span>
      <span style={textLabelStyle}>{label}</span>
    </label>
  );
};

export default Checkbox;
