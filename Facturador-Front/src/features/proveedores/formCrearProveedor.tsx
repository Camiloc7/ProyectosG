// import React, { useState, useEffect } from 'react';
// import {
//   validateSeleccionMultiple,
//   validateEntradasNumericas,
//   validateTextos,
// } from '../../app/gestionDeFacturasElectronicas/validations';
// import SimpleSelect from '@/components/ui/SimpleSelect';
// import { useRegionesStore } from '@/store/useRegionesStore';
// import { useProveedorStore } from '@/store/useProveedorStore';
// import SelectConSearch from '@/components/ui/selectConSearch';
// import { InfoProveedor } from '@/types/types';
// import InputField from '@/components/ui/InputField';
// import { useDatosExtraStore } from '@/store/useDatosExtraStore';

// const notificaciones: string[] = ['No', 'Si'];

// interface ModalFormProps {
//   isOpen: boolean;
//   onClose: () => void;
//   proveedorExistente?: InfoProveedor | null;
// }

// interface Errors {
//   id: boolean;
//   nombre: boolean;
//   nit: boolean;
//   tipoDeDocumento: boolean;
//   direccion: boolean;
//   correo: boolean;
//   telefono: boolean;
//   ciudad: boolean;
//   FIC: boolean;
//   nombre1: boolean;
//   nombre2: boolean;
//   apellido1: boolean;
//   apellido2: boolean;
//   dv: boolean;
//   nombreE: boolean;
//   tipocuenta: boolean;
//   numeroc: boolean;
//   bancos: boolean;
// }

// const FormCrearProveedor: React.FC<ModalFormProps> = ({ isOpen, onClose, proveedorExistente = null }) => {
//   const {
//     paises,
//     municipios,
//     departamentos,
//     fetchRegiones,
//     loading: loadingRegiones,
//   } = useRegionesStore();
//   const {
//     createProveedor,
//     actualizarProveedor
//   } = useProveedorStore();

//   useEffect(() => {
//     fetchTiposDeDocumentos();
//     fetchRegiones();
//     fetchResponsabilidadesFiscales();
//   }, []);

//   const {
//     fetchTiposDeDocumentos,
//     fetchResponsabilidadesFiscales,
//     documentos,
//     responsabilidades,
//   } = useDatosExtraStore();

//   useEffect(() => {
//     if (proveedorExistente) {
//         //console.log('proveedor existente:', proveedorExistente);
//         setFormData(proveedorExistente);
//       }
//     }, [proveedorExistente]);

//   const [formData, setFormData] = useState<InfoProveedor>({
//     id: '',
//     nombre: '',
//     nit: '',
//     tipoDeDocumento: '',
//     direccion: '',
//     correo: '',
//     telefono: '',
//     ciudad: '',
//     FIC: '',
//     nombre1: '',
//     nombre2: '',
//     apellido1: '',
//     apellido2: '',
//     dv: '',
//     nombreE: '',
//     tipocuenta: '',
//     numeroc: '',
//     bancos: '',
//     notificacion: "Si"
//   });

//   const [errors, setErrors] = useState<Errors>({
//     id: false,
//     nombre: false,
//     nit: false,
//     tipoDeDocumento: false,
//     direccion: false,
//     correo: false,
//     telefono: false,
//     ciudad: false,
//     FIC: false,
//     nombre1: false,
//     nombre2: false,
//     apellido1: false,
//     apellido2: false,
//     dv: false,
//     nombreE: false,
//     tipocuenta: false,
//     numeroc: false,
//     bancos: false,
//   });

//   const handleChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
//     >
//   ) => {
//     const { name, value } = e.target;

//     // Actualizar datos del formulario
//     setFormData((prev) => ({ ...prev, [name]: value }));

//     // Validaciones mapeadas
//     const validators: Record<string, (value: string) => boolean> = {
//       nombre: validateTextos,
//       nit: validateEntradasNumericas,
//       tipoDeDocumento: validateSeleccionMultiple,
//       direccion: validateTextos,
//       correo: validateTextos,
//       telefono: validateTextos,
//       ciudad: validateTextos,
//       FIC: validateTextos,
//       nombre1: validateTextos,
//       nombre2: validateTextos,
//       apellido1: validateTextos,
//       apellido2: validateTextos,
//       dv: validateTextos,
//       nombreE: validateTextos,
//       tipocuenta: validateTextos,
//       numeroc: validateTextos,
//       bancos: validateTextos,
//     };

//     // Validar en tiempo real
//     if (validators[name]) {
//       setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
//     }
//   };

//   const handleSubmit = async (
//     event: React.MouseEvent<HTMLButtonElement>
//   ): Promise<void> => {
//     event.preventDefault();
//     const errorState = { ...errors };

//     Object.keys(errorState).forEach((key) => {
//       errorState[key as keyof Errors] = false;
//     });

//     const isNombreValid = validateTextos(formData.nombre);
//     const isNitValid = validateTextos(formData.nit);
//     const isTipoDeDocumentoValid = validateTextos(formData.tipoDeDocumento);
//     const isDireccionValid = validateTextos(formData.direccion);
//     const isCorreoValid = validateTextos(formData.correo);
//     const isTelefonoValid = validateTextos(formData.telefono);
//     const isCiudadValid = validateTextos(formData.ciudad);
//     const isFICValid = validateTextos(formData.FIC);
//     const isNombre1Valid = validateTextos(formData.nombre1);
//     const isNombre2Valid = validateTextos(formData.nombre2);
//     const isApellido1Valid = validateTextos(formData.apellido1);
//     const isApellido2Valid = validateTextos(formData.apellido2);
//     const isDvValid = validateTextos(formData.dv);
//     const isNombreEValid = validateTextos(formData.nombreE);
//     const isTipocuentaValid = validateTextos(formData.tipocuenta);
//     const isNumerocValid = validateTextos(formData.numeroc);
//     const isBancosValid = validateTextos(formData.bancos);

//     errorState.nombre = !isNombreValid;
//     errorState.nit = !isNitValid;
//     errorState.tipoDeDocumento = !isTipoDeDocumentoValid;
//     errorState.direccion = !isDireccionValid;
//     errorState.correo = !isCorreoValid;
//     errorState.telefono = !isTelefonoValid;
//     errorState.ciudad = !isCiudadValid;
//     errorState.FIC = !isFICValid;
//     errorState.nombre1 = !isNombre1Valid;
//     errorState.nombre2 = !isNombre2Valid;
//     errorState.apellido1 = !isApellido1Valid;
//     errorState.apellido2 = !isApellido2Valid;
//     errorState.dv = !isDvValid;
//     errorState.nombreE = !isNombreEValid;
//     errorState.tipocuenta = !isTipocuentaValid;
//     errorState.numeroc = !isNumerocValid;
//     errorState.bancos = !isBancosValid;

//     setErrors(errorState);

//     const hasErrors = Object.values(errorState).some((value) => value);

//     if (hasErrors) {
//       return;
//     }

//     //formData listo para enviar
//     //console.log("formData del formulario: ", formData);
//     if(proveedorExistente){
//       await actualizarProveedor(formData);
//     }else{
//       await createProveedor(formData);
//     }
//     setFormData({
//       id: '',
//       nombre: '',
//       nit: '',
//       tipoDeDocumento: '',
//       direccion: '',
//       correo: '',
//       telefono: '',
//       ciudad: '',
//       FIC: '',
//       nombre1: '',
//       nombre2: '',
//       apellido1: '',
//       apellido2: '',
//       dv: '',
//       nombreE: '',
//       tipocuenta: '',
//       numeroc: '',
//       bancos: '',
//       notificacion: "Si"
//     });

//     onClose();
//   };

//   const handleBackgroundClick = (
//     e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
//   ) => {
//     setFormData({
//       id: '',
//       nombre: '',
//       nit: '',
//       tipoDeDocumento: '',
//       direccion: '',
//       correo: '',
//       telefono: '',
//       ciudad: '',
//       FIC: '',
//       nombre1: '',
//       nombre2: '',
//       apellido1: '',
//       apellido2: '',
//       dv: '',
//       nombreE: '',
//       tipocuenta: '',
//       numeroc: '',
//       bancos: '',
//       notificacion: "Si"
//     });
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div
//       className="fixed inset-0 flex justify-center items-center z-[201]"
//       onClick={handleBackgroundClick} // Detecta clic en el fondo
//     >
//       <div className="fixed inset-0 flex justify-center items-center z-51 bg-black bg-opacity-50">
//         <div
//           className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
//           onClick={(e) => {
//             e.stopPropagation();
//           }}
//         >
//           <h2 className="text-xl font-bold mb-4">
//             {proveedorExistente ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
//           </h2>

//           <form autoComplete="off">
//             {/* Seccion de informacion de la empresa */}
//             <p className="mt-8 font-light text-sm text-[#00A7E1]">
//               Información Empresarial
//             </p>

//             {/* Proveedor */}
//             <InputField
//               label="Proveedor"
//               name="nombre"
//               value={formData.nombre}
//               error={errors.nombre}
//               onChange={handleChange}
//             />

//             {/* Nombre de la empresa */}
//             <InputField
//               label="Nombre de la empresa"
//               name="nombreE"
//               value={formData.nombreE}
//               error={errors.nombreE}
//               onChange={handleChange}
//             />

//             {/* Tipo de Documento */}
//             <div className="flex flex-col mt-4 w-full">
//               <label>
//                 Tipo de documento
//                 <span
//                   className={`text-red-500 ${
//                     errors.tipoDeDocumento ? '' : 'invisible'
//                   }`}
//                 >
//                   *
//                 </span>
//               </label>
//               <div className=" relative mt-4">
//                 {documentos ? (
//                   <SimpleSelect
//                     options={documentos}
//                     placeholder="Seleccione una opcion"
//                     width={'100%'}
//                     value={formData.tipoDeDocumento}
//                     onChange={(value) => {
//                       setFormData((prev) => ({
//                         ...prev,
//                         tipoDeDocumento: value,
//                       }));
//                       setErrors((prev) => ({
//                         ...prev,
//                         tipoDeDocumento: !value,
//                       }));
//                     }}
//                     error={errors.tipoDeDocumento}
//                   />
//                 ) : (
//                   ''
//                 )}
//               </div>
//             </div>

//             {/* NIT */}
//             <InputField
//               label="NIT"
//               name="nit"
//               value={formData.nit}
//               error={errors.nit}
//               onChange={handleChange}
//             />

//             {/* DV */}
//             <InputField
//               label="DV"
//               name="dv"
//               value={formData.dv}
//               error={errors.dv}
//               onChange={handleChange}
//             />

//             {/* Seccion de Informacion Personal */}
//             <p className="mt-8 font-light text-sm text-[#00A7E1]">
//               Informacion Personal
//             </p>

//             {/* Primer nombre */}
//             <InputField
//               label="Primer Nombre"
//               name="nombre1"
//               value={formData.nombre1}
//               error={errors.nombre1}
//               onChange={handleChange}
//             />

//             {/* Segundo nombre */}
//             <InputField
//               label="Segundo Nombre"
//               name="nombre2"
//               value={formData.nombre2}
//               error={errors.nombre2}
//               onChange={handleChange}
//             />

//             {/* Primer apellido */}
//             <InputField
//               label="Primer apellido"
//               name="apellido1"
//               value={formData.apellido1}
//               error={errors.apellido1}
//               onChange={handleChange}
//             />

//             {/* Segundo apellido */}
//             <InputField
//               label="Segundo apellido"
//               name="apellido2"
//               value={formData.apellido2}
//               error={errors.apellido2}
//               onChange={handleChange}
//             />

//             {/* Seccion de ubicacion */}
//             <p className="mt-8 font-light text-sm text-[#00A7E1]">Ubicacion</p>

//             {/* Dirección */}
//             <InputField
//               label="Direccion"
//               name="direccion"
//               value={formData.direccion}
//               error={errors.direccion}
//               onChange={handleChange}
//             />

//             {/* Municipios */}
//             <div className="flex flex-col">
//               {loadingRegiones ? (
//                 <div>Cargando municipios...</div>
//               ) : (
//                 <div className=" relative">
//                   <SelectConSearch
//                     label="Municipio"
//                     options={municipios}
//                     placeholder="Buscar un Municipio"
//                     value={formData.ciudad}
//                     onChange={(value) => {
//                       setFormData((prev) => ({ ...prev, ciudad: value }));
//                       setErrors((prev) => ({ ...prev, ciudad: !value }));
//                     }}
//                     error={errors.ciudad}
//                     errorMessage="Debes seleccionar un municipio"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Seccion de Contacto */}
//             <p className="mt-8 font-light text-sm text-[#00A7E1]">Contacto</p>

//             {/* Correo Electrónico */}
//             <InputField
//               label="Correo Electrónico"
//               name="correo"
//               value={formData.correo}
//               error={errors.correo}
//               onChange={handleChange}
//             />

//             {/* Teléfono */}
//             <InputField
//               label="Teléfono"
//               name="telefono"
//               value={formData.telefono}
//               error={errors.telefono}
//               onChange={handleChange}
//             />

//             {/* Notificaciones */}
//             <div className="flex flex-col mt-4 w-full">
//               <label>
//                 Notificaciones
//               </label>
//               <div className=" relative mt-4">
//                 <SimpleSelect
//                   options={notificaciones}
//                   placeholder="Seleccione una opcion"
//                   width={'100%'}
//                   value={formData.notificacion}
//                   onChange={(value) => {
//                     setFormData((prev) => ({
//                       ...prev,
//                       notificacion: value,
//                     }));
//                   }}
//                 />
//               </div>
//             </div>

//             {/* Seccion de Informacion Bancaria */}
//             <p className="mt-8 font-light text-sm text-[#00A7E1]">
//               Informacion Bancaria
//             </p>

//             {/* Tipo de cuenta */}
//             <InputField
//               label="Tipo de cuenta"
//               name="tipocuenta"
//               value={formData.tipocuenta}
//               error={errors.tipocuenta}
//               onChange={handleChange}
//             />

//             {/* Numero de cuenta */}
//             <InputField
//               label="Numero de cuenta"
//               name="numeroc"
//               value={formData.numeroc}
//               error={errors.numeroc}
//               onChange={handleChange}
//             />

//             {/* Bancos */}
//             <InputField
//               label="Banco"
//               name="bancos"
//               value={formData.bancos}
//               error={errors.bancos}
//               onChange={handleChange}
//             />

//             {/* FIC */}
//             <InputField
//               label="FIC"
//               name="FIC"
//               value={formData.FIC}
//               error={errors.FIC}
//               onChange={handleChange}
//             />

//             {/* Mensaje de error si es que hay */}
//             {Object.values(errors).includes(true) && (
//               <p className="text-red-500 text-sm flex justify-center mt-4">
//                 Debe llenar todos campos requeridos.
//               </p>
//             )}

//             {/* Botones cancelar y enviar */}
//             <div className="flex justify-end space-x-3 mt-8 ">
//               <button
//                 type="button"
//                 onClick={handleBackgroundClick}
//                 className="bg-[#333332] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-auto"
//               >
//                 Cancelar
//               </button>
//               <button
//                 type="submit"
//                 onClick={handleSubmit}
//                 className="bg-[#00A7E1] text-white w-24 h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1]"
//               >
//                 Guardar
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FormCrearProveedor;



// 'use client';

// import React, { useState, useEffect } from 'react';
// import {
//   validateSeleccionMultiple,
//   validateEntradasNumericas,
//   validateTextos,
// } from '../../app/gestionDeFacturasElectronicas/validations';
// import SimpleSelect from '@/components/ui/SimpleSelect';
// import { useRegionesStore } from '@/store/useRegionesStore'; // Mantener, ya que lo estás usando aquí
// import SelectConSearch from '@/components/ui/selectConSearch'; // Mantener
// import InputField from '@/components/ui/InputField';
// import { useDatosExtraStore } from '@/store/useDatosExtraStore';
// import { useSuppliersStore } from '@/store/Inventario/useSuppliersStore';
// import { Supplier } from '@/types/inventory'; // SupplierCategory no es necesario aquí si solo usas el ID
// import { Loader2 } from 'lucide-react';
// import { useSupplierCategoriesStore } from '@/store/Inventario/useSupplierCategories';
// import { showErrorToast, showTemporaryToast } from '@/components/feedback/toast';

// const notificacionesOpciones = [
//   { label: 'Si', value: 'true' }, // Cambiado a string para SimpleSelect
//   { label: 'No', value: 'false' }, // Cambiado a string para SimpleSelect
// ];

// interface ModalFormProps {
//   isOpen: boolean;
//   onClose: () => void;
//   proveedorExistente?: Supplier | null;
//   defaultCategoryId?: string;
// }

// // Interfaz de errores actualizada para mensajes de string
// interface FormErrors {
//   [key: string]: string; // Para mensajes de error específicos por campo
//   nit: string;
//   name: string;
//   document_type: string;
//   address: string;
//   email: string;
//   phone: string;
//   city: string;
//   commercial_name: string;
//   verification_digit: string;
//   contact_first_name: string;
//   contact_middle_name: string;
//   contact_last_name: string;
//   contact_second_last_name: string;
//   bank_account_type: string;
//   bank_account_number: string;
//   bank_name: string;
//   category_id: string;
// }

// const FormCrearProveedor: React.FC<ModalFormProps> = ({
//   isOpen,
//   onClose,
//   proveedorExistente = null,
//   defaultCategoryId,
// }) => {
//   const {
//     municipios,
//     fetchRegiones,
//     loading: loadingRegiones,
//   } = useRegionesStore(); // `paises` y `departamentos` no se usan en el JSX, por lo que los quité de la desestructuración

//   const {
//     createSupplier,
//     updateSupplier,
//     loading: supplierLoading,
//     error: supplierError,
//   } = useSuppliersStore();

//   const {
//     fetchTiposDeDocumentos,
//     documentos,
//   } = useDatosExtraStore(); // `fetchResponsabilidadesFiscales` no se usa, lo quité

//   const { categories, fetchCategories, loading: categoriesLoading } = useSupplierCategoriesStore();

//   const [formData, setFormData] = useState<Supplier>(() => {
//     if (proveedorExistente) {
//       return {
//         ...proveedorExistente,
//         is_active: proveedorExistente.is_active ?? true,
//         notifications_enabled: proveedorExistente.notifications_enabled ?? true,
//         created_at: proveedorExistente.created_at || new Date().toISOString(),
//         updated_at: proveedorExistente.updated_at || new Date().toISOString(),
//       };
//     }
//     return {
//       id: '',
//       nit: '',
//       name: '',
//       contact_person: null,
//       phone: null,
//       email: null,
//       address: null,
//       notes: null,
//       is_active: true,
//       verification_digit: null,
//       city: null,
//       notifications_enabled: true,
//       document_type: null,
//       contact_first_name: null,
//       contact_middle_name: null,
//       contact_last_name: null,
//       contact_second_last_name: null,
//       commercial_name: null,
//       bank_account_type: null,
//       bank_account_number: null,
//       bank_name: null,
//       category: null,
//       category_id: defaultCategoryId || null,
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     };
//   });

//   const [errors, setErrors] = useState<FormErrors>({
//     nit: '',
//     name: '',
//     document_type: '',
//     address: '',
//     email: '',
//     phone: '',
//     city: '',
//     commercial_name: '',
//     verification_digit: '',
//     contact_first_name: '',
//     contact_middle_name: '',
//     contact_last_name: '',
//     contact_second_last_name: '',
//     bank_account_type: '',
//     bank_account_number: '',
//     bank_name: '',
//     category_id: '',
//   });

//   useEffect(() => {
//     fetchTiposDeDocumentos();
//     fetchRegiones();
//     fetchCategories();
//   }, [fetchTiposDeDocumentos, fetchRegiones, fetchCategories]);

//   useEffect(() => {
//     if (proveedorExistente) {
//       setFormData({
//         ...proveedorExistente,
//         is_active: proveedorExistente.is_active ?? true,
//         notifications_enabled: proveedorExistente.notifications_enabled ?? true,
//         created_at: proveedorExistente.created_at || new Date().toISOString(),
//         updated_at: proveedorExistente.updated_at || new Date().toISOString(),
//       });
//     } else {
//       // Resetear formData solo si no hay proveedorExistente (modo "crear")
//       setFormData({
//         id: '',
//         nit: '',
//         name: '',
//         contact_person: null,
//         phone: null,
//         email: null,
//         address: null,
//         notes: null,
//         is_active: true,
//         verification_digit: null,
//         city: null,
//         notifications_enabled: true,
//         document_type: null,
//         contact_first_name: null,
//         contact_middle_name: null,
//         contact_last_name: null,
//         contact_second_last_name: null,
//         commercial_name: null,
//         bank_account_type: null,
//         bank_account_number: null,
//         bank_name: null,
//         category: null,
//         category_id: defaultCategoryId || null,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       });
//     }
//     // Reiniciar errores al abrir o cambiar de proveedor
//     setErrors({
//       nit: '', name: '', document_type: '', address: '', email: '', phone: '', city: '',
//       commercial_name: '', verification_digit: '', contact_first_name: '', contact_middle_name: '',
//       contact_last_name: '', contact_second_last_name: '', bank_account_type: '',
//       bank_account_number: '', bank_name: '', category_id: '',
//     });
//   }, [proveedorExistente, defaultCategoryId]);


//   const handleChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
//     >
//   ) => {
//     const { name, value, type } = e.target;
//     let newValue: string | boolean | null = value;

//     if (type === 'checkbox') {
//       newValue = (e.target as HTMLInputElement).checked;
//     } else if (name === 'notifications_enabled') { // Para el SimpleSelect de notificaciones
//       newValue = value === 'true';
//     } else if (value === '') {
//       newValue = null; // Convertir cadenas vacías a null para campos opcionales
//     }

//     setFormData((prev) => ({ ...prev, [name]: newValue }));

//     // Validar en tiempo real y establecer mensajes de error específicos
//     const validationMap: Record<string, (value: string) => boolean> = {
//       name: validateTextos,
//       nit: validateEntradasNumericas,
//       document_type: validateSeleccionMultiple,
//       address: validateTextos,
//       email: validateTextos,
//       phone: validateTextos,
//       city: validateSeleccionMultiple, // Para SelectConSearch, necesita ser un valor seleccionado
//       contact_first_name: validateTextos,
//       contact_last_name: validateTextos, // Solo validé el primer apellido, puedes añadir los demás
//       commercial_name: validateTextos,
//       bank_account_type: validateTextos,
//       bank_account_number: validateEntradasNumericas, // Asumiendo que es numérico
//       bank_name: validateTextos,
//       category_id: validateSeleccionMultiple,
//     };

//     const currentErrorFieldName = name as keyof FormErrors;
//     if (validationMap[currentErrorFieldName]) {
//       const isValid = validationMap[currentErrorFieldName](String(newValue || ''));
//       setErrors((prev) => ({
//         ...prev,
//         [currentErrorFieldName]: isValid ? '' : `Campo ${currentErrorFieldName.replace(/_/g, ' ')} es requerido.`, // Mensaje genérico, puedes personalizar
//       }));
//     } else {
//       // Si no hay una validación específica, o si el campo es opcional y se vacía, limpia el error
//       setErrors((prev) => ({ ...prev, [currentErrorFieldName]: '' }));
//     }
//   };

//   const handleSubmit = async (
//     event: React.MouseEvent<HTMLButtonElement>
//   ): Promise<void> => {
//     event.preventDefault();
//     const newErrors: FormErrors = { ...errors }; // Clonar el objeto de errores para actualizar

//     // Validación de todos los campos obligatorios al enviar
//     const validateField = (field: keyof Supplier, validator: (value: string) => boolean, errorMessage: string) => {
//         const isValid = validator(String(formData[field] || ''));
//         newErrors[field as keyof FormErrors] = isValid ? '' : errorMessage;
//         return isValid;
//     };

//     const isNameValid = validateField('name', validateTextos, 'El nombre es obligatorio.');
//     const isNitValid = validateField('nit', validateEntradasNumericas, 'El NIT es obligatorio y debe ser numérico.');
//     const isDocumentTypeValid = validateField('document_type', validateSeleccionMultiple, 'El tipo de documento es obligatorio.');
//     const isAddressValid = validateField('address', validateTextos, 'La dirección es obligatoria.');
//     const isEmailValid = validateField('email', validateTextos, 'El correo electrónico es obligatorio.');
//     const isPhoneValid = validateField('phone', validateTextos, 'El teléfono es obligatorio.');
//     const isCityValid = validateField('city', validateSeleccionMultiple, 'El municipio es obligatorio.');
//     const isContactFirstNameValid = validateField('contact_first_name', validateTextos, 'El primer nombre de contacto es obligatorio.');
//     const isContactLastNameValid = validateField('contact_last_name', validateTextos, 'El primer apellido de contacto es obligatorio.');
//     const isCommercialNameValid = validateField('commercial_name', validateTextos, 'El nombre de la empresa es obligatorio.');
//     const isBankAccountTypeValid = validateField('bank_account_type', validateTextos, 'El tipo de cuenta es obligatorio.');
//     const isBankAccountNumberValid = validateField('bank_account_number', validateEntradasNumericas, 'El número de cuenta es obligatorio.');
//     const isBankNameValid = validateField('bank_name', validateTextos, 'El nombre del banco es obligatorio.');
//     const isCategoryIdValid = validateField('category_id', validateSeleccionMultiple, 'La categoría es obligatoria.');

//     // Actualizar el estado de errores
//     setErrors(newErrors);

//     // Verificar si hay algún error
//     const hasAnyError = Object.values(newErrors).some((errorMsg) => errorMsg !== '');

//     if (hasAnyError) {
//       showErrorToast('Por favor, corrige los errores en el formulario.');
//       return;
//     }

//     try {
//       const payload: Partial<Supplier> = {
//         nit: formData.nit,
//         name: formData.name,
//         contact_person: formData.contact_person,
//         phone: formData.phone,
//         email: formData.email,
//         address: formData.address,
//         notes: formData.notes,
//         is_active: formData.is_active,
//         verification_digit: formData.verification_digit,
//         city: formData.city,
//         notifications_enabled: formData.notifications_enabled,
//         document_type: formData.document_type,
//         contact_first_name: formData.contact_first_name,
//         contact_middle_name: formData.contact_middle_name,
//         contact_last_name: formData.contact_last_name,
//         contact_second_last_name: formData.contact_second_last_name,
//         commercial_name: formData.commercial_name,
//         bank_account_type: formData.bank_account_type,
//         bank_account_number: formData.bank_account_number,
//         bank_name: formData.bank_name,
//         category_id: formData.category_id,
//       };

//       if (proveedorExistente?.id) {
//         await updateSupplier(proveedorExistente.id, payload);
//         showTemporaryToast('Proveedor actualizado exitosamente!');
//       } else {
//         await createSupplier(payload as Supplier);
//         showTemporaryToast('Proveedor creado exitosamente!');
//       }

//       // Reiniciar formData después de un envío exitoso o cierre del modal
//       onClose(); // Cierra el modal primero

//     } catch (err: any) {
//       console.error('Error al guardar proveedor:', err);
//       // Muestra el error específico del store o un mensaje genérico
//       showErrorToast(`Error al guardar proveedor: ${supplierError || 'Error desconocido'}`);
//     }
//   };

//   const handleBackgroundClick = (
//     e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
//   ) => {
//     // Solo permitir cerrar el modal si no está cargando el envío
//     if (!supplierLoading) {
//       onClose();
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div
//       className="fixed inset-0 flex justify-center items-center z-[201]"
//       onClick={handleBackgroundClick}
//     >
//       <div className="fixed inset-0 flex justify-center items-center z-51 bg-black bg-opacity-50">
//         <div
//           className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <h2 className="text-xl font-bold mb-4">
//             {proveedorExistente ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
//           </h2>

//           <form autoComplete="off">
//             <p className="mt-8 font-light text-sm text-[#00A7E1]">
//               Información Empresarial
//             </p>
//             <InputField
//               label="Nombre del Proveedor"
//               name="name"
//               value={formData.name || ''}
//               error={!!errors.name}
//               errorMessage={errors.name}
//               onChange={handleChange}
//               required
//             />
//             <InputField
//               label="Nombre de la empresa"
//               name="commercial_name"
//               value={formData.commercial_name || ''}
//               error={!!errors.commercial_name}
//               errorMessage={errors.commercial_name}
//               onChange={handleChange}
//               required
//             />
//             <div className="flex flex-col mt-4 w-full">
//               <label>
//                 Tipo de documento
//                 <span
//                   className={`text-red-500 ${
//                     errors.document_type ? '' : 'invisible'
//                   }`}
//                 >
//                   *
//                 </span>
//               </label>
//               <div className=" relative mt-4">
//                 {documentos ? (
//                   <SimpleSelect
//                     options={documentos}
//                     placeholder="Seleccione una opción"
//                     width={'100%'}
//                     value={formData.document_type || ''}
//                     onChange={(value) => {
//                       // Simular evento para handleChange
//                       handleChange({ target: { name: 'document_type', value: value, type: 'select-one' } as HTMLSelectElement });
//                     }}
//                     error={!!errors.document_type}
//                     errorMessage={errors.document_type}
//                   />
//                 ) : (
//                   ''
//                 )}
//               </div>
//             </div>
//             <InputField
//               label="NIT"
//               name="nit"
//               value={formData.nit || ''}
//               error={!!errors.nit}
//               errorMessage={errors.nit}
//               onChange={handleChange}
//               required
//             />
//             <InputField
//               label="DV"
//               name="verification_digit"
//               value={formData.verification_digit || ''}
//               error={!!errors.verification_digit}
//               errorMessage={errors.verification_digit}
//               onChange={handleChange}
//             />
//             <p className="mt-8 font-light text-sm text-[#00A7E1]">
//               Información Personal de Contacto
//             </p>

//             <InputField
//               label="Primer Nombre de Contacto"
//               name="contact_first_name"
//               value={formData.contact_first_name || ''}
//               error={!!errors.contact_first_name}
//               errorMessage={errors.contact_first_name}
//               onChange={handleChange}
//               required
//             />
//             <InputField
//               label="Segundo Nombre de Contacto"
//               name="contact_middle_name"
//               value={formData.contact_middle_name || ''}
//               error={!!errors.contact_middle_name}
//               errorMessage={errors.contact_middle_name}
//               onChange={handleChange}
//             />
//             <InputField
//               label="Primer Apellido de Contacto"
//               name="contact_last_name"
//               value={formData.contact_last_name || ''}
//               error={!!errors.contact_last_name}
//               errorMessage={errors.contact_last_name}
//               onChange={handleChange}
//               required
//             />
//             <InputField
//               label="Segundo Apellido de Contacto"
//               name="contact_second_last_name"
//               value={formData.contact_second_last_name || ''}
//               error={!!errors.contact_second_last_name}
//               errorMessage={errors.contact_second_last_name}
//               onChange={handleChange}
//             />
//             <p className="mt-8 font-light text-sm text-[#00A7E1]">Ubicación</p>
//             <InputField
//               label="Dirección"
//               name="address"
//               value={formData.address || ''}
//               error={!!errors.address}
//               errorMessage={errors.address}
//               onChange={handleChange}
//               required
//             />
//             <div className="flex flex-col">
//               {loadingRegiones ? (
//                 <div>Cargando municipios...</div>
//               ) : (
//                 <div className=" relative">
//                   <SelectConSearch
//                     label="Municipio"
//                     options={municipios}
//                     placeholder="Buscar un Municipio"
//                     name="city"
//                     value={formData.city || ''}
//                     onChange={(value) => {
//                       // Simular evento para handleChange
//                       handleChange({ target: { name: 'city', value: value, type: 'select-one' } as HTMLSelectElement });
//                     }}
//                     error={!!errors.city}
//                     errorMessage={errors.city}
//                     required
//                   />
//                 </div>
//               )}
//             </div>
//             <div className="flex flex-col mt-4 w-full">
//                 <label>
//                     Categoría
//                     <span
//                         className={`text-red-500 ${
//                             errors.category_id ? '' : 'invisible'
//                         }`}
//                     >
//                         *
//                     </span>
//                 </label>
//                 <div className="relative mt-4">
//                     {categoriesLoading ? (
//                         <div>Cargando categorías...</div>
//                     ) : (
//                         <SimpleSelect
//                             options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
//                             placeholder="Seleccione una categoría"
//                             width={'100%'}
//                             name="category_id"
//                             value={formData.category_id || ''}
//                             onChange={(value) => {
//                                 // Simular evento para handleChange
//                                 handleChange({ target: { name: 'category_id', value: value, type: 'select-one' } as HTMLSelectElement });
//                             }}
//                             error={!!errors.category_id}
//                             errorMessage={errors.category_id}
//                             required
//                         />
//                     )}
//                 </div>
//             </div>
//             <p className="mt-8 font-light text-sm text-[#00A7E1]">Contacto</p>
//             <InputField
//               label="Correo Electrónico"
//               name="email"
//               value={formData.email || ''}
//               error={!!errors.email}
//               errorMessage={errors.email}
//               onChange={handleChange}
//               required
//             />
//             <InputField
//               label="Teléfono"
//               name="phone"
//               value={formData.phone || ''}
//               error={!!errors.phone}
//               errorMessage={errors.phone}
//               onChange={handleChange}
//               required
//             />
//             <div className="flex flex-col mt-4 w-full">
//               <label>
//                 Notificaciones
//               </label>
//               <div className=" relative mt-4">
//                 <SimpleSelect
//                   options={notificacionesOpciones}
//                   placeholder="Seleccione una opción"
//                   width={'100%'}
//                   value={String(formData.notifications_enabled)}
//                   name="notifications_enabled"
//                   onChange={(value) => {
//                     // Simular evento para handleChange
//                     handleChange({ target: { name: 'notifications_enabled', value: value, type: 'select-one' } as HTMLSelectElement });
//                   }}
//                 />
//               </div>
//             </div>
//             <p className="mt-8 font-light text-sm text-[#00A7E1]">
//               Información Bancaria
//             </p>
//             <InputField
//               label="Tipo de cuenta"
//               name="bank_account_type"
//               value={formData.bank_account_type || ''}
//               error={!!errors.bank_account_type}
//               errorMessage={errors.bank_account_type}
//               onChange={handleChange}
//               required
//             />
//             <InputField
//               label="Numero de cuenta"
//               name="bank_account_number"
//               value={formData.bank_account_number || ''}
//               error={!!errors.bank_account_number}
//               errorMessage={errors.bank_account_number}
//               onChange={handleChange}
//               required
//             />
//             <InputField
//               label="Banco"
//               name="bank_name"
//               value={formData.bank_name || ''}
//               error={!!errors.bank_name}
//               errorMessage={errors.bank_name}
//               onChange={handleChange}
//               required
//             />
//             {Object.values(errors).some(msg => msg !== '') && (
//               <p className="text-red-500 text-sm flex justify-center mt-4">
//                 Por favor, corrige los campos marcados.
//               </p>
//             )}
//             <div className="flex justify-end space-x-3 mt-8 ">
//               <button
//                 type="button"
//                 onClick={handleBackgroundClick}
//                 className="bg-[#333332] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-auto"
//                 disabled={supplierLoading} // Deshabilitar si se está cargando
//               >
//                 Cancelar
//               </button>
//               <button
//                 type="submit"
//                 onClick={handleSubmit}
//                 className="bg-[#00A7E1] text-white w-24 h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1]"
//                 disabled={supplierLoading}
//               >
//                 {supplierLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
//                 {proveedorExistente ? 'Actualizar' : 'Crear'}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FormCrearProveedor;


import React, { useState, useEffect } from 'react';
import {
  validateSeleccionMultiple,
  validateEntradasNumericas,
  validateTextos,
} from '../../app/gestionDeFacturasElectronicas/validations';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { useRegionesStore } from '@/store/useRegionesStore';
import { useSuppliersStore } from '@/store/Inventario/useSuppliersStore'; // Importación correcta
import SelectConSearch from '@/components/ui/selectConSearch';
import InputField from '@/components/ui/InputField';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';

// Solo importa 'Supplier' si es necesario.
// Si Supplier es la misma que la Supplier del store, úsala.
// Si 'Supplier' no la tienes exportada en un archivo de tipos, puedes copiarla aquí temporalmente.
import type { Supplier } from '@/types/inventory'; // Asegúrate de que esta ruta sea correcta y que Supplier esté exportada

const notificaciones: string[] = ['No', 'Si'];

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  proveedorExistente?: Supplier | null;
  defaultCategoryId?: string;
}

interface Errors {
  id: boolean;
  name: boolean;
  nit: boolean;
  document_type: boolean;
  address: boolean;
  email: boolean;
  phone: boolean;
  city: boolean;
  FIC: boolean; // Mantengo FIC para el error, si se mapea a 'notes' en el formData
  contact_first_name: boolean;
  contact_middle_name: boolean;
  contact_last_name: boolean;
  contact_second_last_name: boolean;
  verification_digit: boolean;
  commercial_name: boolean;
  bank_account_type: boolean;
  bank_account_number: boolean;
  bank_name: boolean;
}

// Tipo para el estado del formulario que excluye los campos de la API que no se gestionan directamente en el input
// y permite que algunos sean opcionales para la inicialización.
type FormSupplierData = Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'category'>>;
// Para 'notificaciones_enabled' que es booleano, y 'FIC' que mapeamos a 'notes'
interface FormSupplierDataWithCustomFields extends FormSupplierData {
    notificacion: 'Si' | 'No'; // Para el select de notificaciones
    FIC: string; // Para el campo FIC que mapea a 'notes'
}


const FormCrearProveedor: React.FC<ModalFormProps> = ({ isOpen, onClose, proveedorExistente = null, defaultCategoryId }) => {
  const {
    municipios, // Solo usas municipios y loadingRegiones directamente aquí
    fetchRegiones,
    loading: loadingRegiones,
  } = useRegionesStore();
  
  const {
    createSupplier,
    updateSupplier
  } = useSuppliersStore();

  useEffect(() => {
    fetchTiposDeDocumentos();
    fetchRegiones();
    fetchResponsabilidadesFiscales();
  }, []);

  const {
    fetchTiposDeDocumentos,
    fetchResponsabilidadesFiscales,
    documentos,
    responsabilidades, // No usado en este componente, pero traído del store
  } = useDatosExtraStore();

  const [formData, setFormData] = useState<FormSupplierDataWithCustomFields>({
    // Inicialización para nuevo proveedor
    name: '',
    nit: '',
    document_type: '',
    address: '',
    email: '',
    phone: '',
    city: '',
    notes: '', // Mapeado de FIC
    contact_first_name: '',
    contact_middle_name: '',
    contact_last_name: '',
    contact_second_last_name: '',
    verification_digit: '',
    commercial_name: '',
    bank_account_type: '',
    bank_account_number: '',
    bank_name: '',
    notificacion: "Si", // Mapeado de notifications_enabled
    FIC: '' // Campo extra para el formulario, se mapeará a 'notes'
  });

  useEffect(() => {
    if (proveedorExistente) {
      // Cuando editas, mapeas los campos de Supplier a la estructura de tu formulario
      setFormData({
        name: proveedorExistente.name,
        nit: proveedorExistente.nit,
        document_type: proveedorExistente.document_type || '',
        address: proveedorExistente.address || '',
        email: proveedorExistente.email || '',
        phone: proveedorExistente.phone || '',
        city: proveedorExistente.city || '',
        notes: proveedorExistente.notes || '', // Mapeo de Supplier.notes a formData.notes (tu FIC)
        contact_first_name: proveedorExistente.contact_first_name || '',
        contact_middle_name: proveedorExistente.contact_middle_name || '',
        contact_last_name: proveedorExistente.contact_last_name || '',
        contact_second_last_name: proveedorExistente.contact_second_last_name || '',
        verification_digit: proveedorExistente.verification_digit || '',
        commercial_name: proveedorExistente.commercial_name || '',
        bank_account_type: proveedorExistente.bank_account_type || '',
        bank_account_number: proveedorExistente.bank_account_number || '',
        bank_name: proveedorExistente.bank_name || '',
        notificacion: proveedorExistente.notifications_enabled ? 'Si' : 'No', // Mapeo de boolean a string
        FIC: proveedorExistente.notes || '', // Si quieres mantener el campo FIC en el formulario UI
        // Si defaultCategoryId es para el 'category_id' de Supplier, úsalo aquí también para edición
        // category_id: proveedorExistente.category_id || defaultCategoryId || null,
      });
    } else {
      // Reinicia el formulario para un nuevo proveedor con valores por defecto
      setFormData({
        name: '', nit: '', document_type: '', address: '', email: '', phone: '', city: '',
        notes: '', contact_first_name: '', contact_middle_name: '', contact_last_name: '',
        contact_second_last_name: '', verification_digit: '', commercial_name: '',
        bank_account_type: '', bank_account_number: '', bank_name: '',
        notificacion: "Si",
        FIC: '',
        // category_id: defaultCategoryId || null, // Si se usa para nuevos proveedores
      });
    }
  }, [proveedorExistente, defaultCategoryId]);


  const [errors, setErrors] = useState<Errors>({
    id: false, name: false, nit: false, document_type: false, address: false,
    email: false, phone: false, city: false, FIC: false, contact_first_name: false,
    contact_middle_name: false, contact_last_name: false, contact_second_last_name: false,
    verification_digit: false, commercial_name: false, bank_account_type: false,
    bank_account_number: false, bank_name: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Actualiza 'notificacion' especial
    if (name === 'notificacion') {
      setFormData((prev) => ({ ...prev, notificacion: value as 'Si' | 'No' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Validaciones mapeadas
    const validators: Record<string, (value: string) => boolean> = {
      name: validateTextos,
      nit: validateEntradasNumericas,
      document_type: validateSeleccionMultiple,
      address: validateTextos,
      email: validateTextos,
      phone: validateTextos,
      city: validateTextos,
      FIC: validateTextos, // Valida el campo FIC del formulario
      contact_first_name: validateTextos,
      contact_middle_name: validateTextos,
      contact_last_name: validateTextos,
      contact_second_last_name: validateTextos,
      verification_digit: validateTextos,
      commercial_name: validateTextos,
      bank_account_type: validateTextos,
      bank_account_number: validateTextos,
      bank_name: validateTextos,
      // 'notificacion' se valida de forma especial, no aquí directamente
    };

    if (validators[name]) {
      setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
    }
  };

  const handleSubmit = async (
    event: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    event.preventDefault();
    const errorState = { ...errors };

    Object.keys(errorState).forEach((key) => {
      errorState[key as keyof Errors] = false;
    });

    // Validaciones finales (usando los nombres de campo de formData)
    const isNameValid = validateTextos(formData.name || '');
    const isNitValid = validateTextos(formData.nit || '');
    const isDocumentTypeValid = validateTextos(formData.document_type || '');
    const isAddressValid = validateTextos(formData.address || '');
    const isEmailValid = validateTextos(formData.email || '');
    const isPhoneValid = validateTextos(formData.phone || '');
    const isCityValid = validateTextos(formData.city || '');
    const isFICValid = validateTextos(formData.FIC || ''); // Valida FIC del formulario
    const isContactFirstNameValid = validateTextos(formData.contact_first_name || '');
    const isContactMiddleNameValid = validateTextos(formData.contact_middle_name || '');
    const isContactLastNameValid = validateTextos(formData.contact_last_name || '');
    const isContactSecondLastNameValid = validateTextos(formData.contact_second_last_name || '');
    const isVerificationDigitValid = validateTextos(formData.verification_digit || '');
    const isCommercialNameValid = validateTextos(formData.commercial_name || '');
    const isBankAccountTypeValid = validateTextos(formData.bank_account_type || '');
    const isBankAccountNumberValid = validateTextos(formData.bank_account_number || '');
    const isBankNameValid = validateTextos(formData.bank_name || '');

    // Actualizar el estado de errores
    errorState.name = !isNameValid;
    errorState.nit = !isNitValid;
    errorState.document_type = !isDocumentTypeValid;
    errorState.address = !isAddressValid;
    errorState.email = !isEmailValid;
    errorState.phone = !isPhoneValid;
    errorState.city = !isCityValid;
    errorState.FIC = !isFICValid; // Error para el campo FIC
    errorState.contact_first_name = !isContactFirstNameValid;
    errorState.contact_middle_name = !isContactMiddleNameValid;
    errorState.contact_last_name = !isContactLastNameValid;
    errorState.contact_second_last_name = !isContactSecondLastNameValid;
    errorState.verification_digit = !isVerificationDigitValid;
    errorState.commercial_name = !isCommercialNameValid;
    errorState.bank_account_type = !isBankAccountTypeValid;
    errorState.bank_account_number = !isBankAccountNumberValid;
    errorState.bank_name = !isBankNameValid;

    setErrors(errorState);

    const hasErrors = Object.values(errorState).some((value) => value);

    if (hasErrors) {
      return;
    }

    try {
      if (proveedorExistente) {
        if (proveedorExistente.id) {
          // Construir el objeto para updateSupplier (Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'category'>>)
          // Los campos nulos en Supplier se manejarán como opcionales en UpdateSupplier
          const updatedSupplierData = {
            name: formData.name,
            nit: formData.nit,
            document_type: formData.document_type,
            address: formData.address,
            email: formData.email,
            phone: formData.phone,
            city: formData.city,
            notes: formData.FIC, // Mapea FIC del formulario a notes de Supplier
            notifications_enabled: formData.notificacion === 'Si', // Mapeo de string a boolean
            verification_digit: formData.verification_digit,
            contact_first_name: formData.contact_first_name,
            contact_middle_name: formData.contact_middle_name,
            contact_last_name: formData.contact_last_name,
            contact_second_last_name: formData.contact_second_last_name,
            commercial_name: formData.commercial_name,
            bank_account_type: formData.bank_account_type,
            bank_account_number: formData.bank_account_number,
            bank_name: formData.bank_name,
            is_active: true,
            // category_id: defaultCategoryId || proveedorExistente.category_id || null, // Si se usa category_id
          };
          await updateSupplier(proveedorExistente.id, updatedSupplierData);
        } else {
          console.error("Error: Intentando actualizar un proveedor sin ID.");
        }
      } else {
        // Construir el objeto para createSupplier (Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'category'>)
        const newSupplierData = {
          name: formData.name || '', // Asegurar que sea string si el backend lo espera
          nit: formData.nit || '',
          document_type: formData.document_type || '',
          address: formData.address || '',
          email: formData.email || '',
          phone: formData.phone || '',
          city: formData.city || '',
          notes: formData.FIC || '', // Mapea FIC del formulario a notes de Supplier
          notifications_enabled: formData.notificacion === 'Si',
          verification_digit: formData.verification_digit || '',
          contact_first_name: formData.contact_first_name || '',
          contact_middle_name: formData.contact_middle_name || '',
          contact_last_name: formData.contact_last_name || '',
          contact_second_last_name: formData.contact_second_last_name || '',
          commercial_name: formData.commercial_name || '',
          bank_account_type: formData.bank_account_type || '',
          bank_account_number: formData.bank_account_number || '',
          bank_name: formData.bank_name || '',
          is_active: true
          // category_id: defaultCategoryId || null, // Si se usa category_id
        };
        await createSupplier(newSupplierData);
      }
      // Reiniciar el formulario después de guardar/actualizar
      setFormData({
        name: '', nit: '', document_type: '', address: '', email: '', phone: '', city: '',
        notes: '', contact_first_name: '', contact_middle_name: '', contact_last_name: '',
        contact_second_last_name: '', verification_digit: '', commercial_name: '',
        bank_account_type: '', bank_account_number: '', bank_name: '', notificacion: "Si", FIC: ''
      });
      onClose();
    } catch (error: any) {
      console.error("Error al procesar el proveedor:", error);
      // Aquí puedes mostrar un mensaje de error al usuario, por ejemplo, con un Toast
    }
  };

  const handleBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    // Reiniciar el formulario al cerrar sin guardar
    setFormData({
      name: '', nit: '', document_type: '', address: '', email: '', phone: '', city: '',
      notes: '', contact_first_name: '', contact_middle_name: '', contact_last_name: '',
      contact_second_last_name: '', verification_digit: '', commercial_name: '',
      bank_account_type: '', bank_account_number: '', bank_name: '', notificacion: "Si", FIC: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick}
    >
      <div className="fixed inset-0 flex justify-center items-center z-51 bg-black bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
          onClick={(e) => { e.stopPropagation(); }}
        >
          <h2 className="text-xl font-bold mb-4">
            {proveedorExistente ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
          </h2>

          <form autoComplete="off">
            {/* Seccion de informacion de la empresa */}
            <p className="mt-8 font-light text-sm text-[#00A7E1]">
              Información Empresarial
            </p>

            <InputField label="Proveedor" name="name" value={formData.name || ''} error={errors.name} onChange={handleChange} />
            <InputField label="Nombre de la empresa" name="commercial_name" value={formData.commercial_name || ''} error={errors.commercial_name} onChange={handleChange} />

            <div className="flex flex-col mt-4 w-full">
              <label>
                Tipo de documento
                <span className={`text-red-500 ${errors.document_type ? '' : 'invisible'}`}>*</span>
              </label>
              <div className=" relative mt-4">
                {documentos ? (
                  <SimpleSelect
                    options={documentos}
                    placeholder="Seleccione una opcion"
                    width={'100%'}
                    value={formData.document_type || ''}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, document_type: value }));
                      setErrors((prev) => ({ ...prev, document_type: !value }));
                    }}
                    error={errors.document_type}
                  />
                ) : ('')}
              </div>
            </div>

            <InputField label="NIT" name="nit" value={formData.nit || ''} error={errors.nit} onChange={handleChange} />
            <InputField label="DV" name="verification_digit" value={formData.verification_digit || ''} error={errors.verification_digit} onChange={handleChange} />

            <p className="mt-8 font-light text-sm text-[#00A7E1]">Informacion Personal</p>
            <InputField label="Primer Nombre" name="contact_first_name" value={formData.contact_first_name || ''} error={errors.contact_first_name} onChange={handleChange} />
            <InputField label="Segundo Nombre" name="contact_middle_name" value={formData.contact_middle_name || ''} error={errors.contact_middle_name} onChange={handleChange} />
            <InputField label="Primer apellido" name="contact_last_name" value={formData.contact_last_name || ''} error={errors.contact_last_name} onChange={handleChange} />
            <InputField label="Segundo apellido" name="contact_second_last_name" value={formData.contact_second_last_name || ''} error={errors.contact_second_last_name} onChange={handleChange} />

            <p className="mt-8 font-light text-sm text-[#00A7E1]">Ubicacion</p>
            <InputField label="Direccion" name="address" value={formData.address || ''} error={errors.address} onChange={handleChange} />

            <div className="flex flex-col">
              {loadingRegiones ? (
                <div>Cargando municipios...</div>
              ) : (
                <div className=" relative">
                  <SelectConSearch
                    label="Municipio"
                    options={municipios}
                    placeholder="Buscar un Municipio"
                    value={formData.city || ''}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, city: value }));
                      setErrors((prev) => ({ ...prev, city: !value }));
                    }}
                    error={errors.city}
                    errorMessage="Debes seleccionar un municipio"
                  />
                </div>
              )}
            </div>

            <p className="mt-8 font-light text-sm text-[#00A7E1]">Contacto</p>
            <InputField label="Correo Electrónico" name="email" value={formData.email || ''} error={errors.email} onChange={handleChange} />
            <InputField label="Teléfono" name="phone" value={formData.phone || ''} error={errors.phone} onChange={handleChange} />

            <div className="flex flex-col mt-4 w-full">
              <label>Notificaciones</label>
              <div className=" relative mt-4">
                <SimpleSelect
                  options={notificaciones}
                  placeholder="Seleccione una opcion"
                  width={'100%'}
                  value={formData.notificacion} // Ahora es el campo directo del formulario
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, notificacion: value as 'Si' | 'No' }));
                  }}
                />
              </div>
            </div>

            <p className="mt-8 font-light text-sm text-[#00A7E1]">Informacion Bancaria</p>
            <InputField label="Tipo de cuenta" name="bank_account_type" value={formData.bank_account_type || ''} error={errors.bank_account_type} onChange={handleChange} />
            <InputField label="Numero de cuenta" name="bank_account_number" value={formData.bank_account_number || ''} error={errors.bank_account_number} onChange={handleChange} />
            <InputField label="Banco" name="bank_name" value={formData.bank_name || ''} error={errors.bank_name} onChange={handleChange} />
            <InputField label="FIC" name="FIC" value={formData.FIC || ''} error={errors.FIC} onChange={handleChange} />

            {Object.values(errors).includes(true) && (
              <p className="text-red-500 text-sm flex justify-center mt-4">
                Debe llenar todos campos requeridos.
              </p>
            )}

            <div className="flex justify-end space-x-3 mt-8 ">
              <button
                type="button"
                onClick={handleBackgroundClick}
                className="bg-[#333332] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="bg-[#00A7E1] text-white w-24 h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1]"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormCrearProveedor;