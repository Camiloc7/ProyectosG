// src/components/auth/AuthInitializer.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { FONDO, ORANGE } from "@/styles/colors";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SUPERVISOR"
  | "CAJERO"
  | "COCINERO"
  | "MESERO"
  | "DOMICILIARIO";

interface AuthInitializerProps {
  children: React.ReactNode;
}

// Rutas compartidas
const fullAccessRoutes = [
  "/dashboard",
  "/cajero",
  "/categorias",
  "/cierre-de-caja",
  "/configuracion",
  "/cocinero",
  "/cuentas",
  "/empleados",
  "/ingredientes",
  "/mesero",
  "/mesas",
  "/pedidos",
  "/productos",
  "/proveedores",
  "/domiciliario",
];

const roleRoutes: Record<UserRole, string[]> = {
  SUPER_ADMIN: fullAccessRoutes,
  ADMIN: fullAccessRoutes,
  SUPERVISOR: fullAccessRoutes,
  CAJERO: ["/cajero", "/cierre-de-caja", "/pedidos"],
  COCINERO: ["/cocinero"],
  MESERO: ["/mesero", "/cajero/crear_pedido", "/cajero"],
  DOMICILIARIO: ["/domiciliario"],
};

// Función para validar token
const isTokenExpired = (token: string | null) => {
  if (!token) return true;
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return !exp || Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

export default function AuthInitializer({ children }: AuthInitializerProps) {
  const { isAuthenticated, loading, user, token, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Memoizamos todas las rutas protegidas
  const allProtectedRoutes = useMemo(
    () => Object.values(roleRoutes).flat(),
    []
  );

  const isUserAllowed = (role: UserRole, path: string) => {
    return roleRoutes[role].some(
      (route) => route === path || path.startsWith(route + "/")
    );
  };

  // Activamos render del cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Efecto principal de autenticación y autorización
  useEffect(() => {
    if (!isClient) return;

    // Logout si no hay token válido
    if (!token || isTokenExpired(token)) {
      logout();
      // Solo redirige si no es una ruta pública
      if (!publicRoutes.includes(pathname)) {
        router.push("/");
      }
      return;
    }

    const protectedRoute = isRouteProtected(pathname);

    // Si el usuario no está autenticado, redirige al login
    if (protectedRoute && !isAuthenticated && !loading) {
      router.push("/");
      return;
    }

    // Validar permisos por rol
    if (isAuthenticated && user?.rol) {
      const userRole = user.rol as UserRole;
      if (protectedRoute && !isUserAllowed(userRole, pathname)) {
        router.push(roleRoutes[userRole][0]);
      }
    }
  }, [
    isClient,
    isAuthenticated,
    loading,
    pathname,
    token,
    user,
    logout,
    router,
  ]);

  const publicRoutes = ["/", "/terminos", "/terminosWeb"];

  const isRouteProtected = (path: string) => {
    if (publicRoutes.includes(path)) return false; // Nunca proteger estas
    return allProtectedRoutes.some(
      (route) => route === path || path.startsWith(route + "/")
    );
  };

  // Loader mientras se valida autenticación o render cliente
  if (loading || !isClient) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen"
        style={{ backgroundColor: FONDO }}
      >
        <Loader2 size={50} className="animate-spin" style={{ color: ORANGE }} />
        <p className="mt-4 text-lg text-gray-700">Cargando...</p>
      </div>
    );
  }

  return <>{children}</>;
}
