import { useClienteStore } from "@/stores/clienteStore";
import { Division, DivisionErrors } from "./DivisionCards";
import { useEffect, useState } from "react";
import Checkbox from "@/components/ui/CheckBox";
import InputField from "@/components/ui/InputField";
import SimpleSelect from "@/components/ui/SimpleSelect";
import SelectEInput from "@/components/ui/SelectEInput";
import { set } from "react-hook-form";

export interface DivisionCommonInfoProps {
  division: Division;
  disabled?: boolean;
  errors: DivisionErrors;
  onUpdate: (upd: Partial<Division>) => void;
}

export const DivisionCommonInfo: React.FC<DivisionCommonInfoProps> = ({
  division,
  errors,
  disabled = false,
  onUpdate,
}) => {
  const { traerTiposDeDocumento, tiposDocumentos, clientes } =
    useClienteStore();
  const [clienteGenericoChecked, setClienteGenericoChecked] = useState(true);
  const [consumidorFinalChecked, setConsumidorFinalChecked] = useState(false);
  const [personalizada, setPersonalizada] = useState(false);

  useEffect(() => {
    traerTiposDeDocumento();
  }, []);

  useEffect(() => {
    if (division.cedula === "111111111111") {
      setClienteGenericoChecked(true);
      setConsumidorFinalChecked(false);
      setPersonalizada(false);
    } else if (division.cedula === "222222222222") {
      setClienteGenericoChecked(false);
      setConsumidorFinalChecked(true);
      setPersonalizada(false);
    } else {
      setClienteGenericoChecked(false);
      setConsumidorFinalChecked(false);
      setPersonalizada(true);
    }
  }, [division]);

  const {
    cedula = "",
    name = "",
    docType = "",
    correo = "",
    DV = "",
    electronica = false,
  } = division;

  const limpiarCampos = () => {
    onUpdate({
      cedula: "",
      docType: "",
      name: "",
      correo: "",
    });
  };

  const handleClienteGenericoChange = () => {
    setClienteGenericoChecked(true);
    setConsumidorFinalChecked(false);
    setPersonalizada(false);

    onUpdate({
      electronica: false,
      cedula: "111111111111",
      docType: "Cédula de ciudadanía",
      name: "Cliente Genérico",
      correo: "pruebas@ejemplo.com",
    });
  };

  const handleConsumidorFinalChange = () => {
    setConsumidorFinalChecked(true);
    setPersonalizada(false);
    setClienteGenericoChecked(false);
    onUpdate({ electronica: true });
    onUpdate({
      electronica: true,
      cedula: "222222222222",
      docType: "Cédula de ciudadanía",
      name: "Consumidor Final",
      correo: "no_aplica@ejemplo.com",
    });
  };

  const handlePersonalizadaChange = () => {
    setPersonalizada(true);
    setClienteGenericoChecked(false);
    setConsumidorFinalChecked(false);

    onUpdate({ electronica: true });
    limpiarCampos();
  };

  return (
    <>
      <div
        style={{
          marginTop: 10,
          marginBottom: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <Checkbox
          label="Cliente Genérico"
          disabled={disabled}
          checked={clienteGenericoChecked}
          onChange={handleClienteGenericoChange}
        />
        <Checkbox
          label="Consumidor Final"
          disabled={disabled}
          checked={consumidorFinalChecked}
          onChange={handleConsumidorFinalChange}
        />
        <Checkbox
          label="Factura Personalizada"
          disabled={disabled}
          checked={personalizada}
          onChange={handlePersonalizadaChange}
        />
      </div>

      <InputField
        label="Numero de documento"
        name="cedula"
        type="number"
        disabled={clienteGenericoChecked || consumidorFinalChecked || disabled}
        value={cedula}
        onChange={(e) => onUpdate({ cedula: e.target.value })}
        placeholder="Ingrese la cédula"
        error={errors.cedula}
      />

      <SimpleSelect
        label="Tipo De Documento"
        options={tiposDocumentos}
        placeholder="Seleccione una opción"
        width="100%"
        value={docType}
        onChange={(val) => onUpdate({ docType: val })}
        error={errors.docType}
        disabled={clienteGenericoChecked || consumidorFinalChecked || disabled}
      />

      <SelectEInput
        label="Nombre"
        options={clientes}
        placeholder="Seleccione una opción"
        value={name}
        disabled={clienteGenericoChecked || consumidorFinalChecked || disabled}
        onChange={(e) => onUpdate({ name: e })}
        error={errors.name}
      />

      <InputField
        label="Correo"
        name="correo"
        disabled={clienteGenericoChecked || consumidorFinalChecked || disabled}
        value={correo}
        onChange={(e) => onUpdate({ correo: e.target.value })}
        placeholder="Ingrese el correo"
        error={errors.correo}
      />
      <InputField
        label="DV"
        name="DV"
        disabled={clienteGenericoChecked || consumidorFinalChecked || disabled}
        value={DV}
        onChange={(e) => onUpdate({ DV: e.target.value })}
        error={errors.DV}
      />
      <Checkbox
        label="Factura Electronica"
        disabled={true}
        checked={electronica}
        onChange={(e) => onUpdate({ electronica: e })}
      />
    </>
  );
};
