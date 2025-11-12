'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logoImg from '@/../../public/logo.webp';
import { Lock, Mail, Phone, User, UserCircle, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUser';
import TerminosYCondiciones from '@/components/feedback/terminosYCondiciones';
import PoliticaDePrivacidad from '@/components/feedback/politicaDePrivacidad';
import { useRegionesStore } from '@/store/useRegionesStore';
import SelectConSearch from '@/components/ui/selectConSearch';

export default function Register() {
  const {
    municipios,
    fetchRegiones,
    loading: loadingRegiones,
  } = useRegionesStore();
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
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
  const [imagen, setImagen] = useState<File | null>(null);
  const [errors, setErrors] = useState<any>({});
  const router = useRouter();
  const { register } = useUserStore();

  useEffect(() => {
    fetchRegiones();
  }, []);

  const borderInputStyle =
    'pl-10 border-0 rounded-none border-b-2 border-[#BFBFBF]';

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
    if (!isChecked)
      newErrors.terms = 'Debes aceptar los términos y condiciones';

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0; // Si no hay errores, el formulario es válido
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    const response = await register(formData, imagen);
    // if (response.success) {
    //   router.push('/login');
    // }
  };

  const handleIrALanding = () => {
    router.push('/');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagen(e.target.files[0]);
    }
  };

  const handleTermsOpen = () => setIsTermsOpen(true);
  const handlePrivacyOpen = () => setIsPrivacyOpen(true);
  const handleCheckboxChange = () => setIsChecked(!isChecked);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="w-full p-8 px-12 lg:px-[75px] lg:w-7/12">
          <TerminosYCondiciones
            isOpen={isTermsOpen}
            onClose={() => setIsTermsOpen(false)}
          />
          <PoliticaDePrivacidad
            isOpen={isPrivacyOpen}
            onClose={() => setIsPrivacyOpen(false)}
          />
          <div className="mb-6 flex justify-center">
            <img
              onClick={handleIrALanding}
              src="/logo_con_palito.jpeg"
              alt="Quality Logo"
              width="100"
              style={{ height: 'auto' }}
            />
          </div>
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
            {/* Checkbox de términos y condiciones */}
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="terms"
                checked={isChecked}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <label className="text-sm">
                Acepto los{' '}
                <span
                  className="cursor-pointer underline text-blueQ"
                  onClick={handleTermsOpen}
                >
                  Términos y condiciones
                </span>{' '}
                y la{' '}
                <span
                  className="cursor-pointer underline text-blueQ"
                  onClick={handlePrivacyOpen}
                >
                  Política de privacidad
                </span>
              </label>
              {errors.terms && (
                <span className="text-red-500 text-sm">{errors.terms}</span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blueQ mt-6 hover:bg-blue-500 rounded-[40px]"
            >
              Registrate
            </Button>
            <div className="text-center text-sm">
              <span className="text-gray-600">¿Ya tienes una cuenta? </span>
              <Link
                href="/login"
                className="text-blue-500 hover:text-blue-600 "
              >
                Inicia sesión aquí
              </Link>
            </div>
          </form>
        </div>
        <div className="hidden w-5/12 bg-blueQ lg:block "></div>
      </div>
    </div>
  );
}
