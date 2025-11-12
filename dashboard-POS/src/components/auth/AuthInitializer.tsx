// src/components/auth/AuthInitializer.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { FONDO, ORANGE } from "@/styles/colors";
import { Loader2 } from "lucide-react"; 
import { usePathname, useRouter } from "next/navigation";
type UserRole = "SUPER_ADMIN" | "ADMIN" | "SUPERVISOR" | "CAJERO" | "COCINERO" | "MESERO" | "DOMICILIARIO";
interface AuthInitializerProps {
  children: React.ReactNode;
}
const roleRoutes: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    "/dashboard",
    "/cajero",
    "/categorias",
    "/cierre-de-caja",
    "/configuracion",
    "/cuentas",
    "/empleados",
    "/ingredientes",
    "/mesero",
    "/mesas",
    "/pedidos",
    "/productos",
    "/proveedores",
    "/domiciliario", 

  ],
  ADMIN: [
    "/dashboard",
    "/cajero",
    "/categorias",
    "/cierre-de-caja",
    "/configuracion",
    "/cuentas",
    "/empleados",
    "/ingredientes",
    "/mesero",
    "/mesas",
    "/pedidos",
    "/productos",
    "/proveedores",
    "/domiciliario", 
  ],
  SUPERVISOR: [
    "/dashboard",
    "/cajero",
    "/categorias",
    "/cierre-de-caja",
    "/configuracion",
    "/cuentas",
    "/empleados",
    "/ingredientes",
    "/mesero",
    "/mesas",
    "/pedidos",
    "/productos",
    "/proveedores",
    "/domiciliario", 
  ],
  CAJERO: [
    "/cajero",
    "/cierre-de-caja",
    "/pedidos",
  ],
  COCINERO: [
    "/cocinero", 
  ],
  MESERO: [
    "/mesero",
  ],
  DOMICILIARIO: [
    "/domiciliario", 
  ],
};
const allProtectedRoutes = Object.values(roleRoutes).flat();
export default function AuthInitializer({ children }: AuthInitializerProps) {
  const { isAuthenticated, loading, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  useEffect(() => {
    if (isClient) {
      const isProtectedRoute = allProtectedRoutes.some((route) =>
        pathname.startsWith(route)
      );
      if (isProtectedRoute && !isAuthenticated && !loading) {
        router.push("/");
        return;
      }

      if (isAuthenticated && user?.rol) {
        const userRole = user.rol as UserRole;
        const userAllowedRoutes = roleRoutes[userRole];
        const isUserAllowed = userAllowedRoutes.some((route) =>
          pathname.startsWith(route)
        );
        if (isProtectedRoute && !isUserAllowed) {
          router.push(userAllowedRoutes[0]);
        }
      }
    }
  }, [isAuthenticated, loading, pathname, router, isClient, user]);
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



// // src/components/auth/AuthInitializer.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useAuthStore } from "@/stores/authStore";
// import { FONDO, ORANGE } from "@/styles/colors";
// import { Loader2 } from "lucide-react"; 
// import { usePathname, useRouter } from "next/navigation";

// interface AuthInitializerProps {
//   children: React.ReactNode;
// }

// const protectedRoutes = [ 
//   "/dashboard",
//   "/cajero",
//   "/categorias",
//   "/cierre-de-caja",
//   "/configuracion",
//   "/cuentas",
//   "/empleados",
//   "/ingredientes",
//   "/mesas",
//   "/pedidos",
//   "/productos",
//   "/proveedores",
// ];

// export default function AuthInitializer({ children }: AuthInitializerProps) {
//   const { isAuthenticated, loading } = useAuthStore();
//   const router = useRouter();
//   const pathname = usePathname();
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   useEffect(() => {
//     if (isClient) {
//       const isProtectedRoute = protectedRoutes.some((route) =>
//         pathname.startsWith(route)
//       );

//       if (isProtectedRoute && !isAuthenticated && !loading) {
//         router.push("/");
//       }
//     }
//   }, [isAuthenticated, loading, pathname, router, isClient]);

//   if (loading || !isClient) {
//     return (
//       <div
//         className="flex flex-col items-center justify-center min-h-screen"
//         style={{ backgroundColor: FONDO }}
//       >
//         <Loader2 size={50} className="animate-spin" style={{ color: ORANGE }} />
//         <p className="mt-4 text-lg text-gray-700">Cargando...</p>
//       </div>
//     );
//   }

//   return <>{children}</>;
// }
