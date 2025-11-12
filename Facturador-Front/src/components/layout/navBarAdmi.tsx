import React, { useEffect, useRef, useState } from 'react';
import { MdPayment } from 'react-icons/md';
import { MdPerson } from 'react-icons/md';
import { ArrowLeft, ArrowRight, MapPin, Menu, X } from 'lucide-react';
import Image from 'next/image';
import logoImg from '@/../../public/anuncio.jpg';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MdOutlineLogout,
  MdOutlineSpaceDashboard,
  MdNotificationsActive,
  MdModeEdit,
} from 'react-icons/md';
import { useUserStore } from '@/store/useUser';
import { useConsecutivosStore } from '@/store/useConsecutivoStore';
import EditorDeInfoUsuario from '../ui/editorDeInfoUsuario';
import handleGlobalLogOut from '@/helpers/logOutGlobal';
import FormTarjeta from '../../features/pasarelaDePagos/formTarjeta';

const NavBarAdmi: React.FC = () => {
  const router = useRouter();
  const { logout } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agregarTarjetaOpen, setAgregarTarjetaOpen] = useState(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<string[]>([]);
  const { user, traerInfoDeUsuarios, infoDelUsuario } = useUserStore();
  const { fetchConsecutivos, consecutivos, loading, error } =
    useConsecutivosStore();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const currentClickRef = useRef<EventTarget | null>(null);

  const pathname = usePathname();
  const useIsAdminRoute = () => {
    setIsAdminRoute(
      pathname?.startsWith('/admin/') || pathname?.startsWith('/chartBar/')
    );
  };

  const isAdminFunction = async () => {
    if (!infoDelUsuario) {
      await traerInfoDeUsuarios();
    }

    if (infoDelUsuario?.rol === '3' || infoDelUsuario?.rol === '2') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const handleShowModal = (event: React.MouseEvent<HTMLElement>) => {
    currentClickRef.current = event.target;
    setShowNotifications(false);
    setIsOpen(false);
    setShowModal((prevShowModal) => !prevShowModal);
  };

  const openImageUploadModal = () => {
    setIsModalOpen(true);
  };

  const closeImageUploadModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    traerInfoDeUsuarios();
    fetchConsecutivos();
    useIsAdminRoute();
    isAdminFunction();
  }, []);

  useEffect(() => {
    if (infoDelUsuario?.dias_restantes < 7 && notifications.length < 1) {
      notifications.push(
        `Faltan ${infoDelUsuario.dias_restantes} dias para que acabe tu suscripcion`
      );
    }
  }, []);

  const handleShowNotifications = (
    event: React.MouseEvent<SVGElement | HTMLElement>
  ) => {
    currentClickRef.current = event.target;
    if (showNotifications === true) {
      handleCloseNotificaciones();
    } else if (showNotifications === false) {
      setIsOpen(false);
      setShowModal(false);
      setShowNotifications(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleLogOut = async () => {
    handleGlobalLogOut();
    router.push('/');
  };

  const handleCloseNotificaciones = () => {
    setShowNotifications(false);
    // setNotifications([]);
  };

  const handleDropdownToggle = () => {
    setIsOpen((prev) => {
      // Cuando el dropdown se abre o cierra, cerramos los demás modales
      if (!prev) {
        setShowModal(false); // Cierra el modal de usuario
        handleCloseNotificaciones(); // Cierra las notificaciones
      }
      return !prev;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Verifica si el clic fue fuera del modal de usuario
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowModal(false); // Cierra el modal de usuario si el clic es fuera
      }

      // Verifica si el clic fue fuera del modal de notificaciones
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        handleCloseNotificaciones(); // Cierra las notificaciones si el clic es fuera
      }

      // Verifica si el clic fue fuera del DropdownMenu (si está abierto)
      if (
        isOpen &&
        !document
          .querySelector('.dropdown-menu')
          ?.contains(event.target as Node)
      ) {
        setIsOpen(false); // Cierra el menú desplegable si el clic es fuera
      }
    };

    // Añadir el listener cuando el componente se monta
    document.addEventListener('mousedown', handleClickOutside);

    // Limpiar el listener cuando el componente se desmonta
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showNotifications]);

  return (
    <div className="fixed top-0 left-0 right-0 h-20 border-b bg-white z-50">
      <div className="flex h-full justify-between items-center px-4 md:px-8">
        {/* Título alineado a la izquierda con margen */}
        {/* <h1 className="ml-8 md:ml-16 text-xl md:text-3xl leading-7 md:leading-9 font-bold font-montserrat text-[#6F6F6F] flex flex-wrap items-center">
          <span className="hidden md:flex flex-1 text-center md:text-left">{`Quality Soft Service |`}</span>
          <span className="text-sm md:text-lg font-montserrat font-normal ml-4 text-[#6F6F6F] text-center md:text-right flex items-center">
            {infoDelUsuario?.nombre}
          </span>
        </h1> */}

        <h1 className="ml-8 md:ml-16 text-base md:text-2xl leading-6 md:leading-8 font-bold font-montserrat text-[#6F6F6F] hidden md:flex flex-row items-center">
          {/* Bloque izquierdo: Quality Soft + Eslogan */}
          <div className="flex flex-col leading-tight">
            <span>Quality Soft Service</span>
            <span className="text-[10px] font-normal mt-0.5">
              Construya con liquidez. Facture con Quality
            </span>
          </div>

          {/* Separador */}
          <span className="mx-4  text-xl">|</span>

          {/* Nombre del usuario */}
          <span className="text-base font-montserrat font-normal text-[#6F6F6F]">
            {infoDelUsuario?.nombre}
          </span>
        </h1>

        <FormTarjeta
          isOpen={agregarTarjetaOpen}
          onClose={() => setAgregarTarjetaOpen(false)}
        />
        {/* Sección de acciones a la derecha */}
        <div className="flex items-center">
          {/* Seccion de colombia y centro de ayuda */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Colombia</span>
            </div>
            <a
              href="#"
              className="text-sm text-gray-600 hover:underline border border-gray-300 rounded-md px-3 py-2"
            >
              Centro de ayuda
            </a>
          </div>

          {/* Dropdown para móviles */}
          <div className="md:hidden">
            <DropdownMenu open={isOpen} onOpenChange={handleDropdownToggle}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  {isOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="m-2 border border-gray-300 rounded-md">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Colombia</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="m-2 border border-gray-300 rounded-md">
                  <span>Centro de ayuda</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative ml-3">
            <MdNotificationsActive
              className="w-6 h-6 text-gray-600 cursor-pointer"
              onClick={handleShowNotifications}
            />

            {notifications.length > 0 && (
              <span
                onClick={handleShowNotifications}
                className="absolute -top-2 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-5 flex items-center justify-center"
              >
                {notifications.length}
              </span>
            )}
            {showNotifications && (
              <div
                ref={notificationsRef}
                className="absolute top-10 md:right-0 -right-10 bg-white border border-gray-300 rounded-md shadow-md w-[800px] p-4 z-50"
                // className="absolute top-10 md:right-0 -right-10 bg-white border border-gray-300 rounded-md shadow-md w-64 p-4 z-50"
              >
                {/* <img
                  src="../../../anuncio.jpg"
                  alt="Quality Logo"
                  className="w-[1000px] h-auto"
                /> */}

                <ul className="text-sm text-gray-700">
                  {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <li key={index} className="mb-2">
                        {notification}
                      </li>
                    ))
                  ) : (
                    <li>No hay notificaciones nuevas</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 ml-3">
            {/* Foto de usuario */}
            <div className="relative">
              {infoDelUsuario?.imagen ? (
                <img
                  className="w-12 h-12 rounded-full cursor-pointer" // Aumento el tamaño de la foto
                  src={infoDelUsuario.imagen}
                  alt="User Profile"
                  onClick={handleShowModal}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer" // Tamaño y fondo neutro
                  onClick={handleShowModal}
                >
                  <MdPerson className="text-gray-600" />{' '}
                </div>
              )}

              {/* Lápiz para editar la foto */}
              <div
                className="absolute -top-1 -right-1 bg-white rounded-full p-1 cursor-pointer"
                onClick={openImageUploadModal}
              >
                <MdModeEdit className="text-[#05264E] text-sm" />
              </div>

              {showModal && (
                <div
                  className="absolute top-12 right-0 bg-white border border-gray-300 rounded-md shadow-md w-48 p-4 z-50"
                  ref={modalRef}
                >
                  <ul className="flex flex-col gap-3">
                    <li
                      onClick={handleCloseModal}
                      className="flex items-center gap-2"
                    >
                      <MdOutlineSpaceDashboard className="text-[#05264E] text-base" />
                      <a href="/dashboard" className="text-[#05264E] text-sm">
                        Panel de control
                      </a>
                    </li>
                    <li
                      onClick={handleCloseModal}
                      className="flex items-center gap-2"
                    >
                      <MdPayment className="text-[#05264E] text-base" />{' '}
                      {/* Ícono relacionado con pagos */}
                      <a
                        href="/pasarelaDePagos"
                        className="text-[#05264E] text-sm"
                      >
                        Pagar Subscripcion
                      </a>
                    </li>
                    {/* <li
                      onClick={handleCloseModal}
                      className="flex items-center gap-2"
                    >
                      <MdPayment className="text-[#05264E] text-base" />{' '}
                      <button
                        onClick={() => {
                          setAgregarTarjetaOpen(true);
                        }}
                        className="text-[#05264E] text-sm"
                      >
                        Agregar Tarjeta
                      </button>
                    </li> */}
                    {isAdminRoute && (
                      <li
                        onClick={() => {
                          router.push('/gestionDeFacturasElectronicas');
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <ArrowLeft className="text-[#05264E] text-base" />
                        <a className="text-[#05264E] text-sm">Facturar</a>
                      </li>
                    )}
                    {!isAdminRoute && isAdmin && (
                      <li
                        onClick={() => {
                          router.push('/admin/');
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <ArrowRight className="text-[#05264E] text-base" />
                        <a className="text-[#05264E] text-sm">Dashboard</a>
                      </li>
                    )}

                    <li
                      onClick={handleLogOut}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <MdOutlineLogout className="text-[#05264E] text-base" />
                      <a className="text-[#05264E] text-sm">Cerrar sesión</a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          {isModalOpen && (
            <EditorDeInfoUsuario onClose={closeImageUploadModal} />
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBarAdmi;
