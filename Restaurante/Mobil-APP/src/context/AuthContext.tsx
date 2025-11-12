import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { Alert } from "react-native";
import { AuthTokenPayload, UserRole, Role, AuthUser } from "../types/auth"; // Asegúrate de que estos tipos estén definidos.
import { fetchRoles } from "../api/roles";

interface AuthContextType {
  userToken: string | null;
  userRole: UserRole | null;
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
interface AuthProviderProps {
  children: ReactNode;
}
function AuthProvider({ children }: AuthProviderProps) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rolesMap, setRolesMap] = useState<Map<string, UserRole>>(new Map());

  useEffect(() => {
    const bootstrapAuth = async () => {
      setIsLoading(true);
      let token: string | null = null;
      try {
        token = await AsyncStorage.getItem("userToken");
        if (!token) return;

        const decodedToken = jwtDecode<AuthTokenPayload>(token);
        const userDetails: AuthUser = {
          id: decodedToken.id,
          username: decodedToken.username,
          rol: decodedToken.rol,
          establecimiento_id: decodedToken.establecimiento_id,
          nombre_establecimiento: decodedToken.nombre_establecimiento,
        };
        setUserRole(decodedToken.rol);
        setUser(userDetails);
        setUserToken(token);
      } catch (e: any) {
        console.error("Error al restaurar la sesión o cargar roles:", e);
        Alert.alert(
          "Error de inicio",
          "No se pudo cargar la sesión o los roles. Inténtalo de nuevo."
        );
        await AsyncStorage.removeItem("userToken");
        setUserToken(null);
        setUserRole(null);
        setUser(null);
        setRolesMap(new Map());
      } finally {
        setIsLoading(false);
      }
    };
    bootstrapAuth();
  }, []);

  const authContext = useMemo(
    () => ({
      signIn: async (token: string) => {
        setIsLoading(true);
        try {
          await AsyncStorage.setItem("userToken", token);
          const decodedToken = jwtDecode<AuthTokenPayload>(token);

          const userDetails: AuthUser = {
            id: decodedToken.id,
            username: decodedToken.username,
            rol: decodedToken.rol_id,
            establecimiento_id: decodedToken.establecimiento_id,
            nombre_establecimiento: decodedToken.nombre_establecimiento,
          };

          setUserRole(decodedToken.rol); // ← cambia esto
          setUserToken(token);
          setUser(userDetails);
        } catch (e: any) {
          // manejo de error igual que ahora
        } finally {
          setIsLoading(false);
        }
      },

      signOut: async () => {
        setIsLoading(true);
        await AsyncStorage.removeItem("userToken");
        // Y esta otra
        // await AsyncStorage.removeItem('userDetails');
        setUserToken(null);
        setUserRole(null);
        setUser(null);
        setIsLoading(false);
      },
      userToken,
      userRole,
      user,
      isLoading,
    }),
    [userToken, userRole, isLoading, rolesMap, user]
  );

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
}

export default AuthProvider;
