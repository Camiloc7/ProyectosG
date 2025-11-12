"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Settings,
  Users,
  Table,
  Pizza,
  Apple,
  Utensils,
  Truck,
  CreditCardIcon,
  Ticket,
  ReceiptText,
  Package,
  BarChart3,
  PersonStanding,
  Menu as MenuIcon,
  X,
  ArrowRight,
  ChefHat,
  HomeIcon,
  ShoppingBag,
} from "lucide-react";
import { TbCashRegister } from "react-icons/tb";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";
import Image from "next/image";
import logoCami from "../../assets/logoCami.jpeg";

// 🔹 Definimos estructura
type Route =
  | { label: string; href: string; icon: any; group: string }
  | { label: string; action: () => void; icon: any; group: string };

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // estado escritorio expandido
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const path = usePathname();
  const { user, token } = useAuthStore();

  // ✅ Cerrar sidebar cuando cambia la ruta en mobile
  useEffect(() => {
    setIsOpen(false);
    if (isMobile) {
      setIsOpen(false);
    }
  }, [path, isMobile]);

  // ✅ Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const redireccionarAQualityBill = () => {
    if (!token) {
      toast.error("No hay token de autenticación disponible.");
      return;
    }

    const url = "https://facturando.qualitysoftservices.com";

    const nuevaVentana = window.open(`${url}/redireccion`, "_blank");
    if (!nuevaVentana) {
      toast.error("No se pudo abrir la ventana.");
      return;
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== url) return;
      if (event.data?.ready) {
        nuevaVentana.postMessage({ gastroToken: token }, url);
        window.removeEventListener("message", handleMessage);
      }
    };
    window.addEventListener("message", handleMessage);
  };

  const redireccionarAQualitySoft = () => {
    if (!token) {
      toast.error("No hay token de autenticación disponible.");
      return;
    }
    const url = "https://qualitysoft.netlify.app";
    // const url = "http://localhost:3001";
    const nuevaVentana = window.open(`${url}/redireccion`, "_blank");
    if (!nuevaVentana) {
      toast.error("No se pudo abrir la ventana.");
      return;
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== url) return;
      if (event.data?.ready) {
        nuevaVentana.postMessage({ gastroToken: token }, url);
        window.removeEventListener("message", handleMessage);
      }
    };
    window.addEventListener("message", handleMessage);
  };

  // 🔹 Rutas por rol
  let routes: Route[] = [];
  if (user?.rol === "CAJERO") {
    routes = [
      {
        label: "Caja",
        href: "/cajero",
        icon: TbCashRegister,
        group: "Operaciones",
      },
      {
        label: "Lista Cierre Caja",
        href: "/cierre-de-caja",
        icon: Package,
        group: "Operaciones",
      },
      {
        label: "Pedidos",
        href: "/pedidos",
        icon: Ticket,
        group: "Operaciones",
      },
    ];
  } else if (user?.rol === "ADMIN" || user?.rol === "SUPER_ADMIN") {
    routes = [
      { label: "Inicio", href: "/dashboard", icon: HomeIcon, group: "Inicio" },

      // Gestión de restaurante
      { label: "Mesas", href: "/mesas", icon: Table, group: "Menu" },
      {
        label: "Categorías",
        href: "/categorias",
        icon: Pizza,
        group: "Menu",
      },
      {
        label: "Ingredientes",
        href: "/ingredientes",
        icon: Apple,
        group: "Menu",
      },
      {
        label: "Compras",
        href: "/compras",
        icon: ShoppingBag,
        group: "Menu",
      },
      {
        label: "Productos",
        href: "/productos",
        icon: Utensils,
        group: "Menu",
      },
      { label: "Empleados", href: "/empleados", icon: Users, group: "Gestión" },
      {
        label: "Proveedores",
        href: "/proveedores",
        icon: Truck,
        group: "Gestión",
      },
      {
        label: "Cuentas",
        href: "/cuentas",
        icon: CreditCardIcon,
        group: "Gestión",
      },
      {
        label: "Lista Cierre Caja",
        href: "/cierre-de-caja",
        icon: Package,
        group: "Gestión",
      },

      // Caja y pedidos
      {
        label: "Caja",
        href: "/cajero",
        icon: TbCashRegister,
        group: "Operaciones",
      },
      {
        label: "Pedidos",
        href: "/pedidos",
        icon: Ticket,
        group: "Operaciones",
      },

      // Reportes
      {
        label: "Reportes",
        href: "/reportes",
        icon: BarChart3,
        group: "Reportes",
      },

      // Configuración
      {
        label: "Configuración",
        href: "/configuracion",
        icon: Settings,
        group: "Configuración",
      },
      // Externos
      {
        label: "Facturación electrónica",
        action: () => redireccionarAQualityBill(),
        icon: ReceiptText,
        group: "Integraciones",
      },
      {
        label: "Gestión Humana",
        action: () => redireccionarAQualitySoft(),
        icon: PersonStanding,
        group: "Integraciones",
      },
    ];
  } else if (user?.rol === "COCINERO") {
    routes = [
      {
        label: "Cocinero",
        href: "/cocinero",
        icon: ChefHat,
        group: "Cocina",
      },
    ];
  }

  // 🔹 Agrupamos por `group`
  const groupedRoutes = routes.reduce<Record<string, Route[]>>((acc, route) => {
    acc[route.group] = acc[route.group] || [];
    acc[route.group].push(route);
    return acc;
  }, {});

  // Width dinámico
  const sidebarWidth = isMobile
    ? isMobileMenuOpen
      ? 240
      : 0
    : isOpen
    ? 240
    : 72;

  if (
    path === "/" ||
    path === "/terminos" ||
    path === "/terminosWeb" ||
    path === "/mesero" ||
    path === "/cocinero"
  ) {
    return <></>; // <-- Aquí el componente ya ejecutó hooks, ahora sí puedes condicionar el render
  }

  return (
    <>
      {/* Botón menú solo visible en mobile */}
      {isMobile && !isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`fixed top-4 ${
            isMobileMenuOpen ? "left-2" : "left-4"
          } z-50 p-2 bg-orange-500 text-white rounded-lg shadow-lg hover:bg-orange-600 transition`}
        >
          <ArrowRight size={24} />
        </button>
      )}

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        className="fixed top-0 left-0 h-screen 
             bg-gradient-to-b from-black to-[#ff7f00] 
             text-white flex flex-col shadow-xl z-40 
             overflow-x-hidden" // 🔹 clave
      >
        {/* Header Sidebar */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
          {isOpen && (
            <>
              <span
                className={`text-lg font-bold transition-opacity ${
                  !isOpen && !isMobile ? "opacity-0" : "opacity-100"
                }`}
              >
                Gastro POS
              </span>
              <Image
                src={logoCami}
                alt="Logo"
                width={30}
                height={30}
                className="object-cover rounded-full"
              />
            </>
          )}

          {/* Botón expandir/colapsar en escritorio */}
          {!isMobile && (
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="ml-2 p-1 rounded hover:bg-white/10 transition"
            >
              <MenuIcon size={20} />
            </button>
          )}
        </div>

        {/* Links agrupados */}
        <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto">
          {Object.entries(groupedRoutes).map(([group, groupRoutes]) => (
            <div key={group}>
              <h3
                className={`px-3 mb-2 text-xs font-semibold uppercase tracking-wider ${
                  !isOpen && !isMobile ? "hidden" : "text-gray-400"
                }`}
              >
                {group}
              </h3>
              <div className="space-y-1">
                {groupRoutes.map((route) => {
                  const active = "href" in route && path.startsWith(route.href);
                  return "href" in route ? (
                    <Link
                      key={route.href}
                      href={route.href}
                      className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 ${
                        active ? "bg-white/10 text-orange-400" : "text-gray-300"
                      }`}
                    >
                      <route.icon size={20} className="shrink-0" />
                      <span
                        className={`ml-3 whitespace-nowrap transition-all duration-300 overflow-hidden
    ${!isOpen && !isMobile ? "opacity-0 w-0" : "opacity-100 w-auto"}
  `}
                      >
                        {route.label}
                      </span>
                    </Link>
                  ) : (
                    <button
                      key={route.label}
                      onClick={route.action}
                      className="flex items-center w-full rounded-xl px-3 py-2 text-sm font-medium text-gray-300  hover:bg-white/10 transition"
                    >
                      <route.icon size={20} className="shrink-0" />
                      <span
                        className={`ml-3 whitespace-nowrap transition-opacity duration-300 overflow-hidden ${
                          !isOpen && !isMobile
                            ? "opacity-0 w-0"
                            : "opacity-100 w-auto"
                        }`}
                      >
                        {route.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </motion.aside>

      {/* Overlay con animación (solo móvil) */}
      <AnimatePresence>
        {(isMobile && isMobileMenuOpen) || (!isMobile && isOpen) ? (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-30"
            onClick={() => {
              if (isMobile) setIsMobileMenuOpen(false);
              else setIsOpen(false); // 🔹 añade esto para escritorio
            }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
