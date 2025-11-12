import React, { useEffect, useState } from 'react';
import InputField from './ui/InputField';
import SimpleSelect from './ui/SimpleSelect';
import Checkbox from './ui/CheckBox';
import { Division, DivisionErrors } from '../features/pagar/DivisionCards';
import { useClienteStore } from '@/stores/clienteStore';

export interface DivisionCommonInfoProps {
  division: Division;
  errors: DivisionErrors;
  onUpdate: (upd: Partial<Division>) => void;
}

export const DivisionCommonInfo: React.FC<DivisionCommonInfoProps> = ({
  division,
  errors,
  onUpdate,
}) => {
  const { traerTiposDeDocumento, tiposDocumentos, fetchExternalClientInfo } = useClienteStore();

  const [clienteGenericoChecked, setClienteGenericoChecked] = useState(false);
  const [consumidorFinalChecked, setConsumidorFinalChecked] = useState(false);

  useEffect(() => {
    traerTiposDeDocumento();
  }, []);

  const { cedula = '', name = '', docType = '', correo = '', electronica = false } = division;

  const handleClienteGenericoChange = (checked: boolean) => {
    setClienteGenericoChecked(checked);
    if (checked) {
      setConsumidorFinalChecked(false);
      onUpdate({
        cedula: '111111111111',
        docType: 'Cédula de ciudadanía', 
        name: 'Cliente Genérico',
        correo: 'pruebas@ejemplo.com',
      });
    } else {
      onUpdate({
        cedula: '',
        docType: '',
        name: '',
        correo: '',
      });
    }
  };

  const handleConsumidorFinalChange = (checked: boolean) => {
    setConsumidorFinalChecked(checked);
    if (checked) {
      setClienteGenericoChecked(false);
      onUpdate({
        cedula: '222222222222',
        docType: 'Cédula de ciudadanía', 
        name: 'Consumidor Final',
        correo: 'no_aplica@ejemplo.com',
      });
    } else {
      onUpdate({
        cedula: '',
        docType: '',
        name: '',
        correo: '',
      });
    }
  };
  
  const isAnyCheckboxChecked = clienteGenericoChecked || consumidorFinalChecked;

  useEffect(() => {
    if (isAnyCheckboxChecked) {
      return;
    }

    if (docType && cedula && cedula.length > 5) {
      const searchClient = async () => {
        const clienteInfo = await fetchExternalClientInfo(docType, cedula);
        // Aquí está la solución: solo actualiza si el nombre es diferente
        if (clienteInfo && clienteInfo.nombre && clienteInfo.nombre !== name) {
          onUpdate({ name: clienteInfo.nombre });
        }
      };
      searchClient();
    }
  }, [docType, cedula, name, isAnyCheckboxChecked, fetchExternalClientInfo, onUpdate]);

  return (
    <>
      <Checkbox
        label="Cliente Genérico"
        checked={clienteGenericoChecked}
        onChange={handleClienteGenericoChange}
      />
      <Checkbox
        label="Consumidor Final"
        checked={consumidorFinalChecked}
        onChange={handleConsumidorFinalChange}
      />

      <InputField
        label="Numero de documento"
        name="cedula"
        type="number"
        value={cedula}
        onChange={(e) => onUpdate({ cedula: e.target.value })}
        placeholder="Ingrese la cédula"
        error={errors.cedula}
        disabled={isAnyCheckboxChecked}
      />
      <SimpleSelect
        label="Tipo De Documento"
        options={tiposDocumentos}
        placeholder="Seleccione una opción"
        width="100%"
        value={docType}
        onChange={(val) => onUpdate({ docType: val })}
        error={errors.docType}
        disabled={isAnyCheckboxChecked}
      />

      <InputField
        label="Nombre"
        name="name"
        value={name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Ingrese el Nombre"
        error={errors.name}
        disabled={isAnyCheckboxChecked}
      />

      <InputField
        label="Correo"
        name="correo"
        value={correo}
        onChange={(e) => onUpdate({ correo: e.target.value })}
        placeholder="Ingrese el correo"
        error={errors.correo}
        disabled={isAnyCheckboxChecked}
      />

      <Checkbox
        label="Factura Electrónica"
        checked={electronica}
        onChange={(checked) => onUpdate({ electronica: checked })}
      />
    </>
  );
};






// import React, { useEffect, useState } from 'react';
// import InputField from './ui/InputField';
// import SimpleSelect from './ui/SimpleSelect';
// import Checkbox from './ui/CheckBox';
// import { Division, DivisionErrors } from '../features/pagar/DivisionCards';
// import { useClienteStore } from '@/stores/clienteStore';

// export interface DivisionCommonInfoProps {
//   division: Division;
//   errors: DivisionErrors;
//   onUpdate: (upd: Partial<Division>) => void;
// }

// export const DivisionCommonInfo: React.FC<DivisionCommonInfoProps> = ({
//   division,
//   errors,
//   onUpdate,
// }) => {
//   const { traerTiposDeDocumento, tiposDocumentos } = useClienteStore();

//   const [clienteGenericoChecked, setClienteGenericoChecked] = useState(false);
//   const [consumidorFinalChecked, setConsumidorFinalChecked] = useState(false);

//   useEffect(() => {
//     traerTiposDeDocumento();
//   }, []);

//   const { cedula = '', name = '', docType = '', correo = '', electronica = false } = division;

//   const handleClienteGenericoChange = (checked: boolean) => {
//     setClienteGenericoChecked(checked);
//     if (checked) {
//       setConsumidorFinalChecked(false);
//       onUpdate({
//         cedula: '111111111111',
//         docType: 'Cédula de ciudadanía', 
//         name: 'Cliente Genérico',
//         correo: 'pruebas@ejemplo.com',
//       });
//     } else {
//       onUpdate({
//         cedula: '',
//         docType: '',
//         name: '',
//         correo: '',
//       });
//     }
//   };

//   const handleConsumidorFinalChange = (checked: boolean) => {
//     setConsumidorFinalChecked(checked);
//     if (checked) {
//       setClienteGenericoChecked(false);
//       onUpdate({
//         cedula: '222222222222',
//         docType: 'Cédula de ciudadanía', 
//         name: 'Consumidor Final',
//         correo: 'no_aplica@ejemplo.com',
//       });
//     } else {
//       onUpdate({
//         cedula: '',
//         docType: '',
//         name: '',
//         correo: '',
//       });
//     }
//   };
  
//   const isAnyCheckboxChecked = clienteGenericoChecked || consumidorFinalChecked;

//   return (
//     <>
//       <Checkbox
//         label="Cliente Genérico"
//         checked={clienteGenericoChecked}
//         onChange={handleClienteGenericoChange}
//       />
//       <Checkbox
//         label="Consumidor Final"
//         checked={consumidorFinalChecked}
//         onChange={handleConsumidorFinalChange}
//       />

//       <InputField
//         label="Numero de documento"
//         name="cedula"
//         type="number"
//         value={cedula}
//         onChange={(e) => onUpdate({ cedula: e.target.value })}
//         placeholder="Ingrese la cédula"
//         error={errors.cedula}
//         disabled={isAnyCheckboxChecked}
//       />
//       <SimpleSelect
//         label="Tipo De Documento"
//         options={tiposDocumentos}
//         placeholder="Seleccione una opción"
//         width="100%"
//         value={docType}
//         onChange={(val) => onUpdate({ docType: val })}
//         error={errors.docType}
//         disabled={isAnyCheckboxChecked}
//       />

//       <InputField
//         label="Nombre"
//         name="name"
//         value={name}
//         onChange={(e) => onUpdate({ name: e.target.value })}
//         placeholder="Ingrese el Nombre"
//         error={errors.name}
//         disabled={isAnyCheckboxChecked}
//       />

//       <InputField
//         label="Correo"
//         name="correo"
//         value={correo}
//         onChange={(e) => onUpdate({ correo: e.target.value })}
//         placeholder="Ingrese el correo"
//         error={errors.correo}
//         disabled={isAnyCheckboxChecked}
//       />

//       <Checkbox
//         label="Factura Electrónica"
//         checked={electronica}
//         onChange={(checked) => onUpdate({ electronica: checked })}
//       />
//     </>
//   );
// };

