import React from "react";
import InputField from "@/components/ui/InputField";
export type IDataOpcional = {
  direccion: string;
  telefono: string;
  // dv: string;
  nota: string;
};
export interface DatosOpcionalesProps {
  division: IDataOpcional;
  onUpdate: (upd: Partial<IDataOpcional>) => void;
}
export const DatosOpcionales: React.FC<DatosOpcionalesProps> = ({
  division,
  onUpdate,
}) => {
  const { direccion = "", telefono = "", nota = "" } = division;
  return (
    <>
      <InputField
        label="Direccion"
        value={direccion}
        onChange={(e) => onUpdate({ direccion: e.target.value })}
      />
      <InputField
        label="Telefono"
        type="number"
        value={telefono}
        onChange={(e) => onUpdate({ telefono: e.target.value })}
      />
      <InputField
        label="Nota"
        value={nota}
        onChange={(e) => onUpdate({ nota: e.target.value })}
      />
    </>
  );
};
