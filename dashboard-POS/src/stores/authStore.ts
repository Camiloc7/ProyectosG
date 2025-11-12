import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import { RUTA } from "@/helpers/rutas";
import toast from "react-hot-toast";

export interface JwtPayload {
  id: string;
  username: string;
  rol: string;
  establecimiento_id: string;
  iat: number;
  exp: number;
}
export type User = JwtPayload;

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  loginAsync: (username: string, password: string) => Promise<void>;
};

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      loginAsync: async (username, password) => {
        set({ loading: true });
        try {
          const res = await fetch(`${RUTA}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          const responseData = await res.json();

          if (!res.ok) {
            toast.error(
              responseData.message || "Error en el inicio de sesión."
            );
            throw new Error(responseData.message || "Error en login");
          }

          const token = responseData.data.access_token;
          const decodedUser = jwtDecode<JwtPayload>(token);
          const loggedInUser: User = decodedUser;

          set({
            user: loggedInUser,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error("Login fallido:", error);
          set({ isAuthenticated: false });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
