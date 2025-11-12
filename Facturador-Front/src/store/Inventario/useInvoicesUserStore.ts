import { create } from 'zustand';
import { FACTURAS_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies'; 
interface User {
    id: number;
    correo: string;
    tenant_id?: string; 
}
interface CreateUserPayload {
    correo: string;
    password: string; 
}
interface UpdateUserPayload {
    correo?: string;
    password?: string; 
    is_active?: boolean; 
}
interface UserStore {
    users: User[];
    isLoading: boolean;
    error: string | null;
    fetchUsers: () => Promise<void>;
    createUser: (userData: CreateUserPayload) => Promise<User | null>; 
    updateUser: (id: number, userData: UpdateUserPayload) => Promise<User | null>;
    deleteUser: (id: number) => Promise<boolean>;
}
export const useUserStore = create<UserStore>((set, get) => ({
    users: [],
    isLoading: false,
    error: null,
    fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            const token = getTokenFromCookies(); 
            if (!token) {
                set({ error: 'No authentication token found.', isLoading: false });
                return;
            }
            const response = await fetch(`${FACTURAS_URL}users/`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, 
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al obtener usuarios');
            }
            const data: User[] = await response.json();
            set({ users: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
    createUser: async (userData: CreateUserPayload) => { 
        set({ isLoading: true, error: null });
        try {
            const apiPayload = {
                correo: userData.correo,
                password: userData.password, 
            };
            const token = getTokenFromCookies(); 
            if (!token) {
                set({ error: 'No authentication token found.', isLoading: false });
                return null;
            }
            const response = await fetch(`${FACTURAS_URL}users/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, 
                },
                body: JSON.stringify(apiPayload), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || errorData.message || 'Error al crear el usuario');
            }
            const newUser: User = await response.json();
            set((state) => ({
                users: [...state.users, newUser],
                isLoading: false,
            }));
            return newUser;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
        }
    },
    updateUser: async (id: number, userData: UpdateUserPayload) => {
        set({ isLoading: true, error: null });
        try {
            const updatedApiPayload: any = { ...userData };
            const token = getTokenFromCookies(); 
            if (!token) {
                set({ error: 'No authentication token found.', isLoading: false });
                return null;
            }
            const response = await fetch(`${FACTURAS_URL}users/${id}/`, {
                method: 'PUT', 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, 
                },
                body: JSON.stringify(updatedApiPayload), 
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || errorData.message || 'Error al actualizar usuario');
            }
            const updatedUser: User = await response.json();
            set((state) => ({
                users: state.users.map((user) =>
                    user.id === id ? updatedUser : user
                ),
                isLoading: false,
            }));
            return updatedUser;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
        }
    },

    deleteUser: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const token = getTokenFromCookies(); 
            if (!token) {
                set({ error: 'No authentication token found.', isLoading: false });
                return false;
            }

            const response = await fetch(`${FACTURAS_URL}users/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`, 
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || errorData.message || 'Error al eliminar usuario');
            }
            set((state) => ({
                users: state.users.filter((user) => user.id !== id),
                isLoading: false,
            }));
            return true;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
        }
    },
}));