import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  validateSeleccionMultiple,
  validateEntradasNumericas,
  validateTextos,
} from '../../app/gestionDeFacturasElectronicas/validations';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { useClientStore } from '../../store/useClientStore';
import { useRegionesStore } from '@/store/useRegionesStore';
import SelectConSearch from '@/components/ui/selectConSearch';
import { InfoClientes, todaLaInfoUsuario } from '@/types/types';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';
import InputField from '@/components/ui/InputField';
import { useAdminStore } from '@/store/useAdminStore';
import { useUserStore } from '@/store/useUser';
import { showErrorToast } from '@/components/feedback/toast';

// const notificaciones: string[] = ['No', 'Si'];

// const tiposDeContribuyentes = [
//   { id: '1', nombre: 'Responsable de IVA' },
//   { id: '2', nombre: 'No Responsable de IVA' },
// ];

// const tiposDeOrganizaciones = [
//   { id: '1', nombre: 'Persona juridica asimilada' },
//   { id: '2', nombre: 'Persona natural asimilada' },
// ];

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  infoUsuario?: todaLaInfoUsuario | null;
}

interface Errors {
  tipoDeDocumento: boolean;
  documento: boolean;
  cliente: boolean;
  dv: boolean;
  direccion: boolean;
  telefono: boolean;
  correo: boolean;
  municipio: boolean;
  notificaciones: boolean;
  responsabilidadesFiscales: boolean;
  tipoDeContribuyente: boolean;
  tipoDeOrganizacion: boolean;
  pais: boolean;
  departamento: boolean;
  codigo: boolean;
}

const UsuarioModal: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  infoUsuario = null,
}) => {
  const {
    municipios,
    fetchRegiones,
    loading: loadingRegiones,
  } = useRegionesStore();

  const { actualizarInfoDeUsuario } = useAdminStore();
  const { register } = useUserStore();
  const [imagen, setImagen] = useState<File | null>(null);

  const [formData, setFormData] = useState<todaLaInfoUsuario>({
    id: '',
    idRol: '',
    correo: '',
    nombre: '',
    usuario: '',
    nit: '',
    direccion: '',
    telefono: '',
    tipoDeOrganizacion: '',
    regimen: '',
    tipoDoc: '',
    constructor: '',
    limiteDeFacturacion: '',
    limiteDisponible: '',
    montoFacturado: '',
    dv: '',
    fechaDeRegistro: '',
    fechaVencimiento: '',
    ciudad: '',
  });

  useEffect(() => {
    fetchRegiones();
  }, []);

  useEffect(() => {
    if (infoUsuario) {
      setFormData(infoUsuario);
    }
  }, [infoUsuario]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validaciones mapeadas
    const validators: Record<string, (value: string) => boolean> = {
      tipoDeDocumento: validateSeleccionMultiple,
      documento: validateEntradasNumericas,
      cliente: validateTextos,
      dv: validateTextos,
      direccion: validateTextos,
      telefono: validateTextos,
      correo: validateTextos,
      municipio: validateTextos,
      notificaciones: validateTextos,
      responsabilidadesFiscales: validateTextos,
      tipoDeContribuyente: validateTextos,
      tipoDeOrganizacion: validateTextos,
      pais: validateTextos,
      departamento: validateTextos,
      codigo: validateTextos,
    };

    // Validar en tiempo real
    // if (validators[name]) {
    //   setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
    // }
  };

  const handleSubmit = async (
    event: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    event.preventDefault();
    const infoParaBack = {
      USUARIO: formData.usuario,
      NOMBRE: formData.nombre,
      CORREO: formData.correo,
      NIT: formData.nit,
      DIRECCION: formData.direccion,
      TELEFONO: formData.telefono,
      ID_TIPO_ORGANIZACION: formData.tipoDeOrganizacion,
      REGIMEN: formData.regimen,
      TIPODOC: formData.tipoDoc,
      CONSTRUCTOR: formData.constructor,
      DV: formData.dv,
      LIMITE_DE_FACTURACION: formData.limiteDeFacturacion,
      LIMITE_DISPONIBLE: formData.limiteDisponible,
      monto_facturado: formData.montoFacturado,
      FECHA_REGISTRO: formData.fechaDeRegistro,
      FECHA_VENCIMIENTO: formData.fechaVencimiento,
    };
    console.log(infoParaBack);

    if (!infoUsuario) {
      const transformed = {
        nombreUsuario: formData.usuario,
        nombreEmpresa: formData.nombre,
        telefono: formData.telefono,
        email: formData.correo,
        password: formData.password,
        nit: formData.nit,
        direccion: formData.direccion,
        ciudad: formData.ciudad,
      };
      const response = await register(transformed, imagen);
      onClose();
      borrarInfoForm();
      return;
    }
    if (formData.id) {
      await actualizarInfoDeUsuario(formData.id, infoParaBack);
      borrarInfoForm();
      onClose();
    } else {
      showErrorToast('El usuario no tiene id');
    }
  };

  const borrarInfoForm = () => {
    setFormData({
      id: '',
      idRol: '',
      correo: '',
      nombre: '',
      nit: '',
      direccion: '',
      telefono: '',
      tipoDeOrganizacion: '',
      regimen: '',
      tipoDoc: '',
      constructor: '',
      limiteDeFacturacion: '',
      limiteDisponible: '',
      montoFacturado: '',
      dv: '',
      fechaDeRegistro: '',
      fechaVencimiento: '',
    });
  };

  const handleBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    borrarInfoForm();
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagen(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick} // Detecta clic en el fondo
    >
      <div className="fixed inset-0 flex justify-center items-center z-51 bg-black bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4 font-montserrat text-[#6F6F6F]">
            {infoUsuario ? 'Información del Usuario' : 'Crear Nuevo Usuario'}
          </h2>
          {infoUsuario && (
            <InputField
              label="ID"
              name="id"
              value={formData.id || ''}
              onChange={handleChange}
              readOnly={true}
            />
          )}

          <InputField
            label="Nombre Empresa"
            name="nombre"
            value={formData.nombre || ''}
            onChange={handleChange}
          />

          <InputField
            label="Nombre Usuario"
            name="usuario"
            value={formData.usuario || ''}
            onChange={handleChange}
          />
          <InputField
            label="Correo"
            name="correo"
            value={formData.correo || ''}
            onChange={handleChange}
          />

          <InputField
            label="NIT"
            name="nit"
            value={formData.nit || ''}
            onChange={handleChange}
          />
          <InputField
            label="Dirección"
            name="direccion"
            value={formData.direccion || ''}
            onChange={handleChange}
          />
          <InputField
            label="Teléfono"
            name="telefono"
            value={formData.telefono || ''}
            onChange={handleChange}
          />
          {infoUsuario && (
            <InputField
              label="Tipo de Organización"
              name="tipoDeOrganizacion"
              value={formData.tipoDeOrganizacion || ''}
              onChange={handleChange}
            />
          )}
          {infoUsuario && (
            <InputField
              label="Régimen"
              name="regimen"
              value={formData.regimen || ''}
              onChange={handleChange}
            />
          )}
          {infoUsuario && (
            <InputField
              label="Tipo de Documento"
              name="tipoDoc"
              value={formData.tipoDoc || ''}
              onChange={handleChange}
            />
          )}
          {infoUsuario && (
            <InputField
              label="Constructor"
              name="constructor"
              value={formData.constructor || ''}
              onChange={handleChange}
            />
          )}
          <InputField
            label="DV"
            name="dv"
            value={formData.dv || ''}
            onChange={handleChange}
          />

          {!infoUsuario && (
            <div>
              <InputField
                label="Password"
                name="password"
                value={formData.password || ''}
                onChange={handleChange}
              />

              {/* Ciudad */}
              <div className="flex flex-col mt-4 ">
                {loadingRegiones ? (
                  <div>Cargando ciudades...</div>
                ) : (
                  <div className=" relative">
                    <label
                      htmlFor="ciudad"
                      className="font-montserrat font-normal text-[#6F6F6F] text-sm"
                    >
                      Ciudad
                    </label>
                    <SelectConSearch
                      // label="Ciudad"
                      options={municipios}
                      placeholder="Buscar una ciudad"
                      value={formData.ciudad || ''}
                      onChange={(value) => {
                        setFormData((prev) => ({ ...prev, ciudad: value }));
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Campo para subir imagen */}
              {/* <div className="mt-4 mb-6">
                <label
                  htmlFor="imagen"
                  className="font-montserrat font-normal text-[#6F6F6F] text-sm mt-4"
                >
                  Imagen de perfil
                </label>
                <Input
                  id="imagen"
                  type="file"
                  onChange={handleImageChange}
                  className="mt-1"
                />
              </div> */}
            </div>
          )}

          {infoUsuario && (
            <div>
              <InputField
                label="Límite de Facturación"
                name="limiteDeFacturacion"
                value={formData.limiteDeFacturacion || ''}
                onChange={handleChange}
              />
              <InputField
                label="Límite Disponible"
                name="limiteDisponible"
                value={formData.limiteDisponible || ''}
                onChange={handleChange}
              />
              <InputField
                label="Monto Facturado"
                name="montoFacturado"
                value={formData.montoFacturado || ''}
                onChange={handleChange}
                readOnly={true}
              />
              <InputField
                label="Fecha de Registro"
                name="fechaDeRegistro"
                value={formData.fechaDeRegistro || ''}
                onChange={handleChange}
                readOnly={true}
              />
              <InputField
                label="Fecha de Vencimiento"
                name="fechaVencimiento"
                value={formData.fechaVencimiento || ''}
                onChange={handleChange}
              />
            </div>
          )}
          <div className="flex justify-end space-x-3 mt-4">
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
        </div>
      </div>
    </div>
  );
};

export default UsuarioModal;
