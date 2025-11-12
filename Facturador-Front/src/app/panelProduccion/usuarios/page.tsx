'use client';
import { useEffect, useState, useMemo } from 'react';
import PrivateRoute from '@/helpers/PrivateRoute';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import { useUserStore } from '@/store/Inventario/useUserStore';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { Search } from 'lucide-react';
interface Role {
    id: string;
    name: string;
    description: string;
}

interface User {
    id: string;
    username: string;
    role_id: string;
    is_active: boolean;
    role?: Role;
}

interface SortConfig {
    key: keyof User | 'role' | null;
    direction: 'asc' | 'desc';
}

interface TableColumn {
    key: keyof User | 'role' | 'actions';
    label: string;
    visible: boolean;
}

interface CreateUserPayload {
    username: string;
    password: string;
    role_id: string;
    is_active: boolean;
}

export default function RolesYUsuariosPage() {
    const { roles, fetchRoles, createRole } = useUserStore();
    const { users, fetchUsers, createUser, updateUser, deleteUser } = useUserStore();
    const [newRoleName, setNewRoleName] = useState('');
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUserData, setNewUserData] = useState<CreateUserPayload>({
        username: '',
        password: '',
        role_id: '',
        is_active: true,
    });
    const [searchUser, setSearchUser] = useState('');
    const [explicitSearchQuery, setExplicitSearchQuery] = useState('');
    const [filterRoleId, setFilterRoleId] = useState('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
    const columnasUsuarios: TableColumn[] = useMemo(() => [
        { key: 'username', label: 'Nombre', visible: true },
        { key: 'role', label: 'Rol', visible: true },
        { key: 'is_active', label: 'Activo', visible: true },
        { key: 'actions', label: 'Acciones', visible: true },
    ], []);
    useEffect(() => {
        fetchRoles();
        fetchUsers();
    }, [fetchRoles, fetchUsers]);
    const showSuccessToast = (message: string) => { console.log('Éxito:', message); };
    const showErrorToast = (message: string) => { console.error('Error:', message); };
    const confirmAction = async (title: string, message: string = "¿Deseas continuar?") => {
        return window.confirm(`${title}\n${message}`);
    };
    const handleCreateRole = async () => {
        if (!newRoleName.trim()) {
            showErrorToast('El nombre del rol no puede estar vacío.');
            return;
        }
        try {
            await createRole({ name: newRoleName.trim(), description: 'Descripción por defecto' });
            setNewRoleName('');
            setIsCreatingRole(false);
            fetchRoles();
            showSuccessToast('Rol creado exitosamente.');
        } catch (error: any) {
            showErrorToast(`Error al crear el rol: ${error.message || 'Desconocido'}`);
        }
    };
    const handleUserRoleChange = async (userId: string, newRoleId: string) => {
        try {
            await updateUser(userId, { role_id: newRoleId });
            fetchUsers();
            showSuccessToast('Rol de usuario actualizado exitosamente.');
        } catch (error: any) {
            showErrorToast(`Error al actualizar el rol: ${error.message || 'Desconocido'}`);
        }
    };
    const handleDeleteUser = async (userId: string, username: string) => {
        const confirmado = await confirmAction(`Eliminar usuario "${username}"`, '¿Estás seguro de que quieres eliminar este usuario? Esta acción es irreversible.');
        if (!confirmado) return;
        try {
            await deleteUser(userId);
            fetchUsers();
            showSuccessToast(`Usuario "${username}" eliminado exitosamente.`);
            if (currentItems.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (error: any) {
            showErrorToast(`Error al eliminar el usuario: ${error.message || 'Desconocido'}`);
        }
    };

    const handleCreateUser = async () => {
        if (!newUserData.username.trim() || !newUserData.password.trim() || !newUserData.role_id) {
            showErrorToast('Por favor, completa todos los campos requeridos (Nombre, Contraseña, Rol).');
            return;
        }
        try {
            await createUser(newUserData);
            setNewUserData({ username: '', password: '', role_id: '', is_active: true });
            setIsCreatingUser(false);
            fetchUsers();
            showSuccessToast('Usuario creado exitosamente.');
        } catch (error: any) {
            showErrorToast(`Error al crear el usuario: ${error.message || 'Desconocido'}`);
        }
    };
    const sortUsers = (key: keyof User | 'role') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    const filteredAndSortedUsers: User[] = useMemo(() => {
        let processedUsers: User[] = users.map(user => ({
            ...user,
            role: roles.find(r => r.id === user.role_id)
        }));
        const currentSearchTerm = explicitSearchQuery || searchUser;
        if (currentSearchTerm) {
            processedUsers = processedUsers.filter(u =>
                u.username.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                (u.role?.name && u.role.name.toLowerCase().includes(currentSearchTerm.toLowerCase()))
            );
        }
        if (filterRoleId) {
            processedUsers = processedUsers.filter(u => u.role_id === filterRoleId);
        }
        if (sortConfig.key) {
            processedUsers.sort((a, b) => {
                let aValue: string | boolean | undefined;
                let bValue: string | boolean | undefined;
                const sortKey = sortConfig.key;
                if (sortKey === 'role') {
                    aValue = a.role?.name || '';
                    bValue = b.role?.name || '';
                } else if (sortKey === 'is_active') {
                    aValue = a.is_active;
                    bValue = b.is_active;
                } else {
                    aValue = (a[sortKey as keyof User] as string | undefined) || '';
                    bValue = (b[sortKey as keyof User] as string | undefined) || '';
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    return sortConfig.direction === 'asc' ? (aValue === bValue ? 0 : aValue ? -1 : 1) : (aValue === bValue ? 0 : aValue ? 1 : -1);
                }
                return 0;
            });
        }
        return processedUsers;
    }, [users, searchUser, explicitSearchQuery, filterRoleId, sortConfig, roles]);
    const totalPages: number = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
    const indexOfLastItem: number = currentPage * itemsPerPage;
    const indexOfFirstItem: number = indexOfLastItem - itemsPerPage;
    const currentItems: User[] = filteredAndSortedUsers.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber: number) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };
    const pageNumbers: number[] = useMemo(() => {
        const pages: number[] = [];
        const maxPagesToShow = 5;
        let startPage: number, endPage: number;
        if (totalPages <= maxPagesToShow) {
            startPage = 1;
            endPage = totalPages;
        } else {
            if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
                startPage = 1;
                endPage = maxPagesToShow;
            } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
                startPage = totalPages - maxPagesToShow + 1;
                endPage = totalPages;
            } else {
                startPage = currentPage - Math.floor(maxPagesToShow / 2);
                endPage = currentPage + Math.floor(maxPagesToShow / 2);
            }
        }
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    }, [totalPages, currentPage]);
    const estilosTitulos: string = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
    return (
        <PrivateRoute>
            <LayoutAdmi>
                <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-8  w-full overflow-hidden ">
                    <div className="w-full">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                                <input
                                    type="text"
                                    placeholder="Buscar usuario por nombre o rol"
                                    value={searchUser}
                                    onChange={(e) => {
                                        setSearchUser(e.target.value);
                                        setExplicitSearchQuery('');
                                        setCurrentPage(1);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setExplicitSearchQuery(searchUser);
                                            setCurrentPage(1);
                                        }
                                    }}
                                    className="w-full border-none outline-none"
                                />
                                <Search
                                    className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px] cursor-pointer ml-2"
                                    onClick={() => {
                                        setExplicitSearchQuery(searchUser);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>

                            <h1
                                className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none"
                            >
                                Administración de Usuarios
                            </h1>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsCreatingUser(true);
                                        setNewUserData({ username: '', password: '', role_id: '', is_active: true });
                                    }}
                                    className="bg-[#00A7E1] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-auto"
                                >
                                    + Crear usuario
                                </button>
                                <button
                                    onClick={() => setIsCreatingRole(true)}
                                    className="bg-[#00A7E1] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-auto"
                                >
                                    + Crear rol
                                </button>
                            </div>
                        </div>
                        {isCreatingRole && (
                            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center">
                                <input
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="Nombre del nuevo rol"
                                    className="p-2 border border-gray-300 rounded-md flex-grow focus:outline-none focus:ring-2 focus:ring-[#00A7E1]"
                                />
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={handleCreateRole}
                                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm w-full sm:w-auto hover:bg-green-700 transition-colors"
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setNewRoleName('');
                                            setIsCreatingRole(false);
                                        }}
                                        className="text-gray-600 px-4 py-2 rounded-md text-sm w-full sm:w-auto border border-gray-300 hover:bg-gray-100 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4 items-center h-auto sm:h-[50px] border border-[#D5D5D5] px-[20px] bg-white rounded-[40px] p-4 mb-6">
                            <SimpleSelect
                                options={roles.map(r => ({ label: r.name, value: r.id }))}
                                value={newUserData.role_id}
                                onChange={(value) => setNewUserData(prev => ({ ...prev, role_id: value }))}
                                placeholder="Selecciona un rol"
                            />
                        </div>
                        {filteredAndSortedUsers.length === 0 && (
                            <p className="text-gray-600">No hay usuarios registrados que coincidan con la búsqueda o el filtro.</p>
                        )}
                        <div className="hidden sm:block rounded-[8px] mt-6 overflow-x-auto">
                            <table className="min-w-full bg-white rounded-[8px]">
                                <thead className="bg-[#FCFCFD] rounded-[8px]">
                                    <tr>
                                        {columnasUsuarios
                                            .filter((col) => col.visible)
                                            .map((col) => (
                                                <th
                                                    key={col.key}
                                                    onClick={col.key !== 'actions' ? () => sortUsers(col.key as keyof User | 'role') : undefined}
                                                    className={`${estilosTitulos} ${col.key === 'username' ? 'rounded-tl-[8px]' : ''
                                                        } ${col.key !== 'actions' ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                                    role={col.key !== 'actions' ? 'button' : undefined}
                                                >
                                                    {col.label}{' '}
                                                    {(sortConfig.key === col.key)
                                                        ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                                                        : (col.key !== 'actions' ? '↑' : '')}
                                                </th>
                                            ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(currentItems) && currentItems.map((user) => (
                                        <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                <select
                                                    value={user.role_id}
                                                    onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A7E1]"
                                                >
                                                    {Array.isArray(roles) && roles.map((role) => (
                                                        <option key={role.id} value={role.id}>
                                                            {role.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {user.is_active ? 'Sí' : 'No'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs transition-colors"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {Array.isArray(filteredAndSortedUsers) && filteredAndSortedUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={columnasUsuarios.filter(c => c.visible).length} className="px-4 py-3 text-sm text-gray-600 text-center">No hay usuarios para mostrar.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <nav className="flex justify-center mt-6">
                                <ul className="flex items-center -space-x-px h-10 text-base">
                                    <li>
                                        <button
                                            onClick={() => paginate(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="flex items-center justify-center px-4 h-10 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Anterior
                                        </button>
                                    </li>
                                    {pageNumbers.map((number: number) => (
                                        <li key={number}>
                                            <button
                                                onClick={() => paginate(number)}
                                                className={`flex items-center justify-center px-4 h-10 leading-tight border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${currentPage === number ? 'text-white bg-[#00A7E1] hover:bg-[#008ec1]' : 'text-gray-500 bg-white'
                                                    }`}
                                            >
                                                {number}
                                            </button>
                                        </li>
                                    ))}
                                    <li>
                                        <button
                                            onClick={() => paginate(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Siguiente
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        )}
                    </div>
                    {isCreatingUser && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                                <h2 className="text-xl font-bold mb-4">Crear Nuevo Usuario</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
                                        <input
                                            type="text"
                                            id="username"
                                            value={newUserData.username}
                                            onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A7E1]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                                        <input
                                            type="password"
                                            id="password"
                                            value={newUserData.password}
                                            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A7E1]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="role_id" className="block text-sm font-medium text-gray-700">Rol</label>
                                        <SimpleSelect
                                            options={roles.map(r => ({ label: r.name, value: r.id }))}
                                            value={newUserData.role_id}
                                            onChange={(value) => setNewUserData(prev => ({ ...prev, role_id: value }))}
                                            placeholder="Selecciona un rol"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={newUserData.is_active}
                                            onChange={(e) => setNewUserData({ ...newUserData, is_active: e.target.checked })}
                                            className="h-4 w-4 text-[#00A7E1] focus:ring-[#00A7E1] border-gray-300 rounded"
                                        />
                                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Activo</label>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsCreatingUser(false)}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateUser}
                                        className="bg-[#00A7E1] hover:bg-[#008ec1] text-white px-4 py-2 rounded-md text-sm transition-colors"
                                    >
                                        Crear Usuario
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </LayoutAdmi>
        </PrivateRoute>
    );
}


{/* para cambiar  */ }

{/* 
exito y error
showTemporaryToast
showErrorToast(data.message); */}




{/* modal de confirmación */ }
{/* 
const confirmado = await confirm({
                      title:
                        'Estás volviendo al usuario administrador. ¿Deseas continuar?',
                    });
                    if (!confirmado) return; */}


{/* <SimpleSelect
                          options={nombresDeMetodosDePago} // Opciones cargadas desde zustand
                          width={'100%'}
                          value={formData.medioDePago}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              medioDePago: value,
                            }));
                            setErrors((prev) => ({
                              ...prev,
                              medioDePago: !value,
                            }));
                          }}
                          placeholder="Seleccione un Tipo de Operacion"
                        /> */}
{/* 

Search

<div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar factura"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full border-none outline-none"
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
              </div>

<InputField label="Descripción" name="descripcion" value={formData.descripcion} error={errors.descripcion} onChange={handleChange} />
BOTON ELIMINAR  const estilosBotonAnular =
    'h-5 w-14 text-xs font-medium font-inter text-[#FFFFFF] bg-[#ffb2b2] rounded-[16px] hover:bg-[#FAD4D4]'; */}

