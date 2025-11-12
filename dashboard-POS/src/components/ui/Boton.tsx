import React from "react";

interface BotonRestauranteProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variacion?: "default" | "claro" | "verde";
}

const BotonRestaurante: React.FC<BotonRestauranteProps> = ({
  label,
  variacion = "default",
  className = "",
  ...props
}) => {
  const baseClasses =
    "h-10 px-4 font-medium rounded-full text-sm cursor-pointer shadow-md transition-all duration-300";

  const clasesVariacion =
    variacion === "claro"
      ? "bg-white text-orange-500 border border-orange-500 hover:bg-orange-50"
      : variacion === "verde"
      ? "bg-green-500 text-white hover:bg-green-600"
      : "bg-orange-500 text-white hover:bg-orange-600";

  return (
    <button
      className={`${baseClasses} ${clasesVariacion} ${className}`}
      {...props}
    >
      {label}
    </button>
  );
};

export default BotonRestaurante;
