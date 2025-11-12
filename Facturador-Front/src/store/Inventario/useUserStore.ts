import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Usuario {
  id: string;
  username: string;
  password_hash?: string;
  role_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role: Role;
}

interface CreateUserPayload {
  username: string;
  password: string;
  role_id: string;
  is_active: boolean;
}

interface UpdateUserPayload {
  username?: string;
  password?: string;
  role_id?: string;
  is_active?: boolean;
}

interface InventoryStore {
  users: Usuario[];
  selectedUser: Usuario | null;
  roles: Role[];
  selectedRole: Role | null;
  isLoading: boolean;
  error: string | null;

  fetchUsers: () => Promise<void>;
  fetchUser: (id: string) => Promise<void>;
  createUser: (payload: CreateUserPayload) => Promise<void>;
  updateUser: (id: string, payload: UpdateUserPayload) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  fetchRoles: () => Promise<void>;
  fetchRole: (id: string) => Promise<void>;
  createRole: (role: Omit<Role, 'id'>) => Promise<void>;
  updateRole: (id: string, role: Partial<Omit<Role, 'id'>>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
}

export const useUserStore = create<InventoryStore>((set, get) => ({
  users: [],
  selectedUser: null,
  roles: [],
  selectedRole: null,
  isLoading: false,
  error: null,

  // ----- USUARIOS -----
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}users`); // Usando la ruta GET /users
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: Usuario[] = await res.json();
      const usersArray = Array.isArray(data) ? data : (data as any)?.data || (data as any)?.users || [];
      if (!Array.isArray(usersArray)) {
        console.error('API response for users is not an array:', usersArray);
        throw new Error('Formato de respuesta de usuarios inesperado');
      }
      set({ users: usersArray, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}users/${id}`); // Usando la ruta GET /users/{id}
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: Usuario = await res.json();
      set({ selectedUser: data, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching user:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  createUser: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}users`, { // Usando la ruta POST /users
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      const newUser: Usuario = await res.json();
      set((state) => ({
        users: [...state.users, newUser],
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Error creating user:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  updateUser: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}users/${id}`, { // Asumiendo PATCH /users/{id}
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      const updatedUser: Usuario = await res.json();
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        selectedUser: state.selectedUser?.id === id ? updatedUser : state.selectedUser,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Error updating user:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}users/${id}`, { // Asumiendo DELETE /users/{id}
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Error deleting user:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // ----- ROLES -----
  fetchRoles: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}users/roles`); // ¡Corregido a GET /users/roles!
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const rolesArray = Array.isArray(data) ? data : (data as any)?.data || (data as any)?.roles || [];

      if (!Array.isArray(rolesArray)) {
        console.error('API response for roles is not an array:', data);
        throw new Error('Formato de respuesta de roles inesperado. Se esperaba un array.');
      }

      set({ roles: rolesArray, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchRole: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}users/roles/${id}`); // Usando GET /users/roles/{id}
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: Role = await res.json();
      set({ selectedRole: data, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching role:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  createRole: async (role) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}users/roles`, { // Usando POST /users/roles
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(role),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      const newRole: Role = await res.json();
      set((state) => ({
        roles: [...state.roles, newRole],
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Error creating role:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  updateRole: async (id, role) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}users/roles/${id}`, { // Usando PATCH /users/roles/{id}
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(role),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      const updatedRole: Role = await res.json();
      set((state) => ({
        roles: state.roles.map((r) => (r.id === id ? updatedRole : r)),
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Error updating role:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  deleteRole: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}users/roles/${id}`, { // Usando DELETE /users/roles/{id}
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      set((state) => ({
        roles: state.roles.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Error deleting role:', error);
      set({ error: error.message, isLoading: false });
    }
  },
}));