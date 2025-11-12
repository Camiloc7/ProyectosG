import React, { useState, useEffect } from 'react';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { useClientStore } from '../../store/useClientStore';
import { useRegionesStore } from '@/store/useRegionesStore';
import SelectConSearch from '@/components/ui/selectConSearch';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';
import { useUserStore } from '@/store/useUser';
import { Button } from './button';
import { Lock, Mail, Phone, User, UserCircle, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterUser: React.FC<ModalFormProps> = ({ isOpen, onClose }) => {
  const { register } = useUserStore();
  const {
    paises,
    municipios,
    departamentos,
    fetchRegiones,
    loading: loadingRegiones,
  } = useRegionesStore();
  const {
    createCliente,
    fetchCodigoClienteNuevo,
    codigoClienteNuevo,
    actualizarCliente,
  } = useClientStore();

  useEffect(() => {
    fetchTiposDeDocumentos();
    fetchRegiones();
    fetchCodigoClienteNuevo();
    fetchResponsabilidadesFiscales();
  }, []);

  const {
    fetchTiposDeDocumentos,
    fetchResponsabilidadesFiscales,
    documentos,
    responsabilidades,
  } = useDatosExtraStore();
  const [imagen, setImagen] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nombreUsuario: '',
    nombreEmpresa: '',
    telefono: '',
    email: '',
    password: '',
    nit: '',
    direccion: '',
    ciudad: '',
  });

  const [errors, setErrors] = useState<any>({});

  //   const handleChange = (
  //     e: React.ChangeEvent<
  //       HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  //     >
  //   ) => {
  //     const { name, value } = e.target;

  //     if (name === 'telefono') {
  //       const sanitizedValue = value.replace(/\s/g, '');
  //       setFormData({
  //         ...formData,
  //         [name]: sanitizedValue,
  //       });
  //     } else {
  //       setFormData((prev) => ({ ...prev, [name]: value }));
  //     }

  //     // Validaciones mapeadas
  //     const validators: Record<string, (value: string) => boolean> = {
  //       tipoDeDocumento: validateSeleccionMultiple,
  //       documento: validateEntradasNumericas,
  //       cliente: validateTextos,
  //       dv: validateTextos,
  //       direccion: validateTextos,
  //       telefono: validateTextos,
  //       correo: validateTextos,
  //       municipio: validateTextos,
  //       notificaciones: validateTextos,
  //       responsabilidadesFiscales: validateTextos,
  //       tipoDeContribuyente: validateTextos,
  //       tipoDeOrganizacion: validateTextos,
  //       pais: validateTextos,
  //       departamento: validateTextos,
  //       codigo: validateTextos,
  //     };

  //     // Validar en tiempo real
  //     if (validators[name]) {
  //       setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
  //     }
  //   };

  // Validación del formulario
  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.nombreUsuario)
      newErrors.nombreUsuario = 'El nombre de usuario es requerido';
    if (!formData.nombreEmpresa)
      newErrors.nombreEmpresa = 'El nombre de la empresa es requerido';
    if (!formData.telefono) newErrors.telefono = 'El teléfono es requerido';
    if (!formData.email) newErrors.email = 'El correo electrónico es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'El correo electrónico no es válido';
    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    if (!formData.nit) newErrors.nit = 'El NIT es requerido';
    if (!formData.direccion) newErrors.direccion = 'La dirección es requerida';
    if (!formData.ciudad) newErrors.ciudad = 'La ciudad es requerida';

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0; // Si no hay errores, el formulario es válido
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const response = await register(formData, imagen);
    setFormData({
      nombreUsuario: '',
      nombreEmpresa: '',
      telefono: '',
      email: '',
      password: '',
      nit: '',
      direccion: '',
      ciudad: '',
    });
    if (response.success) {
      onClose();
    }
  };

  const handleBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagen(e.target.files[0]);
    }
  };

  const borderInputStyle =
    'pl-10 border-0 rounded-none border-b-2 border-[#BFBFBF]';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick} // Detecta clic en el fondo
    >
      <div className="fixed inset-0 flex justify-center items-center z-51 bg-black bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <h2 className="text-xl font-bold mb-4">{`Crear Usuario`}</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Campos existentes */}
            <div>
              <label
                htmlFor="username"
                className="text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Escribe tu nombre de usuario"
                  value={formData.nombreUsuario}
                  onChange={(e) =>
                    setFormData({ ...formData, nombreUsuario: e.target.value })
                  }
                  className={borderInputStyle}
                />
              </div>
              {errors.nombreUsuario && (
                <span className="text-red-500 text-sm">
                  {errors.nombreUsuario}
                </span>
              )}
            </div>

            {/* Nuevo campo para nombreEmpresa */}
            <div>
              <label
                htmlFor="nombreEmpresa"
                className="text-sm font-medium text-gray-700"
              >
                Nombre de la Empresa
              </label>
              <div className="relative mt-1">
                <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="nombreEmpresa"
                  type="text"
                  placeholder="Escribe el nombre de tu empresa"
                  value={formData.nombreEmpresa}
                  onChange={(e) =>
                    setFormData({ ...formData, nombreEmpresa: e.target.value })
                  }
                  className={borderInputStyle}
                />
              </div>
            </div>
            {errors.nombreEmpresa && (
              <span className="text-red-500 text-sm">
                {errors.nombreEmpresa}
              </span>
            )}

            <div>
              <label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700"
              >
                Teléfono
              </label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Escribe tu teléfono"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  className={borderInputStyle}
                />
              </div>
              {errors.telefono && (
                <span className="text-red-500 text-sm">{errors.telefono}</span>
              )}
            </div>
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Escribe tu correo"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={borderInputStyle}
                />
              </div>
              {errors.email && (
                <span className="text-red-500 text-sm">{errors.email}</span>
              )}
            </div>

            <div>
              <label
                htmlFor="direccion"
                className="text-sm font-medium text-gray-700"
              >
                Direccion
              </label>
              <div className="relative mt-1">
                <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="direccion"
                  type="direccion"
                  placeholder="Escribe tu direccion"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  className={borderInputStyle}
                />
              </div>
              {errors.direccion && (
                <span className="text-red-500 text-sm">{errors.direccion}</span>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Escribe tu contraseña"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={borderInputStyle}
                />
              </div>
              {errors.password && (
                <span className="text-red-500 text-sm">{errors.password}</span>
              )}
            </div>
            {/* Nuevo campo para NIT */}
            <div>
              <label
                htmlFor="nit"
                className="text-sm font-medium text-gray-700"
              >
                NIT
              </label>
              <div className="relative mt-1">
                <UserCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  autoComplete="new-password"
                  id="nit"
                  type="text"
                  placeholder="Escribe tu NIT"
                  value={formData.nit}
                  onChange={(e) =>
                    setFormData({ ...formData, nit: e.target.value })
                  }
                  className={borderInputStyle}
                />
              </div>
              {errors.nit && (
                <span className="text-red-500 text-sm">{errors.nit}</span>
              )}
            </div>

            {/* Ciudad */}
            <div className="flex flex-col ">
              {loadingRegiones ? (
                <div>Cargando ciudades...</div>
              ) : (
                <div className=" relative">
                  <label
                    htmlFor="nit"
                    className="text-sm font-medium text-gray-700"
                  >
                    Ciudad
                  </label>
                  <SelectConSearch
                    // label="Ciudad"
                    options={municipios}
                    placeholder="Buscar una ciudad"
                    value={formData.ciudad}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, ciudad: value }));
                    }}
                  />
                  {errors.ciudad && (
                    <span className="text-red-500 text-sm">
                      {errors.ciudad}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Campo para subir imagen */}
            <div>
              <label
                htmlFor="imagen"
                className="text-sm font-medium text-gray-700"
              >
                Imagen de perfil
              </label>
              <Input
                id="imagen"
                type="file"
                onChange={handleImageChange}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blueQ mt-6 hover:bg-blue-500 rounded-[40px]"
            >
              Registrate
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterUser;
