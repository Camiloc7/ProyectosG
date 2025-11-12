'use client';

import { useState, useTransition } from 'react'; // Importar useTransition
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import logoImg from '@/../../public/logo_con_palito.jpeg';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/feedback/Spinner'; // Asegúrate de tener este componente Spinner
import { useUserStore } from '@/store/useUser';

import PoliticaDePrivacidad from '@/components/feedback/politicaDePrivacidad';
import CheckboxUI from '@/components/ui/CheckBoxUI';

export default function Component() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false,
  });

  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });
  const [isChecked, setIsChecked] = useState(true);

  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Estado para controlar la carga
  const [loginError, setLoginError] = useState(''); // Para mostrar el error de login
  const { user, traerInfoDeUsuarios, loginGastro, infoDelUsuario } =
    useUserStore();

  // Usamos useTransition para manejar la navegación sin bloquear la UI
  //  const [isPending, startTransition] = useTransition();

  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar la contraseña

  const { login } = useUserStore();
  const router = useRouter();

  // Usamos useTransition para manejar la navegación sin bloquear la UI
  const [isPending, startTransition] = useTransition();

  const borderInputStyle =
    'pl-10 border-0 rounded-none border-b-2 border-[#BFBFBF]';

  // Función para validar los campos
  const validateForm = () => {
    const newErrors = {
      username: formData.username ? '' : 'El nombre de usuario es obligatorio.',
      password: formData.password ? '' : 'La contraseña es obligatoria.',
    };
    setErrors(newErrors);
    return !newErrors.username && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) return;

    setLoginError('');

    try {
      const response = await login(formData.username, formData.password);

      if (formData.username === 'SUPER ADMIN') {
        await loginGastro(formData.username, formData.password);
      }

      if (!response) {
        console.error('No hay info del usuario');
        return;
      }

      const user = await traerInfoDeUsuarios().catch((error) => {
        console.error('Error al obtener los datos del usuario:', error);
        setLoginError('No se pudieron obtener los datos del usuario');
        setIsLoading(false);
      });

      if (!user) {
        setLoginError('No hay la información del usuario.');
        setIsLoading(false);
        return;
      }

      console.log(user);
      if (user.nombre === 'QUALITY SOFT SERVICE SAS') {
        router.push('/itemsDeVenta/');
        return;
      }

      // Determinar la ruta en función de CONSTRUCTORA
      let targetRoute =
        user.constructora === '1'
          ? '/gestionDeFacturasElectronicas'
          : '/facturacionMixta';

      // Si el usuario tiene rol, verificar redirecciones adicionales
      if (user.rol === '2') {
        targetRoute = '/admin';
      } else if (user.rol === '3') {
        targetRoute = '/admin';
      }

      // Usar startTransition para una navegación sin bloquear la UI
      startTransition(() => {
        router.push(targetRoute);
      });
    } catch (error: any) {
      setLoginError(error.message || 'Error desconocido');
      setIsLoading(false);
    }
  };

  const handlePrivacyOpen = () => setIsPrivacyOpen(true);

  const handleIrALanding = () => {
    router.push('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <PoliticaDePrivacidad
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="hidden w-5/12 bg-blueQ lg:block "></div>
        <div className="w-full p-8 px-12 lg:px-[75px] lg:w-7/12">
          <div className=" flex  flex-col justify-center items-center">
            <img
              onClick={handleIrALanding}
              src="/logo_con_palito.jpeg"
              alt="Quality Logo"
              width="100"
              style={{ height: 'auto' }}
            />
            <span className="text-[14px] text-[#666]">
              Construya con liquidez. Facture con Quality
            </span>
          </div>

          <div className="flex flex-col gap-5 mt-4 w-full">
            <div>
              <label
                htmlFor="username"
                className="text-sm font-medium text-gray-700"
              >
                Nombre
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu nombre de usuario"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    // Validar en tiempo real
                    setErrors((prevErrors) => ({
                      ...prevErrors,
                      username: e.target.value
                        ? ''
                        : 'El nombre de usuario es obligatorio.',
                    }));
                  }}
                  className={borderInputStyle}
                />
                {errors.username && (
                  <p className="text-xs text-red-500">{errors.username}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm text-gray-700 font-bold"
              >
                Contraseña
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'} // Cambiar el tipo según el estado
                  placeholder="Ingresa tu contraseña"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setErrors((prevErrors) => ({
                      ...prevErrors,
                      password: e.target.value
                        ? ''
                        : 'La contraseña es obligatoria.',
                    }));
                  }}
                  className={borderInputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)} // Alternar el estado
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center mt-4">
              <CheckboxUI
                onChange={() => setIsChecked(!isChecked)}
                checked={isChecked}
              />
              <label className="text-sm" onClick={handlePrivacyOpen}>
                Ver los{' '}
                <span className="cursor-pointer underline text-blueQ">
                  Términos y condiciones
                </span>{' '}
                y la{' '}
                <span className="cursor-pointer underline text-blueQ">
                  Política de privacidad
                </span>
              </label>
            </div>

            {/* Mostrar el error del login */}
            {loginError && (
              <p className="text-xs text-red-500 mt-2">{loginError}</p>
            )}

            <Button
              onClick={handleSubmit}
              className="w-full bg-blueQ rounded-[40px] hover:bg-blue-500 mt-8"
              disabled={
                isLoading ||
                !formData.username ||
                !formData.password ||
                !isChecked
              } // Deshabilitar el botón si hay campos vacíos
            >
              {isLoading || isPending ? (
                <Spinner /> // Mostrar el spinner mientras está cargando
              ) : (
                'Inicia sesión'
              )}
            </Button>
            <div className="text-center"></div>
            <div className="text-center text-sm mb-16">
              <span className="text-gray-600">¿No tienes una cuenta? </span>
              <Link href="/register" className="text-blueQ hover:text-blue-600">
                Crea una aquí
              </Link>
              <div className="mt-2">
                <a
                  href="https://qualitysoft.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#7d7d7d] mt-4"
                >
                  Desarrollado por Quality Soft Service V 1.0.1
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
