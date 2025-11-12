import React from "react";
import { FONDO, ORANGE } from "../../styles/colors";

const baseStyle: React.CSSProperties = {
  height: 40,
  padding: "8px 16px",
  fontWeight: 500,
  borderRadius: 25,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
};

interface BotonRestauranteProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variacion?: "default" | "claro";
}

const BotonRestaurante: React.FC<BotonRestauranteProps> = ({
  label,
  variacion = "default",
  ...props
}) => {
  const style: React.CSSProperties = {
    ...baseStyle,
    ...(variacion === "claro"
      ? {
          backgroundColor: FONDO,
          color: ORANGE,
          border: `1px solid ${ORANGE}`,
        }
      : {
          backgroundColor: ORANGE,
          color: "#ffffff",
          border: "none",
        }),
  };

  return (
    <button style={style} {...props}>
      {label}
    </button>
  );
};

export default BotonRestaurante;
