'use client';
import React from 'react';
import OnlyAdminRoute from '@/helpers/OnlyAdminRoute';
import LayoutDashboard from '@/components/layout/LayoutDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { Search, Trash } from 'lucide-react';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { useUserStore } from '@/store/useUser';
import { DialogDescription } from '@radix-ui/react-dialog';
import AdminSelector from '@/features/admin/adminSelector';
import UsuarioModal from '@/features/admin/UsuarioModal';
import { todaLaInfoUsuario } from '@/types/types';
import RegisterUser from '@/components/ui/RegisterUser';
import { confirm } from '@/components/feedback/ConfirmOption';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';

const tiposDeUsuarios = ['Todos', 'Administradores', 'Usuarios'];

export default function AdminPanel() {
  const {
    fetchAllUsers,
    fetchUsuariosByTokenAdmin,
    usuarios,
    fetchInfoUsuario,
    desvincularAdminDeUsuario,
    asignarAdminAUsuario,
    infoUser,
    actualizarInfoDeUsuario,
    habilitarDeshabilitarUsuarios,
  } = useAdminStore();
  const { traerInfoDeUsuarios, infoDelUsuario } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [informacionModal, setInformacionModal] =
    useState<todaLaInfoUsuario | null>(null);
  const [openUserId, setOpenUserId] = useState(false);
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [esCreacion, setEsCreacion] = useState(false);
  const [administradorSeleccionado, setAdministradorSeleccionado] =
    useState('Todos');
  const [tipoDeUsuarioFilter, setTipoDeUsuarioFilter] = useState('Todos');

  const idDelActualUsuario = infoDelUsuario?.id || '1';
  const isSuperAdmin = infoDelUsuario?.rol === '2';

  const administradores = usuarios
    .filter((x) => x.rol === '2' || x.rol === '3')
    .map(({ id, nombre }) => ({ id, nombre }));

  const opcionesAdministradores = [
    { id: 'Todos', nombre: 'Todos' },
    ...usuarios
      .filter((x) => x.rol === '2' || x.rol === '3')
      .map(({ id, nombre }) => ({ id, nombre })),
  ];

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAdministradorSeleccionado('Todos');
    setTipoDeUsuarioFilter('Todos');
    setSearchQuery(event.target.value);
  };

  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    typeOfDoc: '',
    DNI: '',
  });

  const handleTipoUsuarioChange = (value: string) => {
    setSearchQuery('');

    setTipoDeUsuarioFilter(value);
    if (value !== 'Todos') {
      setAdministradorSeleccionado('Todos');
    }
  };

  const handleAdministradorChange = (value: string) => {
    setSearchQuery('');
    setAdministradorSeleccionado(value);
    if (value !== 'Todos') {
      setTipoDeUsuarioFilter('Todos');
    }
  };

  // Actualiza el modal cuando infoUser cambia.
  useEffect(() => {
    setInformacionModal(infoUser);
  }, [infoUser]);

  useEffect(() => {
    if (!infoDelUsuario) {
      handleFetch();
      return;
    }
    if (infoDelUsuario.rol === '2') {
      fetchAllUsers();
    } else {
      fetchUsuariosByTokenAdmin();
    }
  }, [infoDelUsuario]);

  const handleFetch = () => {
    traerInfoDeUsuarios();
  };

  const filteredUsers = usuarios.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      user.nombre.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query) ||
      user.nit.toLowerCase().includes(query) ||
      user.telefono.toLowerCase().includes(query);

    const matchesTipoDeFactura = (() => {
      switch (tipoDeUsuarioFilter) {
        case 'Todos':
          return true;
        case 'Administradores':
          return user.rol === '2' || user.rol === '3';
        case 'Usuarios':
          return user.rol === '1';
        default:
          return true;
      }
    })();

    const matchesAdmin =
      administradorSeleccionado === 'Todos' ||
      (user.administradoresAsignados &&
        user.administradoresAsignados.includes(administradorSeleccionado));

    return matchesSearch && matchesTipoDeFactura && matchesAdmin;
  });

  const handleCloseUsuarioModal = () => {
    setOpenUserId(false);
    setInformacionModal(null);
  };

  const handleVerUsuario = async (id: string, rol: string) => {
    if (rol === '2') {
      showErrorToast('El usuario es Super Admin, no se puede modificar.');
      return;
    }
    // Limpia la información previa
    setInformacionModal(null);
    // Espera a obtener la nueva información
    const info = await fetchInfoUsuario(id);
    setInformacionModal(info);
    setEsCreacion(false);
    setOpenUserId(true);
  };

  const handleCrearUsuario = () => {
    setInformacionModal(null);
    setOpenUserId(true);
  };

  // Función para manejar el cambio del switch
  const onToggleActivation = (e: any, user: any) => {
    // showErrorToast('Funcion no disponible aun.');
    // return;

    if (user.rol === '2') {
      showErrorToast('El usuario es Super Admin, no se puede modificar.');
      return;
    }
    if (!user.id) showErrorToast('No hay id');
    habilitarDeshabilitarUsuarios(user.id);
    const newState = e.target.checked;
    // setIsActive(newState);
  };

  return (
    <OnlyAdminRoute>
      <LayoutDashboard>
        <div className="bg-[#F7F7F7] pt-14 w-full pb-14 overflow-hidden flex justify-center">
          {/* Conbtenido */}
          <div className="flex flex-col px-4 w-[1000px] max-w-full ">
            {/* Heather */}
            <div className="flex mb-10">
              {/* titulo y searchbar */}
              <div>
                {/* Titulo */}
                <h1
                  onClick={handleFetch}
                  className="w-full md:w-auto h-10 text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F]"
                >
                  Usuarios
                </h1>
                {/* search bar */}
                <div className="flex-1 mt-4 min-w-[250px] max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-4 bg-white rounded-[40px] self-end">
                  <input
                    type="text"
                    placeholder="Buscar Usuario"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full border-none outline-none"
                  />
                  <Search className="bg-[#00A7E1] text-white p-2 rounded-[20px] w-[30px] h-[30px]" />
                </div>
              </div>

              {/* Filtros de usuarios */}
              {isSuperAdmin && (
                <div className="flex mt-6 ml-auto flex-wrap md:flex-nowrap items-center gap-4">
                  {/* Filtro de Tipo de usuarios */}
                  <div className="flex flex-col">
                    <h2 className="text-sm md:text-base font-montserrat font-normal text-[#6F6F6F] mb-2">
                      Tipo de usuarios
                    </h2>
                    <SimpleSelect
                      options={tiposDeUsuarios}
                      width="100%"
                      value={tipoDeUsuarioFilter}
                      onChange={handleTipoUsuarioChange}
                      height="8"
                    />
                  </div>

                  {/* Filtro de Administradores */}
                  <div className="flex flex-col">
                    <h2 className="text-sm md:text-base font-montserrat font-normal text-[#6F6F6F] mb-2">
                      Usuarios de Administradores
                    </h2>
                    <SimpleSelect
                      options={opcionesAdministradores}
                      width="100%"
                      value={administradorSeleccionado}
                      onChange={handleAdministradorChange}
                      height="8"
                    />
                  </div>
                </div>
              )}
            </div>
            {/* cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-[2.4rem] justify-items-center mb-60">
              {/* Add User Card */}
              {isSuperAdmin && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger
                    asChild
                    onClick={() => {
                      handleCrearUsuario();
                    }}
                  >
                    <Card className="border-dashed w-full max-w-[243px] h-full flex flex-col items-center justify-start">
                      <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center space-y-4 ">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-muted-foreground"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                          </svg>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Agregar otro Usuario
                        </p>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                </Dialog>
              )}
              {/* User Cards */}

              {filteredUsers.map((user) => {
                // Estado local para el switch, inicializado según el rol del usuario.
                const isAdmin = user.rol !== '1';
                const isActive = user.activo === '1';
                const handleSwitchChange = async (checked: boolean) => {
                  // Si se intenta apagar eal switch, se muestra la advertencia.
                  if (user.rol === '2') {
                    showErrorToast(
                      'El usuario es Super Admin, no se puede modificar.'
                    );
                    return;
                  }
                  if (checked) {
                    const confirmado = await confirm({
                      title:
                        'Estás volviendo al usuario administrador. ¿Deseas continuar?',
                    });
                    if (!confirmado) return;
                    actualizarInfoDeUsuario(user.id, { ID_ROL: '3' });
                  } else {
                    const confirmado = await confirm({
                      title:
                        'Estás revocando los privilegios del usuario. ¿Deseas continuar?',
                    });

                    if (!confirmado) return;
                    //LO MANDAMOS A HACER ADMIN
                    actualizarInfoDeUsuario(user.id, { ID_ROL: '1' });
                  }
                };

                const handleAsignarAdministradores = (
                  selectedIds: string[],
                  userId: string
                ) => {
                  // Convertimos la lista actual de administradores asignados en un Set para búsquedas rápidas.
                  const currentAssignedSet = new Set(
                    user.administradoresAsignados
                  );
                  const newSelectedSet = new Set(selectedIds);

                  // Asignamos los nuevos administradores que no estaban previamente asignados.
                  newSelectedSet.forEach((id) => {
                    if (!currentAssignedSet.has(id)) {
                      asignarAdminAUsuario(id, userId);
                    }
                  });

                  // Desvinculamos los administradores que se han removido de la selección.
                  currentAssignedSet.forEach((id) => {
                    if (!newSelectedSet.has(id)) {
                      desvincularAdminDeUsuario(id, userId);
                    }
                  });
                };

                return (
                  <Dialog key={user.id}>
                    <DialogTrigger asChild>
                      <Card
                        className="w-full max-w-[243px] h-full flex flex-col"
                        onClick={() => handleVerUsuario(user.id, user.rol)}
                      >
                        <CardContent className="h-full p-4 flex flex-col justify-between items-center text-center space-y-4">
                          {/* Avatar con marco */}
                          <div className="w-32 h-32 rounded-full bg-[#00A7E1] mt-1 sm:mt-4 p-1 flex items-center justify-center">
                            <div
                              className="w-full h-full rounded-full bg-cover bg-center"
                              style={{ backgroundImage: `url(${user.imagen})` }}
                            />
                          </div>

                          {/* Datos del usuario */}
                          <div className="space-y-1 w-full px-4">
                            <p className="font-semibold text-sm text-[#667085] line-clamp-1">
                              {user.nombre}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Nit: {user.nit}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ID: {user.id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Teléfono: {user.telefono}
                            </p>
                          </div>

                          {/* Íconos de acción */}
                          <div className="flex items-center justify-center space-x-4 w-full px-4">
                            {/* Icono lápiz */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 flex-shrink-0 leading-none align-middle"
                              fill="none"
                              stroke="#00A7E1"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>

                            {/* Grupo de iconos a la derecha */}
                            <div className="flex items-center space-x-4 ml-auto">
                              {isSuperAdmin && (
                                <>
                                  {/* Selector de administradores */}
                                  {user.rol !== '2' && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <AdminSelector
                                        administradores={administradores}
                                        administradoresAsignados={
                                          user.administradoresAsignados
                                        }
                                        onChange={(selectedIds) =>
                                          handleAsignarAdministradores(
                                            selectedIds,
                                            user.id
                                          )
                                        }
                                      />
                                    </div>
                                  )}

                                  {/* Icono estrella */}
                                  <div
                                    className={`cursor-pointer ${
                                      isAdmin ? 'text-BlueQ' : 'text-gray-300'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSwitchChange(!isAdmin);
                                    }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-6 w-6 flex-shrink-0 leading-none align-middle"
                                      fill={isAdmin ? '#00A7E1' : 'none'}
                                      stroke={isAdmin ? 'none' : '#00A7E1'}
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                  </div>
                                </>
                              )}

                              {/* Switch activar/desactivar */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center"
                              >
                                <label className="relative inline-block w-10 h-6">
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={user.activo === '1'}
                                    onChange={(e) =>
                                      onToggleActivation(e, user)
                                    }
                                  />
                                  <span
                                    className={`block w-10 h-6 rounded-full transition-colors ${
                                      user.activo === '1'
                                        ? 'bg-[#00A7E1]'
                                        : 'bg-gray-300'
                                    }`}
                                  ></span>
                                  <span
                                    className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                                      user.activo === '1' ? 'translate-x-4' : ''
                                    }`}
                                  ></span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                  </Dialog>
                );
              })}
            </div>
          </div>
          <UsuarioModal
            isOpen={openUserId}
            onClose={handleCloseUsuarioModal}
            infoUsuario={informacionModal || null}
          />
        </div>
      </LayoutDashboard>
    </OnlyAdminRoute>
  );
}
